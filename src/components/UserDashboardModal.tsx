import React, { useState, useEffect } from "react";
import { UserProfile, Listing, Enquiry, Favourite, Booking, Invoice, DirectMessage, DirectConversation } from "../types";
import SuperAppPartnerHub from "./SuperAppPartnerHub";
import CheckoutOverlay from "./payments/CheckoutOverlay";
import AIRelocationHub from "./dashboard/AIRelocationHub";
import RewardsWallet from "./dashboard/RewardsWallet";
import CommunityFeed from "./community/CommunityFeed";
import ChatTerminal from "./messaging/ChatTerminal";
import CityGuideExplorer from "./guides/CityGuideExplorer";
import { 
  X, User, Phone, MapPin, Check, Heart, Mail, Calendar, Clock, 
  MessageSquare, Plus, Trash2, Edit3, TrendingUp, Sparkles, RefreshCw, BarChart2, ShieldCheck, Compass, Building,
  CreditCard, Shield, Send, UploadCloud, FileText, Download, Award
} from "lucide-react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, addDoc, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface UserDashboardModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onUpdateProfile: (updatedProfile: UserProfile) => void;
  onViewListingDetail: (listing: Listing) => void;
  onAddListingClick: () => void;
  onEditListingClick: (listing: Listing) => void;
  darkMode: boolean;
  initialTab?: string;
  preselectedConversationId?: string;
}

