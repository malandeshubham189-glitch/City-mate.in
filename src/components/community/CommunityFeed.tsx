import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MessageSquare,
  Sparkles,
  Heart,
  TrendingUp,
  MapPin,
  Send,
  Plus,
  Compass,
  DollarSign,
  Calendar,
  Users,
  Search,
  CheckCircle,
  Hash,
  AlertCircle,
  Filter
} from "lucide-react";
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  increment 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { CommunityPost, CommunityComment } from "../../types";

interface CommunityFeedProps {
  darkMode: boolean;
  currentUser: any;
  onNavigateToTab?: (tab: string) => void;
}

const CHANNELS = [
  { id: "all", label: "All Feeds", desc: "View all topics", icon: Compass },
  { id: "RoommateSearch", label: "Flatmates Wanted", desc: "Verified Seeker Matchmaking", icon: Users },
  { id: "BengaluruTech", label: "Bengaluru Tech Hub", desc: "Tech discussions & PG referrals", icon: Hash },
  { id: "PuneFlats", label: "Pune Flats Matrix", desc: "Broker-free flat listings & reviews", icon: Hash },
  { id: "TiffinReviews", label: "Tiffin & Mess Reviews", desc: "Regional organic meal feedback", icon: Hash },
];

export default function CommunityFeed({ darkMode, currentUser, onNavigateToTab }: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [activeChannel, setActiveChannel] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // New Post Form State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newChannel, setNewChannel] = useState("RoommateSearch");
  const [isRoommateQuery, setIsRoommateQuery] = useState(true);
  
  // Roommate criteria
  const [roommateBudget, setRoommateBudget] = useState("10000");
  const [roommateGender, setRoommateGender] = useState("Any");
  const [roommateOccupation, setRoommateOccupation] = useState("Professional");
  const [roommateDate, setRoommateDate] = useState("");

  // Comment Thread State for individual posts
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, CommunityComment[]>>({});
  const [newCommentText, setNewCommentText] = useState("");

  // Realtime subscription to community posts
  useEffect(() => {
    setLoading(true);
    const postsRef = collection(db, "community_posts");
    let q = query(postsRef, orderBy("createdAt", "desc"));

    if (activeChannel !== "all") {
      q = query(postsRef, where("channel", "==", activeChannel), orderBy("createdAt", "desc"));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedPosts: CommunityPost[] = [];
      snapshot.forEach((docSnap) => {
        fetchedPosts.push({ id: docSnap.id, ...docSnap.data() } as CommunityPost);
      });
      setPosts(fetchedPosts);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "community_posts");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeChannel]);

  // Handle Comment Toggles
  useEffect(() => {
    if (!activeCommentPostId) return;

    const commentsRef = collection(db, "community_comments");
    const q = query(commentsRef, where("postId", "==", activeCommentPostId), orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentsList: CommunityComment[] = [];
      snapshot.forEach((docSnap) => {
        commentsList.push({ id: docSnap.id, ...docSnap.data() } as CommunityComment);
      });
      setCommentsMap(prev => ({
        ...prev,
        [activeCommentPostId]: commentsList
      }));
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, `community_comments/${activeCommentPostId}`);
    });

    return () => unsubscribe();
  }, [activeCommentPostId]);

  // Submit Post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please authenticate to make a community contribution.");
      return;
    }

    try {
      const postsCol = collection(db, "community_posts");
      const postPayload: Omit<CommunityPost, "id"> = {
        userId: currentUser.uid,
        userName: currentUser.name || "Anonymous Seeker",
        userAvatar: currentUser.photoURL || "",
        channel: newChannel,
        title: newTitle,
        content: newContent,
        upvotes: [],
        createdAt: new Date().toISOString(),
        commentsCount: 0,
        isRoommateQuery: newChannel === "RoommateSearch" ? isRoommateQuery : false,
        ...(newChannel === "RoommateSearch" && isRoommateQuery ? {
          roommatePrefs: {
            budget: Number(roommateBudget),
            gender: roommateGender,
            occupation: roommateOccupation,
            movingDate: roommateDate || new Date().toISOString().split('T')[0]
          }
        } : {})
      };

      await addDoc(postsCol, postPayload);
      
      // Reset form
      setNewTitle("");
      setNewContent("");
      setShowCreateModal(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, "community_posts");
    }
  };

  // Submit Comment
  const handleAddComment = async (postId: string) => {
    if (!currentUser) {
      alert("Please authenticate to submit comments.");
      return;
    }
    if (!newCommentText.trim()) return;

    try {
      const commentCol = collection(db, "community_comments");
      const newComment: Omit<CommunityComment, "id"> = {
        postId,
        userId: currentUser.uid,
        userName: currentUser.name || "Anonymous Seeker",
        userAvatar: currentUser.photoURL || "",
        content: newCommentText,
        createdAt: new Date().toISOString()
      };

      await addDoc(commentCol, newComment);

      // Increment commentsCount in post
      const postRef = doc(db, "community_posts", postId);
      await updateDoc(postRef, {
        commentsCount: increment(1)
      });

      setNewCommentText("");
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `community_comments_write/${postId}`);
    }
  };

  // Handle Upvotes
  const handleToggleUpvote = async (post: CommunityPost) => {
    if (!currentUser) {
      alert("Please login to upvote posts.");
      return;
    }

    const postRef = doc(db, "community_posts", post.id);
    const hasUpvoted = post.upvotes.includes(currentUser.uid);

    try {
      await updateDoc(postRef, {
        upvotes: hasUpvoted ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `community_posts/${post.id}/upvote`);
    }
  };

  // Direct Message transition from post
  const handleInitiateDirectMessage = async (post: CommunityPost) => {
    if (!currentUser) {
      alert("Please log in to initiate direct conversations.");
      return;
    }
    if (post.userId === currentUser.uid) {
      alert("This is your own contribution thread.");
      return;
    }

    // Generate unique conversation ID deterministically
    const participants = [currentUser.uid, post.userId].sort();
    const conversationId = `conv_${participants[0]}_${participants[1]}`;

    try {
      const convRef = doc(db, "conversations", conversationId);
      const convSnap = await getDoc(convRef);

      if (!convSnap.exists()) {
        const participantNames = {
          [currentUser.uid]: currentUser.name || "CityMate User",
          [post.userId]: post.userName || "Verified poster"
        };

        await setDoc(convRef, {
          id: conversationId,
          participants,
          participantNames,
          lastMessageText: `Conversation initiated regarding thread: ${post.title}`,
          lastMessageTime: new Date().toISOString(),
          unreadCount: {
            [currentUser.uid]: 0,
            [post.userId]: 1
          }
        });

        // Add initial message
        const messagesCol = collection(db, "messages");
        await addDoc(messagesCol, {
          conversationId,
          senderId: currentUser.uid,
          senderName: currentUser.name || "CityMate Seeker",
          content: `Hi ${post.userName}, I saw your post "${post.title}" on the community feed and wanted to connect!`,
          timestamp: new Date().toISOString(),
          read: false
        });
      }

      alert(`Direct chat thread established with ${post.userName}!`);
      if (onNavigateToTab) {
        onNavigateToTab("chats");
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `conversations/${conversationId}`);
    }
  };

  // Filter posts by search query
  const filteredPosts = posts.filter((p) => {
    const term = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(term) || p.content.toLowerCase().includes(term);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-1 text-left">
      
      {/* LEFT COLUMN: Channel Menu */}
      <div className="lg:col-span-3 space-y-4">
        <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Channels</span>
            <Filter className="h-3.5 w-3.5 text-slate-500" />
          </div>
          <div className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              return (
                <button
                  key={ch.id}
                  onClick={() => setActiveChannel(ch.id)}
                  className={`w-full text-left p-2.5 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
                    activeChannel === ch.id
                      ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-900/20"
                      : "bg-slate-900/40 border-slate-900 text-slate-400 hover:border-slate-800"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div className="min-w-0">
                    <p className="truncate leading-none">{ch.label}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Community Stats Widget */}
        <div className="hidden lg:block bg-slate-950/20 border border-slate-800/60 p-4 rounded-2xl space-y-2 text-xs">
          <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest block">FORUM MATRIX</span>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-400">Total Discussions:</span>
            <span className="text-slate-200">{posts.length} Threads</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-slate-400">Match Rate:</span>
            <span className="text-emerald-400">92.4% success</span>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed pt-1 border-t border-slate-900">
            Communicate safely inside regional boards. Use the message triggers to start private chats without revealing email or phone data.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN: Feed Threads */}
      <div className="lg:col-span-9 space-y-4">
        
        {/* Actions bar (Search & Write) */}
        <div className="flex flex-col sm:flex-row gap-3 bg-slate-950/40 border border-slate-800 p-3 rounded-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations, roommate criteria, PGs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 pl-9 pr-4 py-2 text-xs rounded-xl text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <button
            onClick={() => {
              if (!currentUser) {
                alert("Please authenticate to submit posts.");
                return;
              }
              setShowCreateModal(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs px-4 py-2 rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Start Discussion
          </button>
        </div>

        {/* Feed List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center items-center py-20 text-xs text-slate-400 gap-2">
              <div className="h-4 w-4 rounded-full border border-indigo-500 border-t-transparent animate-spin" />
              Loading real-time community boards...
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-slate-950/40 border border-slate-800 p-10 rounded-2xl text-center text-xs text-slate-500">
              No active discussions or roommate queries found inside this channel. Be the first to start a thread!
            </div>
          ) : (
            filteredPosts.map((post) => {
              const hasUpvoted = currentUser ? post.upvotes?.includes(currentUser.uid) : false;
              const isCommentExpanded = activeCommentPostId === post.id;

              return (
                <div
                  key={post.id}
                  className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-3.5 transition-all hover:border-slate-700/80"
                >
                  {/* User profile & channels info */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-indigo-950 border border-indigo-900 flex items-center justify-center text-xs font-black text-indigo-400">
                        {post.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-200">{post.userName}</h4>
                        <p className="text-[9px] text-slate-500 font-mono">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-900 border border-slate-800 text-indigo-400 px-2 py-0.5 rounded font-mono font-bold">
                      #{post.channel}
                    </span>
                  </div>

                  {/* Title & Body */}
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-bold text-slate-100">{post.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">{post.content}</p>
                  </div>

                  {/* Roommate criteria display if applicable */}
                  {post.isRoommateQuery && post.roommatePrefs && (
                    <div className="bg-slate-900/60 border border-indigo-500/10 p-3.5 rounded-xl grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Budget Limit</span>
                        <span className="text-xs font-bold text-emerald-400">₹{post.roommatePrefs.budget} /mo</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Gender Preference</span>
                        <span className="text-xs font-bold text-slate-300">{post.roommatePrefs.gender}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Occupation</span>
                        <span className="text-xs font-bold text-slate-300">{post.roommatePrefs.occupation}</span>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[9px] text-slate-500 uppercase font-black tracking-wider block">Target Move Date</span>
                        <span className="text-xs font-bold text-indigo-400">{post.roommatePrefs.movingDate}</span>
                      </div>
                    </div>
                  )}

                  {/* Interactions bar */}
                  <div className="flex gap-4 border-t border-slate-900 pt-3.5 text-xs text-slate-400 font-bold">
                    <button
                      onClick={() => handleToggleUpvote(post)}
                      className={`flex items-center gap-1.5 hover:text-rose-400 transition-colors ${
                        hasUpvoted ? "text-rose-500" : ""
                      }`}
                    >
                      <Heart className={`h-4.5 w-4.5 ${hasUpvoted ? "fill-rose-500" : ""}`} />
                      <span>{post.upvotes?.length || 0} Upvotes</span>
                    </button>
                    <button
                      onClick={() => setActiveCommentPostId(isCommentExpanded ? null : post.id)}
                      className="flex items-center gap-1.5 hover:text-indigo-400 transition-colors"
                    >
                      <MessageSquare className="h-4.5 w-4.5" />
                      <span>{post.commentsCount || 0} Comments</span>
                    </button>
                    {post.userId !== currentUser?.uid && (
                      <button
                        onClick={() => handleInitiateDirectMessage(post)}
                        className="ml-auto text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                      >
                        <Send className="h-3.5 w-3.5" /> Message poster
                      </button>
                    )}
                  </div>

                  {/* Expanded Comments section */}
                  {isCommentExpanded && (
                    <div className="mt-4 pt-4 border-t border-slate-900 space-y-4">
                      {/* Comments List */}
                      <div className="space-y-3">
                        {commentsMap[post.id] === undefined ? (
                          <div className="text-[10px] text-slate-500">Retrieving thread conversations...</div>
                        ) : commentsMap[post.id].length === 0 ? (
                          <div className="text-[10px] text-slate-500">No replies yet. Be the first to answer!</div>
                        ) : (
                          commentsMap[post.id].map((comment) => (
                            <div key={comment.id} className="bg-slate-900/30 p-2.5 rounded-xl border border-slate-900/60 flex gap-2.5 text-left">
                              <div className="h-6.5 w-6.5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-300 shrink-0">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-black text-slate-200">{comment.userName}</span>
                                  <span className="text-[8px] text-slate-500 font-mono">
                                    {new Date(comment.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-300 mt-0.5">{comment.content}</p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Add Comment input */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Write a constructive reply..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="flex-grow bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                        />
                        <button
                          onClick={() => handleAddComment(post.id)}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg cursor-pointer"
                        >
                          Comment
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

      </div>

      {/* CREATE POST MODAL */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-950 border border-slate-800 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl text-left"
            >
              <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-indigo-400" /> Construct Community Thread
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-slate-500 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-slate-500">Destination Channel</label>
                    <select
                      value={newChannel}
                      onChange={(e) => setNewChannel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300"
                    >
                      {CHANNELS.filter(c => c.id !== "all").map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {newChannel === "RoommateSearch" && (
                    <div className="space-y-1 flex flex-col justify-end">
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer py-1">
                        <input
                          type="checkbox"
                          checked={isRoommateQuery}
                          onChange={(e) => setIsRoommateQuery(e.target.checked)}
                          className="rounded border-slate-800 bg-slate-900"
                        />
                        <span>Attach roommate filters</span>
                      </label>
                    </div>
                  )}
                </div>

                {/* Optional Roommate parameters */}
                {newChannel === "RoommateSearch" && isRoommateQuery && (
                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block">Max Rent Budget</label>
                      <input
                        type="number"
                        placeholder="₹ Amount"
                        value={roommateBudget}
                        onChange={(e) => setRoommateBudget(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded text-xs p-1.5 text-slate-300 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block">Gender</label>
                      <select
                        value={roommateGender}
                        onChange={(e) => setRoommateGender(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded text-xs p-1.5 text-slate-300"
                      >
                        <option value="Any">Any Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block">Occupation</label>
                      <select
                        value={roommateOccupation}
                        onChange={(e) => setRoommateOccupation(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded text-xs p-1.5 text-slate-300"
                      >
                        <option value="Professional">Professional</option>
                        <option value="Student">Student</option>
                        <option value="Either">Either</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase font-bold text-slate-500 block">Moving Date</label>
                      <input
                        type="date"
                        value={roommateDate}
                        onChange={(e) => setRoommateDate(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded text-xs p-1.5 text-slate-300"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500">Thread Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Looking for flatmate in Viman Nagar 3BHK flat"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-slate-500">Thread Body</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Provide relevant micro-market details, food preferences, work schedule..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg text-xs p-2.5 text-slate-200 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs py-2.5 rounded-lg cursor-pointer"
                >
                  Publish Contribution
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
