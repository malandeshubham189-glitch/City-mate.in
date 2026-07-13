import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Send,
  Paperclip,
  Check,
  CheckCheck,
  Circle,
  FileText,
  Video,
  MapPin,
  Clock,
  User,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronLeft,
  X,
  FileDown,
  Info
} from "lucide-react";
import {
  subscribeToConversations,
  subscribeToMessages,
  subscribeToPresence,
  updateUserPresence,
  updateTypingStatus,
  sendChatMessage,
  markConversationAsRead
} from "../../services/chatService";
import { ChatConversation, P2PChatMessage } from "../../types";
import { db } from "../../lib/firebase";
import { collection, addDoc } from "firebase/firestore";

interface ChatTerminalProps {
  darkMode: boolean;
  currentUser: any;
  onClose?: () => void;
  preselectedConversationId?: string;
}

export default function ChatTerminal({ darkMode, currentUser, onClose, preselectedConversationId }: ChatTerminalProps) {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<P2PChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [peerPresence, setPeerPresence] = useState<Record<string, "online" | "offline">>({});
  const [conversationsLoading, setConversationsLoading] = useState(true);

  // Attachment mock state
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Subscribe to user presence
  useEffect(() => {
    if (!currentUser?.uid) return;
    updateUserPresence(currentUser.uid, "online");

    // Reset to offline on unmount
    return () => {
      if (currentUser?.uid) {
        updateUserPresence(currentUser.uid, "offline");
      }
    };
  }, [currentUser?.uid]);

  // Subscribe to Conversations list
  useEffect(() => {
    if (!currentUser?.uid) return;
    setConversationsLoading(true);
    const unsub = subscribeToConversations(currentUser.uid, (list) => {
      setConversations(list);
      setConversationsLoading(false);

      // Keep selected conversation in sync if it updates
      if (selectedConv) {
        const updated = list.find((c) => c.id === selectedConv.id);
        if (updated) setSelectedConv(updated);
      }
    });

    return () => unsub();
  }, [currentUser?.uid, selectedConv?.id]);

  // Hook to handle preselected conversation id
  useEffect(() => {
    if (preselectedConversationId && conversations.length > 0) {
      const found = conversations.find((c) => c.id === preselectedConversationId);
      if (found) {
        setSelectedConv(found);
      }
    }
  }, [preselectedConversationId, conversations]);

  // Subscribe to messages of selected conversation
  useEffect(() => {
    if (!selectedConv?.id || !currentUser?.uid) {
      setMessages([]);
      return;
    }

    // Mark as read immediately when selected
    markConversationAsRead(selectedConv.id, currentUser.uid);

    const unsub = subscribeToMessages(selectedConv.id, (msgs) => {
      setMessages(msgs);
      
      // Auto-scroll to bottom
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    });

    return () => unsub();
  }, [selectedConv?.id, currentUser?.uid]);

  // Subscribe to presences of conversation participants
  useEffect(() => {
    if (conversations.length === 0 || !currentUser?.uid) return;

    // Extract peer IDs
    const peerIds = Array.from(
      new Set(
        conversations.flatMap((c) =>
          c.participants.filter((pId) => pId !== currentUser.uid)
        )
      )
    );

    const unsub = subscribeToPresence(peerIds as string[], (presMap) => {
      setPeerPresence(presMap);
    });

    return () => unsub();
  }, [conversations, currentUser?.uid]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!selectedConv || !currentUser?.uid) return;

    // Handle typing indicator trigger
    if (!isTyping) {
      setIsTyping(true);
      updateTypingStatus(selectedConv.id, currentUser.uid, true);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      updateTypingStatus(selectedConv.id, currentUser.uid, false);
    }, 2000);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedConv || !currentUser?.uid) return;

    const peerId = selectedConv.participants.find((p) => p !== currentUser.uid) || "";
    const textToSend = inputText;
    setInputText("");

    // Turn off typing indicator
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setIsTyping(false);
    updateTypingStatus(selectedConv.id, currentUser.uid, false);

    try {
      await sendChatMessage(
        selectedConv.id,
        currentUser.uid,
        currentUser.name || "CityMate User",
        textToSend,
        peerId
      );

      // Store a notification in Firestore which will trigger a real-time toaster for the peer!
      await addDoc(collection(db, "notifications"), {
        userId: peerId,
        title: "New Peer Message Received ✉",
        message: `${currentUser.name || "A peer"} sent: "${textToSend.length > 50 ? textToSend.substring(0, 47) + '...' : textToSend}"`,
        type: "message",
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error("Message dispatch failure:", err);
    }
  };

  // Predefined simulated files for relocation coordination
  const handleAttachSimulatedFile = async (type: "agreement" | "video" | "map") => {
    if (!selectedConv || !currentUser?.uid) return;

    const peerId = selectedConv.participants.find((p) => p !== currentUser.uid) || "";
    setShowAttachmentMenu(false);

    let mediaUrl = "";
    let mediaType: "image" | "document" | "map" = "document";
    let messageText = "";

    if (type === "agreement") {
      mediaUrl = "https://example.com/mock-draft-agreement.pdf";
      mediaType = "document";
      messageText = "Draft Shared Roommate Occupancy Agreement.pdf";
    } else if (type === "video") {
      mediaUrl = "https://example.com/video-tour-3bhk.mp4";
      mediaType = "image";
      messageText = "3BHK Flat Walkthrough Tour Video Clip";
    } else {
      mediaUrl = "https://example.com/metro-coordinates";
      mediaType = "map";
      messageText = "Metro connectivity map near HSR Layout 4th Sector";
    }

    try {
      await sendChatMessage(
        selectedConv.id,
        currentUser.uid,
        currentUser.name || "CityMate User",
        messageText,
        peerId,
        mediaUrl,
        mediaType
      );

      // Store a notification in Firestore which will trigger a real-time toaster for the peer!
      await addDoc(collection(db, "notifications"), {
        userId: peerId,
        title: "New Document Shared 📎",
        message: `${currentUser.name || "A peer"} uploaded: "${messageText}"`,
        type: "info",
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredConvs = conversations.filter((c) => {
    const peerId = c.participants.find((p) => p !== currentUser?.uid) || "";
    const peerName = c.participantNames[peerId] || "Verification desk";
    return peerName.toLowerCase().includes(searchFilter.toLowerCase());
  });

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-2xl h-[560px] flex overflow-hidden backdrop-blur-md relative text-left">
      
      {/* SIDEBAR: Conversation List */}
      <div className={`w-full md:w-80 border-r border-slate-900 flex flex-col shrink-0 ${
        selectedConv ? "hidden md:flex" : "flex"
      }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-900 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5" /> Cyber Encrypted Desk
            </h3>
            {onClose && (
              <button onClick={onClose} className="text-slate-500 hover:text-white md:hidden">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search chat channels..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-900 rounded-xl text-[11px] py-1.5 pl-8 pr-3 text-slate-200 focus:outline-none"
            />
          </div>
        </div>

        {/* Conversations Loop */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-900/40">
          {conversationsLoading ? (
            <div className="p-4 text-center text-xs text-slate-500 animate-pulse">
              Syncing presence matrix channels...
            </div>
          ) : filteredConvs.length === 0 ? (
            <div className="p-8 text-center text-[10px] text-slate-600 leading-relaxed">
              No active secure threads found. Initiate threads directly from flatmate queries or community boards.
            </div>
          ) : (
            filteredConvs.map((conv) => {
              const peerId = conv.participants.find((p) => p !== currentUser?.uid) || "";
              const peerName = conv.participantNames[peerId] || "Community Member";
              const isPeerOnline = peerPresence[peerId] === "online";
              const isSelected = selectedConv?.id === conv.id;
              const unread = conv.unreadCount?.[currentUser?.uid || ""] || 0;

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv)}
                  className={`w-full text-left p-3.5 flex gap-3 transition-colors cursor-pointer border-l-2 ${
                    isSelected
                      ? "bg-indigo-950/25 border-indigo-500"
                      : "border-transparent hover:bg-slate-900/30"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-9 w-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-black text-indigo-300">
                      {peerName.charAt(0).toUpperCase()}
                    </div>
                    <Circle className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-slate-950 ${
                      isPeerOnline ? "fill-emerald-400 text-emerald-400" : "fill-slate-600 text-slate-600"
                    }`} />
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex justify-between items-baseline">
                      <h4 className="text-xs font-black text-slate-200 truncate">{peerName}</h4>
                      <span className="text-[8px] text-slate-500 font-mono">
                        {new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate leading-snug">
                      {conv.lastMessageText}
                    </p>
                  </div>

                  {unread > 0 && (
                    <span className="h-4.5 min-w-[18px] bg-indigo-600 text-[9px] font-black text-white rounded-full flex items-center justify-center shrink-0">
                      {unread}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT WINDOW: Messages View */}
      <div className={`flex-grow flex flex-col min-w-0 ${
        !selectedConv ? "hidden md:flex justify-center items-center bg-slate-950/25" : "flex"
      }`}>
        {selectedConv ? (
          <>
            {/* Active Header */}
            <div className="p-4 border-b border-slate-900 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="p-1 text-slate-400 hover:text-white md:hidden cursor-pointer"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div>
                  <h3 className="text-xs font-black text-slate-200 truncate flex items-center gap-1.5">
                    {selectedConv.participantNames[selectedConv.participants.find((p) => p !== currentUser?.uid) || ""] || "Community Member"}
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  </h3>
                  <div className="flex items-center gap-1 text-[9px] text-slate-500">
                    <span className="flex items-center gap-1 font-semibold">
                      <Circle className={`h-1.5 w-1.5 rounded-full ${
                        peerPresence[selectedConv.participants.find((p) => p !== currentUser?.uid) || ""] === "online"
                          ? "fill-emerald-400 text-emerald-400"
                          : "fill-slate-600 text-slate-600"
                      }`} />
                      {peerPresence[selectedConv.participants.find((p) => p !== currentUser?.uid) || ""] === "online" ? "Active Presence" : "Presence offline"}
                    </span>
                    {selectedConv.typing?.[selectedConv.participants.find((p) => p !== currentUser?.uid) || ""] && (
                      <span className="text-indigo-400 font-bold animate-pulse ml-1.5">typing...</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Informative info banner */}
              <div className="text-[10px] text-emerald-400 bg-emerald-950/20 border border-emerald-900/50 px-2 py-1 rounded-lg flex items-center gap-1 font-bold">
                <ShieldCheck className="h-3.5 w-3.5 shrink-0" /> Encrypted P2P tunnel
              </div>
            </div>

            {/* Messages Pane */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              <div className="text-center py-2">
                <span className="text-[8px] uppercase tracking-wider font-bold text-slate-600 bg-slate-900/40 border border-slate-900 px-2.5 py-0.5 rounded-full">
                  Beginning of Cryptographic session log
                </span>
              </div>

              {messages.map((msg, index) => {
                const isMe = msg.senderId === currentUser?.uid;

                return (
                  <motion.div
                    key={msg.id || index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className="space-y-1 max-w-[80%] text-left">
                      <div className={`p-3 rounded-2xl text-xs space-y-1.5 ${
                        isMe
                          ? "bg-indigo-600 text-white rounded-tr-none"
                          : "bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none"
                      }`}>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                        {/* If Media Attachment exists */}
                        {msg.mediaUrl && (
                          <div className={`rounded-xl border p-2.5 flex items-center justify-between gap-3 ${
                            isMe ? "bg-indigo-700/50 border-indigo-500/30" : "bg-slate-950/80 border-slate-800"
                          }`}>
                            <div className="flex items-center gap-2 min-w-0">
                              {msg.mediaType === "document" ? (
                                <FileText className="h-5 w-5 text-indigo-300 shrink-0" />
                              ) : msg.mediaType === "map" ? (
                                <MapPin className="h-5 w-5 text-emerald-400 shrink-0" />
                              ) : (
                                <Video className="h-5 w-5 text-purple-400 shrink-0" />
                              )}
                              <div className="min-w-0 text-[10px]">
                                <p className="font-bold truncate text-slate-200">Shared Relocation Asset</p>
                                <p className="opacity-70 text-[9px] truncate">Secure sandbox attachment</p>
                              </div>
                            </div>
                            <button
                              onClick={() => alert(`Initiating secure direct browser download: ${msg.mediaUrl}`)}
                              className="text-indigo-400 hover:text-indigo-300 p-1 bg-slate-900 rounded-lg shrink-0 cursor-pointer"
                            >
                              <FileDown className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Msg footer */}
                      <div className={`flex items-center gap-1 text-[8px] font-mono text-slate-500 ${
                        isMe ? "justify-end" : "justify-start"
                      }`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        {isMe && (
                          msg.read ? (
                            <CheckCheck className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Check className="h-3 w-3" />
                          )
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Desk */}
            <div className="p-4 border-t border-slate-900 bg-slate-950/60 relative">
              
              {/* Attachment Popup menu */}
              <AnimatePresence>
                {showAttachmentMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 15 }}
                    className="absolute bottom-16 left-4 bg-slate-950 border border-slate-800 rounded-xl p-2.5 w-60 shadow-2xl space-y-1.5 text-left z-20"
                  >
                    <span className="text-[8px] font-black uppercase text-slate-500 tracking-wider block px-1.5">
                      Verify & Share Assets
                    </span>
                    <button
                      onClick={() => handleAttachSimulatedFile("agreement")}
                      className="w-full text-left p-2 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4 text-indigo-400" /> Draft Occupancy Agreement
                    </button>
                    <button
                      onClick={() => handleAttachSimulatedFile("video")}
                      className="w-full text-left p-2 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-2"
                    >
                      <Video className="h-4 w-4 text-purple-400" /> Flat Tour walk-through clip
                    </button>
                    <button
                      onClick={() => handleAttachSimulatedFile("map")}
                      className="w-full text-left p-2 hover:bg-slate-900 rounded-lg text-xs font-semibold text-slate-300 flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4 text-emerald-400" /> Nearby Bus/Metro stations map
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              <form onSubmit={handleSendMessage} className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                  className="bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 p-2.5 rounded-xl cursor-pointer transition-colors shrink-0"
                >
                  <Paperclip className="h-4.5 w-4.5" />
                </button>
                <input
                  type="text"
                  required
                  placeholder="Type a cryptographic message thread..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 bg-slate-900 border border-slate-900 rounded-xl px-3.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white p-2.5 rounded-xl cursor-pointer transition-colors shrink-0"
                >
                  <Send className="h-4.5 w-4.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center p-8 text-center space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-950/45 border border-indigo-900/50 flex items-center justify-center text-indigo-400">
              <MessageSquare className="h-7 w-7" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h4 className="text-sm font-black text-slate-200 uppercase tracking-wider">Secure Communication Hub</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Connect and arrange flat rentals, sharing agreements, food boxes, or roommate arrangements instantly. Your real identity details remain completely sealed behind standard cryptographic token tunnels.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