export default function UserDashboardModal({
  currentUser,
  onClose,
  onUpdateProfile,
  onViewListingDetail,
  onAddListingClick,
  onEditListingClick,
  darkMode,
  initialTab,
  preselectedConversationId,
}: UserDashboardModalProps) {
  
  // Tab states
  // Seeker tabs: profile, saved, enquiries, bookings, chats
  // Owner tabs: listings, enquiries, stats, chats, kyc, subscriptions, profile
  const isOwner = currentUser.role === "owner";
  const [activeTab, setActiveTab] = useState<string>(initialTab || (isOwner ? "listings" : "profile"));

  // In-App Chat States
  const [conversations, setConversations] = useState<DirectConversation[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>(preselectedConversationId);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState("");

  // KYC States
  const [kycDocType, setKycDocType] = useState<string>(currentUser.kycDocumentType || "aadhaar");
  const [kycDocNum, setKycDocNum] = useState<string>(currentUser.kycDocumentNumber || "");
  const [simulatedFileName, setSimulatedFileName] = useState<string | null>(currentUser.kycDocumentUrl ? "uploaded_doc.jpg" : null);
  const [isUploadingKyc, setIsUploadingKyc] = useState(false);
  const [kycSuccess, setKycSuccess] = useState(false);

  // Subscriptions & Razorpay States
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showRazorpay, setShowRazorpay] = useState(false);
  const [targetUpgradePlan, setTargetUpgradePlan] = useState<"premium" | "featured">("premium");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [invoiceForReceipt, setInvoiceForReceipt] = useState<Invoice | null>(null);

  // Profile fields
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || "");
  const [profileCity, setProfileCity] = useState(currentUser.cityPreference || "Bengaluru");

  // Load States
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Firestore Data Collections
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [myFavourites, setMyFavourites] = useState<Listing[]>([]);
  const [myEnquiries, setMyEnquiries] = useState<Enquiry[]>([]);
  const [myBookings, setMyBookings] = useState<Booking[]>([]);

  // Checkout Overlay States
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutParams, setCheckoutParams] = useState({
    bookingId: "",
    amount: 1500,
    purpose: "premium_booking" as "premium_booking" | "property_deposit" | "affiliate_referral",
    title: ""
  });

  // Load appropriate data based on role on mount
  useEffect(() => {
    fetchDashboardData();
  }, [currentUser.uid]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      if (isOwner) {
        // Fetch listings where ownerId == currentUser.uid
        const listingsQ = query(collection(db, "listings"), where("ownerId", "==", currentUser.uid));
        const listingsSnap = await getDocs(listingsQ);
        const list: Listing[] = [];
        listingsSnap.forEach((d) => {
          list.push({ ...d.data(), id: d.id } as Listing);
        });
        setMyListings(list);

        // Fetch enquiries received for ownerId == currentUser.uid
        const enquiriesQ = query(collection(db, "enquiries"), where("ownerId", "==", currentUser.uid));
        const enquiriesSnap = await getDocs(enquiriesQ);
        const enqList: Enquiry[] = [];
        enquiriesSnap.forEach((d) => {
          enqList.push({ ...d.data(), id: d.id } as Enquiry);
        });
        enqList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyEnquiries(enqList);

        // Fetch bookings scheduled for ownerId == currentUser.uid
        const bookingsQ = query(collection(db, "bookings"), where("ownerId", "==", currentUser.uid));
        const bookingsSnap = await getDocs(bookingsQ);
        const bookList: Booking[] = [];
        bookingsSnap.forEach((d) => {
          bookList.push({ ...d.data(), id: d.id } as Booking);
        });
        setMyBookings(bookList);

        // Fetch invoices for ownerId == currentUser.uid
        const invoicesQ = query(collection(db, "invoices"), where("userId", "==", currentUser.uid));
        const invoicesSnap = await getDocs(invoicesQ);
        const invList: Invoice[] = [];
        invoicesSnap.forEach((d) => {
          invList.push({ ...d.data(), id: d.id } as Invoice);
        });
        invList.sort((a, b) => new Date(b.invoiceDate).getTime() - new Date(a.invoiceDate).getTime());
        setInvoices(invList);
      } else {
        // Seeker: Fetch Saved/Favorited listings
        const favsQ = query(collection(db, "favourites"), where("userId", "==", currentUser.uid));
        const favsSnap = await getDocs(favsQ);
        const favListingIds: string[] = [];
        favsSnap.forEach((d) => {
          favListingIds.push((d.data() as Favourite).listingId);
        });

        if (favListingIds.length > 0) {
          // Fetch the full details of those favorited listings
          const allListingsSnap = await getDocs(collection(db, "listings"));
          const matchedFavs: Listing[] = [];
          allListingsSnap.forEach((d) => {
            const data = d.data() as Listing;
            if (favListingIds.includes(data.id)) {
              matchedFavs.push({ ...data, id: d.id });
            }
          });
          setMyFavourites(matchedFavs);
        } else {
          setMyFavourites([]);
        }

        // Fetch sent enquiries where userId == currentUser.uid
        const sentEnqQ = query(collection(db, "enquiries"), where("userId", "==", currentUser.uid));
        const sentEnqSnap = await getDocs(sentEnqQ);
        const sentList: Enquiry[] = [];
        sentEnqSnap.forEach((d) => {
          sentList.push({ ...d.data(), id: d.id } as Enquiry);
        });
        sentList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyEnquiries(sentList);

        // Fetch sent bookings where userId == currentUser.uid
        const sentBookQ = query(collection(db, "bookings"), where("userId", "==", currentUser.uid));
        const sentBookSnap = await getDocs(sentBookQ);
        const sentBooks: Booking[] = [];
        sentBookSnap.forEach((d) => {
          sentBooks.push({ ...d.data(), id: d.id } as Booking);
        });
        sentBooks.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setMyBookings(sentBooks);
      }
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load Conversations real-time
  useEffect(() => {
    if (activeTab !== "chats") return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DirectConversation[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as DirectConversation);
      });
      // Sort conversations by lastMessageTime descending
      list.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
      setConversations(list);

      // Pre-select first conversation if there's none selected
      if (snapshot.size > 0 && !selectedConversationId) {
        const first = snapshot.docs[0];
        setSelectedConversationId(first.id);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "conversations");
    });

    return () => unsubscribe();
  }, [activeTab, currentUser.uid, selectedConversationId]);

  // Load Messages real-time
  useEffect(() => {
    if (activeTab !== "chats" || !selectedConversationId) return;

    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", selectedConversationId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: DirectMessage[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as DirectMessage);
      });
      // Sort messages by timestamp ascending
      list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      setMessages(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, "messages");
    });

    return () => unsubscribe();
  }, [activeTab, selectedConversationId]);

  // Handle message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !selectedConversationId) return;

    const currentMsgText = newMessageText;
    setNewMessageText("");

    try {
      const msgData = {
        conversationId: selectedConversationId,
        senderId: currentUser.uid,
        senderName: currentUser.name,
        content: currentMsgText,
        timestamp: new Date().toISOString(),
        read: false
      };

      await addDoc(collection(db, "messages"), msgData);

      // Update the conversation's lastMessageText and lastMessageTime
      const convRef = doc(db, "conversations", selectedConversationId);
      await updateDoc(convRef, {
        lastMessageText: currentMsgText,
        lastMessageTime: new Date().toISOString()
      });
    } catch (err) {
      console.error("Error sending message:", err);
      handleFirestoreError(err, OperationType.WRITE, "messages");
    }
  };

  // Handle KYC Submission
  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycDocNum.trim()) {
      alert("Please enter a valid Document ID / Number.");
      return;
    }
    setIsUploadingKyc(true);
    setKycSuccess(false);

    try {
      // Simulate file upload delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const updatedFields: Partial<UserProfile> = {
        kycStatus: "pending",
        kycDocumentType: kycDocType,
        kycDocumentNumber: kycDocNum,
        kycDocumentUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
      };

      const userRef = doc(db, "users", currentUser.uid);
      await updateDoc(userRef, updatedFields);

      // Store a notification in Firestore which will trigger a real-time toaster!
      await addDoc(collection(db, "notifications"), {
        userId: currentUser.uid,
        title: "KYC Submitted & Pending",
        message: `Your ${kycDocType.toUpperCase()} document (${kycDocNum}) is successfully uploaded. Verification will complete in 24 hours.`,
        type: "info",
        read: false,
        createdAt: new Date().toISOString()
      });

      const newProfile: UserProfile = {
        ...currentUser,
        ...updatedFields,
      };

      onUpdateProfile(newProfile);
      setKycSuccess(true);
      setSimulatedFileName("uploaded_doc.jpg");
    } catch (err) {
      console.error("Error submitting KYC:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    } finally {
      setIsUploadingKyc(false);
    }
  };

  // Handle Razorpay Upgrade Payment Completion
  const handleRazorpayPaymentComplete = async () => {
    setIsProcessingPayment(true);
    try {
      // Simulate Razorpay secure payment gateway load & transaction processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const amount = targetUpgradePlan === "premium" ? 499 : 999;
      const rpPaymentId = "pay_rp_" + Math.random().toString(36).substr(2, 9);
      const invoiceNumber = "CM-INV-2026-" + Math.floor(100000 + Math.random() * 900000);
      const invoiceDate = new Date().toISOString();

      const newInvoice: Omit<Invoice, "id"> = {
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        plan: targetUpgradePlan,
        amount,
        razorpayPaymentId: rpPaymentId,
        status: "success",
        invoiceDate,
        invoiceNumber,
      };

      // 1. Add to "invoices" collection
      const invDocRef = await addDoc(collection(db, "invoices"), newInvoice);

      // 2. Update owner subscription plan in "users" profile document
      const userRef = doc(db, "users", currentUser.uid);
      const updatedFields: Partial<UserProfile> = {
        subscriptionPlan: targetUpgradePlan,
        subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      };
      await updateDoc(userRef, updatedFields);

      // 3. Update all of this owner's listings to be "featured" if they subscribed to the featured plan!
      if (targetUpgradePlan === "featured") {
        const qListings = query(collection(db, "listings"), where("ownerId", "==", currentUser.uid));
        const listSnap = await getDocs(qListings);
        for (const docL of listSnap.docs) {
          await updateDoc(docL.ref, { isFeatured: true });
        }
      }

      const updatedProfile: UserProfile = {
        ...currentUser,
        ...updatedFields
      };

      onUpdateProfile(updatedProfile);
      setInvoices((prev) => [{ ...newInvoice, id: invDocRef.id } as Invoice, ...prev]);

      // Store a notification in Firestore which will trigger a real-time toaster!
      await addDoc(collection(db, "notifications"), {
        userId: currentUser.uid,
        title: "Payment Captured Successfully 💳",
        message: `Your payment of INR ${amount} was processed via Razorpay (${rpPaymentId}). Partner Tier: ${targetUpgradePlan.toUpperCase()} is active.`,
        type: "success",
        read: false,
        createdAt: new Date().toISOString()
      });

      setShowRazorpay(false);
      alert(`Payment successful! Your partner account is now upgraded to ${targetUpgradePlan.toUpperCase()}.`);
    } catch (err) {
      console.error("Error processing upgrade payment:", err);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Seeker / Owner Profile Mutation
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccess(false);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const updatedFields = {
        name: profileName,
        phone: profilePhone,
        cityPreference: profileCity,
      };

      await updateDoc(userRef, updatedFields);
      
      const newProfile: UserProfile = {
        ...currentUser,
        ...updatedFields,
      };

      onUpdateProfile(newProfile);
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 2000);
    } catch (err) {
      console.error("Error updating profile preference:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Bookings / Scheduling Site Visit Mutations
  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this relocation site visit?")) return;
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status: "cancelled" });
      setMyBookings((prev) => 
        prev.map((b) => (b.id === bookingId ? { ...b, status: "cancelled" } : b))
      );
      alert("Visit cancelled successfully.");
    } catch (err) {
      console.error("Error cancelling booking:", err);
      handleFirestoreError(err, OperationType.WRITE, `bookings/${bookingId}`);
    }
  };

  const handleUpdateBookingStatus = async (bookingId: string, newStatus: "completed" | "scheduled") => {
    try {
      await updateDoc(doc(db, "bookings", bookingId), { status: newStatus });
      setMyBookings((prev) => 
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      alert(`Booking marked as ${newStatus}.`);
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  // Delete Listings (Owner Action)
  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this listing? This will withdraw it from the live catalog.")) return;
    try {
      const q = query(collection(db, "listings"), where("id", "==", listingId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await deleteDoc(snap.docs[0].ref);
        setMyListings((prev) => prev.filter((l) => l.id !== listingId));
        alert("Listing successfully deleted.");
      }
    } catch (err) {
      console.error("Error deleting listing:", err);
      handleFirestoreError(err, OperationType.DELETE, `listings/${listingId}`);
    }
  };

  // Unfavorite Seeker Action
  const handleUnfavorite = async (listingId: string) => {
    try {
      const q = query(
        collection(db, "favourites"),
        where("userId", "==", currentUser.uid),
        where("listingId", "==", listingId)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        await deleteDoc(snap.docs[0].ref);
        setMyFavourites((prev) => prev.filter((l) => l.id !== listingId));
      }
    } catch (e) {
      console.error("Unfavorite failed:", e);
    }
  };

  // Owner analytics helpers
  const totalListingsCount = myListings.length;
  const verifiedListingsCount = myListings.filter((l) => l.status === "active").length;
  const pendingListingsCount = myListings.filter((l) => l.status === "pending").length;
  const totalEnquiriesReceived = myEnquiries.length;
  const averageRating = myListings.length > 0 
    ? (myListings.reduce((acc, l) => acc + l.rating, 0) / myListings.length).toFixed(1)
    : "5.0";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`relative w-full max-w-5xl rounded-2xl p-6 md:p-8 border flex flex-col h-[85vh] transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 ${
        darkMode
          ? "bg-slate-950 border-slate-800 text-white shadow-2xl shadow-black/60"
          : "bg-white border-slate-100 text-slate-800 shadow-2xl"
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 mb-5 ${
          darkMode ? "border-slate-800" : "border-slate-100"
        }`}>
          <div className="flex items-center gap-3">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${
              darkMode ? "bg-purple-950/60 text-purple-400 border border-purple-900/40" : "bg-indigo-50 text-brand-indigo"
            }`}>
              {isOwner ? <BarChart2 className="h-6 w-6" /> : <User className="h-6 w-6" />}
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-1.5">
                {isOwner ? "Owner Partner Dashboard" : "Relocation Seeker Dashboard"}
                <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-[9px] font-black text-brand-indigo uppercase tracking-widest border border-brand-indigo/10">
                  {currentUser.role} ID: CM-{currentUser.uid.substr(0, 5).toUpperCase()}
                </span>
              </h3>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                {isOwner 
                  ? "Track co-living analytics, schedule on-site tours, and manage room inventories." 
                  : "Review bookmarked hubs, monitor contact requests, and schedule physically verified visits."}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={fetchDashboardData}
              className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                darkMode ? "border-slate-800 bg-slate-900 text-slate-400 hover:text-white" : "border-slate-200 bg-white text-slate-400 hover:text-slate-600"
              }`}
              title="Refresh ledger state"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onClose}
              className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm cursor-pointer transition-transform active:scale-90 ${
                darkMode
                  ? "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  : "border-slate-200 bg-white text-slate-400 hover:text-slate-600"
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Dashboard Tabs Grid */}
        <div className="flex border-b border-slate-100/10 mb-6 shrink-0 overflow-x-auto gap-2">
          {isOwner ? (
            /* OWNER DASHBOARD TABS */
            <>
              <button
                onClick={() => setActiveTab("listings")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "listings"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Plus className="h-4 w-4 text-emerald-500" />
                <span>My Portfolio ({totalListingsCount})</span>
              </button>
              
              <button
                onClick={() => setActiveTab("enquiries")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "enquiries"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Received Enquiries ({totalEnquiriesReceived})</span>
              </button>

              <button
                onClick={() => setActiveTab("bookings")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "bookings"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Calendar className="h-4 w-4" />
                <span>Scheduled Site Tours ({myBookings.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("stats")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "stats"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>Listing Stats</span>
              </button>

              <button
                onClick={() => setActiveTab("chats")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "chats"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <MessageSquare className="h-4 w-4 text-indigo-500 animate-pulse" />
                <span>In-App Chats</span>
              </button>

              <button
                onClick={() => setActiveTab("kyc")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "kyc"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <ShieldCheck className="h-4 w-4 text-blue-500" />
                <span>KYC Verification</span>
              </button>

              <button
                onClick={() => setActiveTab("subscriptions")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "subscriptions"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <CreditCard className="h-4 w-4 text-amber-500" />
                <span>Subscriptions & Billing</span>
              </button>

              <button
                onClick={() => setActiveTab("superapp")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "superapp"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                <span>Super App Hub</span>
              </button>

              <button
                onClick={() => setActiveTab("community")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "community"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Compass className="h-4 w-4 text-emerald-400" />
                <span>Community Forum</span>
              </button>

              <button
                onClick={() => setActiveTab("rewards")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "rewards"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Award className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>Rewards & Referrals</span>
              </button>

              <button
                onClick={() => setActiveTab("guides")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "guides"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Compass className="h-4 w-4 text-sky-400 animate-pulse" />
                <span>City Relocation Guides</span>
              </button>

              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Profile Preferences</span>
              </button>
            </>
          ) : (
            /* SEEKER/USER DASHBOARD TABS */
            <>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <User className="h-4 w-4" />
                <span>My Profile</span>
              </button>

              <button
                onClick={() => setActiveTab("superapp")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "superapp"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Sparkles className="h-4 w-4 text-purple-400 animate-pulse" />
                <span>Super App Hub</span>
              </button>

              <button
                onClick={() => setActiveTab("airelocation")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "airelocation"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Sparkles className="h-4 w-4 text-emerald-500 animate-pulse" />
                <span>AI Relocation Hub</span>
              </button>

              <button
                onClick={() => setActiveTab("saved")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "saved"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Heart className="h-4 w-4 text-rose-500" />
                <span>Saved Listings ({myFavourites.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("bookings")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "bookings"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Calendar className="h-4 w-4 text-emerald-500" />
                <span>My Site Visits ({myBookings.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("enquiries")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "enquiries"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Sent Enquiries ({myEnquiries.length})</span>
              </button>

              <button
                onClick={() => setActiveTab("chats")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "chats"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <MessageSquare className="h-4 w-4 text-indigo-500 animate-pulse" />
                <span>In-App Chats</span>
              </button>

              <button
                onClick={() => setActiveTab("community")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "community"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Compass className="h-4 w-4 text-emerald-400 animate-pulse" />
                <span>Community Forum</span>
              </button>

              <button
                onClick={() => setActiveTab("rewards")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "rewards"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Award className="h-4 w-4 text-amber-500 animate-pulse" />
                <span>Rewards & Referrals</span>
              </button>

              <button
                onClick={() => setActiveTab("guides")}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "guides"
                    ? darkMode ? "border-purple-500 text-purple-400 bg-purple-950/10" : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Compass className="h-4 w-4 text-sky-400 animate-pulse" />
                <span>City Relocation Guides</span>
              </button>
            </>
          )}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {isLoading ? (
            <div className="text-center py-24 flex flex-col items-center justify-center">
              <RefreshCw className="h-8 w-8 animate-spin text-brand-indigo mb-2" />
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Querying CityMate cluster ledger...</p>
            </div>
          ) : (
            <>
              {/* Super App Hub Tab */}
              {activeTab === "superapp" && (
                <SuperAppPartnerHub 
                  currentUser={{
                    uid: currentUser.uid || "anon",
                    name: currentUser.name || "User",
                    email: currentUser.email || "",
                    role: currentUser.role || "seeker"
                  }}
                  darkMode={darkMode}
                />
              )}

              {/* AI Relocation Hub Tab */}
              {activeTab === "airelocation" && (
                <AIRelocationHub
                  darkMode={darkMode}
                  currentUser={currentUser}
                  onSelectListing={(listing) => {
                    onClose();
                    onViewListingDetail(listing);
                  }}
                />
              )}

              {/* Community Forum Tab */}
              {activeTab === "community" && (
                <CommunityFeed
                  darkMode={darkMode}
                  currentUser={currentUser}
                  onNavigateToTab={(tab) => {
                    setActiveTab(tab);
                  }}
                />
              )}

              {/* Rewards Wallet Tab */}
              {activeTab === "rewards" && (
                <RewardsWallet
                  darkMode={darkMode}
                  currentUser={currentUser}
                />
              )}

              {/* City Relocation Guides Tab */}
              {activeTab === "guides" && (
                <CityGuideExplorer
                  darkMode={darkMode}
                />
              )}

              {/* Profile Tab */}
              {activeTab === "profile" && (
                <div className="max-w-xl mx-auto space-y-6 pt-2">
                  <div className={`p-4 rounded-xl border border-dashed flex items-center gap-3 ${
                    darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"
                  }`}>
                    <ShieldCheck className="h-6 w-6 text-brand-indigo shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider">Identity Integrity</h4>
                      <p className="text-[10px] text-slate-400 leading-normal font-medium">
                        Your profile changes update owner dispatch channels and co-living scheduling calendars instantly.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Full Name</label>
                      <input
                        type="text"
                        required
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-xs focus:outline-none font-bold ${
                          darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Contact Number (WhatsApp/Call)</label>
                      <input
                        type="tel"
                        required
                        placeholder="e.g. +91 9876543210"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-xs focus:outline-none font-bold ${
                          darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Relocation City Hub</label>
                      <select
                        value={profileCity}
                        onChange={(e) => setProfileCity(e.target.value)}
                        className={`w-full rounded-xl border px-4 py-3 text-xs focus:outline-none font-bold ${
                          darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="Bengaluru font-bold">Bengaluru, Karnataka</option>
                        <option value="Delhi NCR font-bold">Delhi NCR (Noida/Gurugram)</option>
                        <option value="Mumbai font-bold">Mumbai, Maharashtra</option>
                        <option value="Pune font-bold">Pune, Maharashtra</option>
                        <option value="Hyderabad font-bold">Hyderabad, Telangana</option>
                        <option value="Kota font-bold">Kota, Rajasthan</option>
                      </select>
                    </div>

                    {profileSuccess && (
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500 text-xs font-bold border border-emerald-500/10 flex items-center gap-1.5 animate-pulse">
                        <Check className="h-4 w-4" /> Profile committed successfully to cloud database.
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isUpdatingProfile ? "Writing ledger nodes..." : "Save Identity Changes"}
                    </button>
                  </form>
                </div>
              )}

              {/* Saved/Favourites Tab (Seeker) */}
              {activeTab === "saved" && (
                <div>
                  {myFavourites.length === 0 ? (
                    <div className="text-center py-20">
                      <Heart className="mx-auto h-12 w-12 text-slate-700/60 mb-3" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Empty Favourites Registry</h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 leading-normal">
                        Browse the relocations hub and click the heart icon on room listings to bookmark Co-Living spaces for instant access!
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myFavourites.map((listing) => (
                        <div 
                          key={listing.id}
                          className={`p-4 rounded-xl border flex gap-4 transition-all relative group hover:shadow-md ${
                            darkMode ? "bg-slate-900/30 border-slate-800/80" : "bg-slate-50/50 border-slate-150"
                          }`}
                        >
                          <div className="h-20 w-24 rounded-lg overflow-hidden shrink-0 border border-slate-100/10">
                            <img 
                              src={listing.images[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80"} 
                              alt={listing.title} 
                              className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="flex-grow min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[8px] font-black uppercase bg-indigo-500/15 text-indigo-400 px-1.5 py-0.5 rounded">
                                  {listing.category}
                                </span>
                                <span className="text-[9px] font-bold text-slate-500">
                                  {listing.locality}, {listing.city}
                                </span>
                              </div>
                              <h4 
                                onClick={() => {
                                  onClose();
                                  onViewListingDetail(listing);
                                }}
                                className={`text-xs font-black truncate mt-1 cursor-pointer hover:underline ${darkMode ? "text-white" : "text-slate-900"}`}
                              >
                                {listing.title}
                              </h4>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100/10 pt-2.5 mt-2">
                              <span className="text-xs font-mono font-black text-emerald-500">
                                ₹{listing.price.toLocaleString("en-IN")}/{listing.pricePeriod}
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    onClose();
                                    onViewListingDetail(listing);
                                  }}
                                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={() => handleUnfavorite(listing.id)}
                                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500"
                                  title="Remove bookmark"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Booking History (Seeker & Owner Visits) */}
              {activeTab === "bookings" && (
                <div className="space-y-4">
                  {/* Escrow Protected payments & ledger testing sandbox */}
                  {!isOwner && (
                    <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-950/60 border-slate-800" : "bg-indigo-50/20 border-indigo-100"}`}>
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldCheck className="h-4 w-4 text-emerald-400" />
                        <div>
                          <h4 className={`text-xs font-black uppercase tracking-wider ${darkMode ? "text-white" : "text-slate-900"}`}>
                            Enterprise Escrow Ledger & Payments
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                            Secure payment channels for PG tokens, deposits, & relocation services
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Option 1: Premium booking */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"}`}>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-indigo-400">01. Premium PG Booking</p>
                            <h5 className={`text-[11px] font-extrabold mt-1 leading-snug ${darkMode ? "text-white" : "text-slate-800"}`}>Room Allocation token</h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">Secure room and pause competing requests.</p>
                          </div>
                          <button
                            onClick={() => {
                              setCheckoutParams({
                                bookingId: "pg_alloc_" + Math.random().toString(36).substring(2, 6).toUpperCase(),
                                amount: 1500,
                                purpose: "premium_booking",
                                title: "Premium Room Allocation Booking Token"
                              });
                              setCheckoutOpen(true);
                            }}
                            className="mt-3 w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all active:scale-95 text-center block"
                          >
                            Pay ₹1,500
                          </button>
                        </div>

                        {/* Option 2: Property deposit */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"}`}>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400">02. Security Deposit</p>
                            <h5 className={`text-[11px] font-extrabold mt-1 leading-snug ${darkMode ? "text-white" : "text-slate-800"}`}>Tokenized Property Deposit</h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">Securely held in escrow until lease finalization.</p>
                          </div>
                          <button
                            onClick={() => {
                              setCheckoutParams({
                                bookingId: "dep_sec_" + Math.random().toString(36).substring(2, 6).toUpperCase(),
                                amount: 15000,
                                purpose: "property_deposit",
                                title: "Tokenized Property Security Deposit Escrow"
                              });
                              setCheckoutOpen(true);
                            }}
                            className="mt-3 w-full py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all active:scale-95 text-center block"
                          >
                            Pay ₹15,000
                          </button>
                        </div>

                        {/* Option 3: Affiliate Lead */}
                        <div className={`p-3 rounded-lg border flex flex-col justify-between ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100"}`}>
                          <div>
                            <p className="text-[8px] font-black uppercase tracking-widest text-pink-400">03. packers & movers</p>
                            <h5 className={`text-[11px] font-extrabold mt-1 leading-snug ${darkMode ? "text-white" : "text-slate-800"}`}>B2B Relocation Service</h5>
                            <p className="text-[10px] text-slate-500 mt-0.5">Elite Packers & Movers professional checkout.</p>
                          </div>
                          <button
                            onClick={() => {
                              setCheckoutParams({
                                bookingId: "aff_pm_" + Math.random().toString(36).substring(2, 6).toUpperCase(),
                                amount: 6500,
                                purpose: "affiliate_referral",
                                title: "VRL Packers & Movers Consolidated B2B Invoice"
                              });
                              setCheckoutOpen(true);
                            }}
                            className="mt-3 w-full py-1.5 bg-pink-600 hover:bg-pink-500 text-white text-[9px] font-black uppercase tracking-wider rounded-md cursor-pointer transition-all active:scale-95 text-center block"
                          >
                            Pay ₹6,500
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {myBookings.length === 0 ? (
                    <div className="text-center py-20">
                      <Calendar className="mx-auto h-12 w-12 text-slate-700/60 mb-3" />
                      <h4 className="text-xs font-black uppercase tracking-wider">No visits scheduled yet</h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 leading-normal">
                        Schedule physical site visits inside room or PG listing screens to perform on-the-spot audits with peace of mind.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myBookings.map((booking) => (
                        <div
                          key={booking.id}
                          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                            darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50 border-slate-150"
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                booking.status === "scheduled"
                                  ? "bg-amber-500/10 text-amber-500 border border-amber-500/15"
                                  : booking.status === "completed"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15"
                                    : "bg-slate-500/10 text-slate-500 border border-slate-500/15"
                              }`}>
                                {booking.status}
                              </span>
                              <span className="text-[9px] text-slate-500 font-bold">
                                Visit ID: CM-T-{booking.id.toUpperCase().substr(0, 5)}
                              </span>
                            </div>
                            
                            <h4 className={`text-xs font-black ${darkMode ? "text-white" : "text-slate-900"}`}>
                              Tour: <span className="underline">{booking.listingTitle}</span>
                            </h4>

                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-bold pt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-brand-indigo" /> Date: {booking.visitDate}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-brand-indigo" /> Time: {booking.visitTime || "Not specified"}
                              </span>
                            </div>

                            {isOwner ? (
                              <p className="text-[10px] text-slate-500 leading-normal">
                                Visitor: <span className="font-extrabold text-slate-400">{booking.userName}</span> ({booking.userEmail})
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-500 leading-normal">
                                Physical verified check of co-living amenities. Host has been notified.
                              </p>
                            )}
                          </div>

                          <div className="flex gap-2 shrink-0 self-end md:self-center">
                            {isOwner && booking.status === "scheduled" && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, "completed")}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all active:scale-95"
                              >
                                Mark Completed
                              </button>
                            )}

                            {booking.status === "scheduled" && (
                              <>
                                {!isOwner && (
                                  <button
                                    onClick={() => {
                                      setCheckoutParams({
                                        bookingId: booking.id,
                                        amount: 2500,
                                        purpose: "premium_booking",
                                        title: `Premium Token Deposit for ${booking.listingTitle}`
                                      });
                                      setCheckoutOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all active:scale-95 shadow-md shadow-indigo-600/10 flex items-center gap-1"
                                  >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    <span>Pay Token Deposit</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => handleCancelBooking(booking.id)}
                                  className="px-3 py-1.5 bg-red-600/15 hover:bg-red-600 hover:text-white text-red-500 text-[9px] font-black uppercase tracking-wider rounded-lg cursor-pointer transition-all active:scale-95 border border-red-500/10"
                                >
                                  Cancel Visit
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Received/Sent Enquiries Tab */}
              {activeTab === "enquiries" && (
                <div>
                  {myEnquiries.length === 0 ? (
                    <div className="text-center py-20">
                      <MessageSquare className="mx-auto h-12 w-12 text-slate-700/60 mb-3" />
                      <h4 className="text-xs font-black uppercase tracking-wider">No Enquiry Records</h4>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1 leading-normal">
                        {isOwner 
                          ? "When seekers find your room portfolio, their direct message enquiries will be logged and matched here instantly."
                          : "Your contact requests sent to properties and PG hosts will be monitored and catalogued here."}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myEnquiries.map((enq) => (
                        <div 
                          key={enq.id}
                          className={`p-4 rounded-xl border relative ${
                            darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50 border-slate-150"
                          }`}
                        >
                          <div className="flex justify-between items-baseline flex-wrap gap-2 mb-2">
                            <span className="text-[8px] font-black uppercase tracking-wider bg-brand-indigo/10 text-brand-indigo px-2 py-0.5 rounded">
                              Space: {enq.listingTitle}
                            </span>
                            <span className="text-[9px] text-slate-500 font-mono">
                              {enq.createdAt ? new Date(enq.createdAt).toLocaleString() : "N/A"}
                            </span>
                          </div>

                          <p className={`text-xs leading-relaxed italic border-l-2 pl-3 py-1 font-semibold ${
                            darkMode ? "border-slate-800 text-slate-300" : "border-slate-200 text-slate-600"
                          }`}>
                            "{enq.message}"
                          </p>

                          <div className="mt-3.5 pt-3.5 border-t border-slate-150/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                            <div className="text-[10px] space-y-0.5">
                              <p className="font-bold text-slate-400">
                                {isOwner ? "Seeker Identity" : "Owner Host ID"}: <span className="text-brand-indigo">{enq.userName}</span>
                              </p>
                              <p className="text-slate-500 font-medium">
                                Email: {enq.userEmail} • Phone: {enq.userPhone}
                              </p>
                            </div>

                            {/* Response Actions */}
                            {isOwner && (
                              <div className="flex gap-2 shrink-0">
                                <a
                                  href={`tel:${enq.userPhone}`}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-[9px] font-black uppercase tracking-wider rounded-lg"
                                >
                                  Call Seeker
                                </a>
                                <a
                                  href={`https://wa.me/${enq.userPhone.replace(/[^\d]/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider rounded-lg"
                                >
                                  WhatsApp
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Portfolio Management Tab (Owner) */}
              {activeTab === "listings" && isOwner && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center gap-4">
                    <h4 className="text-xs font-black uppercase tracking-wider">Rooms and PGs Inventory</h4>
                    <button
                      onClick={onAddListingClick}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add New Space</span>
                    </button>
                  </div>

                  {myListings.length === 0 ? (
                    <div className="text-center py-20 border border-dashed border-slate-100/10 rounded-2xl">
                      <Plus className="mx-auto h-12 w-12 text-slate-700/60 mb-3" />
                      <h4 className="text-xs font-black uppercase tracking-wider">No active property catalog</h4>
                      <button
                        onClick={onAddListingClick}
                        className="mt-4 px-4 py-2.5 bg-brand-indigo hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer"
                      >
                        Create Your First Listing
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myListings.map((listing) => (
                        <div 
                          key={listing.id}
                          className={`p-4 rounded-xl border flex gap-4 relative overflow-hidden ${
                            darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50 border-slate-150"
                          }`}
                        >
                          <div className="h-20 w-24 rounded-lg overflow-hidden shrink-0 border border-slate-100/10">
                            <img 
                              src={listing.images[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80"} 
                              alt={listing.title} 
                              className="h-full w-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>

                          <div className="flex-grow min-w-0 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${
                                  listing.status === "active" 
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/15" 
                                    : listing.status === "rejected" 
                                      ? "bg-red-500/10 text-red-500 border border-red-500/15" 
                                      : "bg-amber-500/10 text-amber-500 border border-amber-500/15 animate-pulse"
                                }`}>
                                  {listing.status}
                                </span>
                                <span className="text-[9px] text-slate-500 font-bold">
                                  {listing.locality}, {listing.city}
                                </span>
                              </div>

                              <h4 className={`text-xs font-black truncate mt-1 ${darkMode ? "text-white" : "text-slate-900"}`}>
                                {listing.title}
                              </h4>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-100/10 pt-2.5 mt-2">
                              <span className="text-xs font-mono font-black text-emerald-500">
                                ₹{listing.price.toLocaleString("en-IN")}/{listing.pricePeriod}
                              </span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => onEditListingClick(listing)}
                                  className="p-1.5 rounded-lg hover:bg-purple-500/10 text-purple-400"
                                  title="Edit listing details"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteListing(listing.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                                  title="Delete permanently"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Listing Statistics Tab (Owner) */}
              {activeTab === "stats" && isOwner && (
                <div className="space-y-6">
                  {/* Stats Badges */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Listed Rooms", val: totalListingsCount, desc: `${verifiedListingsCount} verified • ${pendingListingsCount} pending`, icon: Building, color: "text-blue-400" },
                      { label: "Guest Enquiries", val: totalEnquiriesReceived, desc: "Cumulative lead volume", icon: MessageSquare, color: "text-purple-400" },
                      { label: "Average Portfolio Rating", val: `${averageRating} / 5.0`, desc: "Tenant sentiment score", icon: Sparkles, color: "text-amber-400" },
                      { label: "Physical Visits Booked", val: myBookings.length, desc: "On-site tours scheduled", icon: Calendar, color: "text-emerald-400" }
                    ].map((stat, i) => {
                      const Icon = stat.icon;
                      return (
                        <div
                          key={i}
                          className={`p-5 rounded-2xl border ${
                            darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-100"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`text-[9px] font-black uppercase tracking-widest pl-1 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                              {stat.label}
                            </span>
                            <Icon className={`h-4 w-4 ${stat.color}`} />
                          </div>
                          <p className="text-2xl font-black mt-2 tracking-tight">{stat.val}</p>
                          <p className={`text-[10px] font-bold mt-1 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                            {stat.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Portfolio Performance Chart placeholder representing traffic */}
                  <div className={`p-6 rounded-2xl border ${
                    darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}>
                    <h4 className="text-xs font-black uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-purple-400" /> Relocation Seeker Engagement Indices
                    </h4>

                    {totalListingsCount === 0 ? (
                      <p className="text-xs text-slate-500 font-bold py-10 text-center">Add listings to trigger engagement statistics.</p>
                    ) : (
                      <div className="space-y-4">
                        {myListings.map((listing) => {
                          const ratingWidth = (listing.rating / 5) * 100;
                          return (
                            <div key={listing.id} className="space-y-1.5">
                              <div className="flex justify-between items-baseline text-xs font-bold">
                                <span className={darkMode ? "text-slate-200" : "text-slate-800"}>{listing.title}</span>
                                <span className="text-purple-400 text-[10px] font-mono">Rating: {listing.rating.toFixed(1)} / 5.0</span>
                              </div>
                              <div className="h-2 rounded-full bg-slate-100/10 overflow-hidden relative">
                                <div style={{ width: `${ratingWidth}%` }} className="h-full bg-gradient-to-r from-brand-indigo to-brand-violet" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* In-App Chats Tab (Seeker & Owner) */}
              {activeTab === "chats" && (
                <div className="h-[60vh] rounded-2xl overflow-hidden border border-slate-100/10">
                  <ChatTerminal
                    currentUser={currentUser}
                    darkMode={darkMode}
                    preselectedConversationId={preselectedConversationId}
                  />
                </div>
              )}

              {/* KYC Verification Tab (Owner) */}
              {activeTab === "kyc" && isOwner && (
                <div className="max-w-xl mx-auto space-y-6 pt-2">
                  <div className={`p-5 rounded-2xl border ${
                    currentUser.kycStatus === "verified"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
                      : currentUser.kycStatus === "pending"
                        ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                        : currentUser.kycStatus === "rejected"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-500"
                          : "bg-slate-900/40 border-slate-800 text-slate-400"
                  }`}>
                    <div className="flex items-center gap-3">
                      <Shield className="h-8 w-8 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          KYC Document Status: 
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                            currentUser.kycStatus === "verified"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : currentUser.kycStatus === "pending"
                                ? "bg-amber-500/20 text-amber-400 animate-pulse"
                                : currentUser.kycStatus === "rejected"
                                  ? "bg-rose-500/20 text-rose-400"
                                  : "bg-slate-800 text-slate-400"
                          }`}>
                            {currentUser.kycStatus || "Not Uploaded"}
                          </span>
                        </h4>
                        <p className="text-[10px] mt-0.5 leading-normal font-medium">
                          {currentUser.kycStatus === "verified"
                            ? "Congratulations! Your partner account is fully KYC verified. A glowy 'Verified' badge is appended to all your listings to build direct customer trust."
                            : currentUser.kycStatus === "pending"
                              ? "Your document verification review is currently in queue. Our audit team will review document accuracy shortly."
                              : currentUser.kycStatus === "rejected"
                                ? "Authentication failed. The uploaded file was illegible or name did not match user profile. Please upload again."
                                : "Submit official government identification credentials to unlock the 'Verified Owner Checkmark' which yields 4.2x higher conversion ratios."}
                        </p>
                      </div>
                    </div>
                  </div>

                  {(!currentUser.kycStatus || currentUser.kycStatus === "none" || currentUser.kycStatus === "rejected") ? (
                    <form onSubmit={handleKycSubmit} className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Document Type</label>
                        <select
                          value={kycDocType}
                          onChange={(e) => setKycDocType(e.target.value)}
                          className={`w-full rounded-xl border px-4 py-3 text-xs focus:outline-none font-bold ${
                            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        >
                          <option value="aadhaar">Aadhaar Card (12-Digit UIDAI)</option>
                          <option value="pan">Permanent Account Number (PAN Card)</option>
                          <option value="gst">GST Registration Certificate</option>
                          <option value="passport">Indian Passport</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Document Identification ID / Number</label>
                        <input
                          type="text"
                          required
                          placeholder={kycDocType === "aadhaar" ? "e.g. 5432 9876 1234" : kycDocType === "pan" ? "e.g. ABCDE1234F" : "Enter registration number"}
                          value={kycDocNum}
                          onChange={(e) => setKycDocNum(e.target.value)}
                          className={`w-full rounded-xl border px-4 py-3 text-xs focus:outline-none font-bold ${
                            darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Upload Scanned Document copy (PDF/JPG)</label>
                        <div 
                          onClick={() => setSimulatedFileName("selected_document_" + kycDocType + ".jpg")}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                            simulatedFileName 
                              ? "border-emerald-500/40 bg-emerald-500/5" 
                              : darkMode 
                                ? "border-slate-800 hover:border-slate-700 bg-slate-900/30" 
                                : "border-slate-200 hover:border-slate-300 bg-slate-50"
                          }`}
                        >
                          <UploadCloud className={`h-8 w-8 mx-auto mb-2 ${simulatedFileName ? "text-emerald-500" : "text-slate-500"}`} />
                          <p className="text-xs font-black uppercase tracking-wider">
                            {simulatedFileName ? "File Attached Successfully!" : "Drag & Drop or Click to Browse"}
                          </p>
                          <p className="text-[9px] text-slate-500 mt-1">
                            {simulatedFileName ? `${simulatedFileName} (Simulated Upload)` : "Supports JPEG, PNG or PDF formats up to 5MB."}
                          </p>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isUploadingKyc || !simulatedFileName}
                        className="w-full py-3.5 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        {isUploadingKyc ? "Performing Biometric Scan Sync..." : "Submit KYC credentials"}
                      </button>
                    </form>
                  ) : (
                    <div className={`p-6 rounded-2xl border text-center ${darkMode ? "bg-slate-900/20 border-slate-800" : "bg-slate-50 border-slate-150"}`}>
                      <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
                      <h4 className="text-xs font-black uppercase tracking-wider">Identity Vault Sealed</h4>
                      <p className="text-[10px] text-slate-500 max-w-sm mx-auto mt-1 leading-normal font-medium">
                        Your identification papers are safely stored and encrypted. Document ID linked: <span className="font-mono text-indigo-400 font-bold">{kycDocNum.substr(0,4) + " - XXXX - XXXX"}</span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Subscriptions & Billing Tab (Owner) */}
              {activeTab === "subscriptions" && isOwner && (
                <div className="space-y-6">
                  {/* Current Plan Badge */}
                  <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
                    darkMode ? "bg-slate-900/40 border-slate-800 text-white" : "bg-indigo-50/50 border-indigo-100 text-slate-800"
                  }`}>
                    <div className="flex items-center gap-3">
                      <Award className="h-8 w-8 text-amber-500 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider">
                          Active Account Level: 
                          <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-black text-amber-500 uppercase tracking-wider border border-amber-500/10 ml-2 animate-pulse">
                            {currentUser.subscriptionPlan?.toUpperCase() || "FREE"}
                          </span>
                        </h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {currentUser.subscriptionPlan === "featured"
                            ? "Premium listing placements, glow featured badge, and top-tier ranking active."
                            : currentUser.subscriptionPlan === "premium"
                              ? "Verify and showcase up to 5 properties. Standard leads unlocked."
                              : "Free plan limits active. Upgrade to boost relocations lead intake!"}
                        </p>
                      </div>
                    </div>
                    {currentUser.subscriptionExpiry && (
                      <span className="text-[9px] font-mono font-bold text-slate-500 bg-slate-900/10 px-2.5 py-1 rounded-xl">
                        Expires: {new Date(currentUser.subscriptionExpiry).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Pricing Tiers Grid */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pl-1">Partner Pricing Packages</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {[
                        { title: "Free Tier", price: "₹0", period: "forever", desc: "Basic single listing, normal search indexing. No special badges.", current: !currentUser.subscriptionPlan || currentUser.subscriptionPlan === "free", target: "free" },
                        { title: "Premium Partner", price: "₹499", period: "month", desc: "Allows up to 5 properties. Glowy Verified Badge. WhatsApp leads unlocked.", current: currentUser.subscriptionPlan === "premium", target: "premium" },
                        { title: "Featured Sponsor", price: "₹999", period: "month", desc: "Featured badges active. Top tier indexing. Priority AI chatbot matching.", current: currentUser.subscriptionPlan === "featured", target: "featured" }
                      ].map((tier, i) => (
                        <div
                          key={i}
                          className={`p-5 rounded-2xl border flex flex-col justify-between ${
                            tier.current
                              ? "border-amber-500 bg-amber-500/5 text-amber-500 shadow-lg shadow-amber-500/5"
                              : darkMode
                                ? "bg-slate-900/30 border-slate-800 text-white"
                                : "bg-white border-slate-100 shadow-sm text-slate-800"
                          }`}
                        >
                          <div>
                            <h5 className="text-xs font-black uppercase tracking-wider">{tier.title}</h5>
                            <div className="mt-2.5 flex items-baseline">
                              <span className="text-2xl font-black">{tier.price}</span>
                              <span className="text-[10px] font-bold text-slate-500 pl-0.5">/{tier.period}</span>
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{tier.desc}</p>
                          </div>
                          
                          <button
                            disabled={tier.current || tier.target === "free"}
                            onClick={() => {
                              setTargetUpgradePlan(tier.target as "premium" | "featured");
                              setShowRazorpay(true);
                            }}
                            className={`w-full py-2 rounded-xl mt-5 text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                              tier.current
                                ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                : tier.target === "free"
                                  ? "bg-slate-500/10 text-slate-400 cursor-not-allowed border border-transparent"
                                  : "bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-[1.02]"
                            }`}
                          >
                            {tier.current ? "Active Plan" : tier.target === "free" ? "Default Tier" : "Upgrade Partner"}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Past Invoices/Receipt Ledger */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3 pl-1">Past Transactions Ledger</h4>
                    {invoices.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-100/10 rounded-2xl">
                        <FileText className="mx-auto h-8 w-8 text-slate-700 mb-2" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">No past payments recorded</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-xl border border-slate-150/10">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className={`text-[9px] font-black uppercase tracking-wider border-b ${darkMode ? "bg-slate-900 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-200 text-slate-500"}`}>
                              <th className="p-3">Invoice Number</th>
                              <th className="p-3">Plan Package</th>
                              <th className="p-3">Amount</th>
                              <th className="p-3">Transaction Date</th>
                              <th className="p-3">Status</th>
                              <th className="p-3 text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150/10 text-[10px] font-bold">
                            {invoices.map((inv) => (
                              <tr key={inv.id} className={darkMode ? "hover:bg-slate-900/20 text-slate-300" : "hover:bg-slate-50 text-slate-700"}>
                                <td className="p-3 font-mono font-black">{inv.invoiceNumber}</td>
                                <td className="p-3 uppercase tracking-wider">{inv.plan}</td>
                                <td className="p-3 font-mono">₹{inv.amount.toLocaleString()}</td>
                                <td className="p-3">{new Date(inv.invoiceDate).toLocaleDateString()}</td>
                                <td className="p-3">
                                  <span className="inline-flex items-center rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] font-black text-emerald-500 uppercase tracking-wider border border-emerald-500/10">
                                    SUCCESS
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <button
                                    onClick={() => setInvoiceForReceipt(inv)}
                                    className="p-1.5 hover:bg-indigo-600/10 text-indigo-400 rounded-lg"
                                    title="View Invoice Receipt"
                                  >
                                    <FileText className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Razorpay Simulated Secure Checkout Modal Overlay */}
        {showRazorpay && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
            <div className={`relative w-full max-w-md rounded-2xl border p-6 text-slate-800 shadow-2xl animate-in zoom-in-95 duration-200 ${
              darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"
            }`}>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-slate-100/10 mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 px-2 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-[11px] font-black italic">
                    RAZORPAY
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-slate-400">Secure Checkout</span>
                </div>
                <button
                  onClick={() => setShowRazorpay(false)}
                  className="p-1 hover:bg-slate-500/10 rounded-lg text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Invoice breakdown summary */}
              <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 space-y-2 mb-4 text-xs font-bold">
                <div className="flex justify-between">
                  <span className="text-slate-400">Merchant:</span>
                  <span>CityMate India Solutions</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Upgrade Plan:</span>
                  <span className="uppercase text-indigo-400">{targetUpgradePlan} Package</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Base Fees:</span>
                  <span>₹{targetUpgradePlan === "premium" ? "422.88" : "846.61"}</span>
                </div>
                <div className="flex justify-between border-b border-slate-150/10 pb-2">
                  <span className="text-slate-400">Integrated GST (18%):</span>
                  <span>₹{targetUpgradePlan === "premium" ? "76.12" : "152.39"}</span>
                </div>
                <div className="flex justify-between text-base font-black pt-1.5 text-emerald-500">
                  <span>Total Amount Due:</span>
                  <span className="font-mono">₹{targetUpgradePlan === "premium" ? "499.00" : "999.00"}</span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Secure Payment Options</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-black">
                  {["Unified Payments Interface (UPI)", "Credit/Debit Card", "Netbanking", "Wallets"].map((method, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-xl border border-slate-150/10 text-center cursor-pointer hover:border-indigo-500/40 hover:bg-indigo-500/5 ${
                        idx === 0 ? "border-indigo-500/30 bg-indigo-500/5" : ""
                      }`}
                    >
                      {method}
                    </div>
                  ))}
                </div>
              </div>

              {/* Pay trigger */}
              <button
                onClick={handleRazorpayPaymentComplete}
                disabled={isProcessingPayment}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider mt-5 shadow-lg shadow-emerald-600/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isProcessingPayment ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Authorizing UPI Node Token...</span>
                  </>
                ) : (
                  <span>PAY SECURELY NOW</span>
                )}
              </button>

              <div className="text-center text-[8px] text-slate-500 mt-3 flex items-center justify-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>PCI-DSS Level 1 Encrypted • Secured by Razorpay India</span>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Receipt PDF simulated modal */}
        {invoiceForReceipt && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
            <div className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-slate-800 ${
              darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100"
            }`}>
              <div className="flex justify-between items-center pb-4 border-b border-slate-100/10 mb-4">
                <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span>COMMITTED PARTNER RECEIPT</span>
                </h4>
                <button
                  onClick={() => setInvoiceForReceipt(null)}
                  className="p-1 hover:bg-slate-500/10 rounded-lg text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Printable Receipt layout */}
              <div className="p-5 rounded-2xl border border-slate-150/10 space-y-4 text-[10px] leading-relaxed font-medium">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-black tracking-tight text-indigo-500">CITYMATE INDIA</h3>
                    <p className="text-[8px] text-slate-500">relocation marketplace solutions</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[8px] font-black text-emerald-500 border border-emerald-500/15">
                      PAID IN FULL
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 border-t border-b border-slate-150/10 py-3 font-bold text-xs">
                  <div>
                    <p className="text-[8px] text-slate-500 font-normal uppercase">Billed To:</p>
                    <p className="font-black">{invoiceForReceipt.userName}</p>
                    <p className="text-slate-400 font-medium">{invoiceForReceipt.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] text-slate-500 font-normal uppercase">Invoice Details:</p>
                    <p className="font-black">No: {invoiceForReceipt.invoiceNumber}</p>
                    <p className="text-slate-400 font-medium">Date: {new Date(invoiceForReceipt.invoiceDate).toLocaleString()}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between font-black uppercase text-[8px] text-slate-400 pb-1.5 border-b border-slate-150/10">
                    <span>Description of Upgrade</span>
                    <span>Total Amount</span>
                  </div>
                  <div className="flex justify-between font-bold pt-1.5">
                    <span>CityMate Owner Partner subscription upgrade: {invoiceForReceipt.plan.toUpperCase()} plan</span>
                    <span className="font-mono">₹{invoiceForReceipt.amount.toLocaleString()}</span>
                  </div>
                  <p className="text-[8px] text-slate-500 leading-normal">
                    Includes PCI-compliant digital signature verify, premium catalog ranking indices, and immediate API co-living recommendation priority nodes.
                  </p>
                </div>

                <div className="border-t border-slate-150/10 pt-3 flex flex-col items-end gap-1.5 text-xs font-bold">
                  <div className="flex justify-between w-48 text-[10px] text-slate-400">
                    <span>Subtotal:</span>
                    <span>₹{(invoiceForReceipt.amount / 1.18).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-48 text-[10px] text-slate-400 border-b border-slate-150/10 pb-1.5">
                    <span>CGST+SGST (18%):</span>
                    <span>₹{(invoiceForReceipt.amount - (invoiceForReceipt.amount / 1.18)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between w-48 text-base font-black text-emerald-500 pt-1">
                    <span>Total Paid:</span>
                    <span className="font-mono">₹{invoiceForReceipt.amount.toLocaleString()}.00</span>
                  </div>
                </div>

                <div className="text-[8px] text-slate-500 border-t border-slate-150/10 pt-3">
                  <p>Razorpay Transaction Signature: <span className="font-mono font-bold text-slate-400">{invoiceForReceipt.razorpayPaymentId}</span></p>
                  <p className="mt-1">CityMate India, Tech Square Sector 5, Sector-5, Gurugram, India • GSTIN 22AAAAA0000A1Z1</p>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 text-xs">
                <button
                  onClick={() => alert("Simulating receipt PDF download...")}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black uppercase rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF Receipt</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`border-t pt-4 mt-4 flex justify-between items-center text-[10px] text-slate-500 shrink-0 ${
          darkMode ? "border-slate-800" : "border-slate-100"
        }`}>
          <div>Role: <span className="font-bold text-slate-400 uppercase tracking-wider">{currentUser.role}</span></div>
          <div>Sync Status: <span className="text-emerald-500 uppercase font-black">Connected to cloud nodes</span></div>
        </div>

        {checkoutOpen && (
          <CheckoutOverlay
            isOpen={checkoutOpen}
            onClose={() => setCheckoutOpen(false)}
            bookingId={checkoutParams.bookingId}
            amount={checkoutParams.amount}
            purpose={checkoutParams.purpose}
            title={checkoutParams.title}
            user={currentUser}
            onSuccess={(txId) => {
              console.log("Payment completed for transaction:", txId);
              fetchDashboardData();
            }}
          />
        )}

      </div>
    </div>
  );
}
