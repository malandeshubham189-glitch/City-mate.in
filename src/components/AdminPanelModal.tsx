import React, { useState, useEffect } from "react";
import { UserProfile, Listing, UserRole, CMSBanner, CMSTestimonial, CMSStat, CMSBlogPost, CMSSeo } from "../types";
import { 
  X, Shield, Users, Building, MessageSquare, AlertTriangle, 
  CheckCircle, XCircle, Search, Trash2, ShieldAlert, BarChart2, TrendingUp, Sparkles, UserPlus, RefreshCw, Loader2,
  Activity
} from "lucide-react";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, addDoc, getDoc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import VerificationQueue from "./admin/VerificationQueue";
import BusinessAnalytics from "./admin/BusinessAnalytics";
import DevOpsCockpit from "./admin/DevOpsCockpit";
import MediaUploader from "./admin/MediaUploader";


interface AdminPanelModalProps {
  onClose: () => void;
  darkMode: boolean;
  currentUser: UserProfile;
  onRefreshListings: () => void;
  onRefreshCMS: () => void;
}

interface UserReport {
  id: string;
  listingId: string;
  listingTitle: string;
  reporterUid: string;
  reporterEmail: string;
  reason: string;
  createdAt: string;
}

export default function AdminPanelModal({ onClose, darkMode, currentUser, onRefreshListings, onRefreshCMS }: AdminPanelModalProps) {
  const [activeTab, setActiveTab] = useState<"analytics" | "users" | "listings" | "reports" | "cms" | "verification" | "devops">("analytics");
  
  // Data states
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [allReports, setAllReports] = useState<UserReport[]>([]);
  const [totalEnquiriesCount, setTotalEnquiriesCount] = useState(0);

  // Search & Filter states
  const [userSearch, setUserSearch] = useState("");
  const [listingSearch, setListingSearch] = useState("");
  const [listingStatusFilter, setListingStatusFilter] = useState<"all" | "active" | "pending" | "rejected">("all");

  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingListings, setLoadingListings] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  // CMS States
  const [cmsSubTab, setCmsSubTab] = useState<"banners" | "testimonials" | "stats" | "featured_listings" | "partners" | "blogs" | "seo" | "city_media">("banners");
  const [cmsBanners, setCmsBanners] = useState<CMSBanner[]>([]);
  const [cmsTestimonials, setCmsTestimonials] = useState<CMSTestimonial[]>([]);
  const [cmsStats, setCmsStats] = useState<CMSStat[]>([]);
  const [cmsPartners, setCmsPartners] = useState<string[]>([]);
  const [cmsBlogs, setCmsBlogs] = useState<CMSBlogPost[]>([]);
  const [cmsSeo, setCmsSeo] = useState<CMSSeo | null>(null);
  const [loadingCMS, setLoadingCMS] = useState(false);

  // Form states for adding/editing items
  const [newBanner, setNewBanner] = useState<CMSBanner>({ name: "", slogan: "", image: "", relocations: "" });
  const [editingBannerIndex, setEditingBannerIndex] = useState<number | null>(null);

  const [newTestimonial, setNewTestimonial] = useState<CMSTestimonial>({ quote: "", author: "", role: "", city: "", avatar: "" });
  const [editingTestimonialIndex, setEditingTestimonialIndex] = useState<number | null>(null);

  const [newStat, setNewStat] = useState<CMSStat>({ label: "", val: "", desc: "" });
  const [editingStatIndex, setEditingStatIndex] = useState<number | null>(null);

  const [newPartner, setNewPartner] = useState("");
  
  const [newBlog, setNewBlog] = useState<CMSBlogPost>({ id: "", title: "", excerpt: "", content: "", date: "", author: "", image: "" });
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);

  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");

  const fetchCMSData = async () => {
    setLoadingCMS(true);
    try {
      // 1. SEO
      const seoSnap = await getDoc(doc(db, "cms", "seo"));
      if (seoSnap.exists()) {
        const data = seoSnap.data() as CMSSeo;
        setCmsSeo(data);
        setSeoTitle(data.title);
        setSeoDescription(data.description);
        setSeoKeywords(data.keywords || "");
      }

      // 2. Banners
      const bannersSnap = await getDoc(doc(db, "cms", "banners"));
      if (bannersSnap.exists()) setCmsBanners(bannersSnap.data().list || []);

      // 3. Testimonials
      const testSnap = await getDoc(doc(db, "cms", "testimonials"));
      if (testSnap.exists()) setCmsTestimonials(testSnap.data().list || []);

      // 4. Stats
      const statsSnap = await getDoc(doc(db, "cms", "stats"));
      if (statsSnap.exists()) setCmsStats(statsSnap.data().list || []);

      // 5. Partners
      const partnersSnap = await getDoc(doc(db, "cms", "partners"));
      if (partnersSnap.exists()) setCmsPartners(partnersSnap.data().list || []);

      // 6. Blogs
      const blogsSnap = await getDoc(doc(db, "cms", "blogs"));
      if (blogsSnap.exists()) setCmsBlogs(blogsSnap.data().list || []);

    } catch (e) {
      console.error("Error loading CMS data:", e);
    } finally {
      setLoadingCMS(false);
    }
  };

  // Load Admin Data
  useEffect(() => {
    fetchUsers();
    fetchListings();
    fetchReports();
    fetchEnquiriesStats();
    fetchCMSData();
  }, []);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const usersList: UserProfile[] = [];
      snap.forEach((d) => {
        usersList.push({ ...d.data(), uid: d.id } as UserProfile);
      });
      // Sort newest users first
      usersList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAllUsers(usersList);
    } catch (err) {
      console.error("Error loading users for admin:", err);
      handleFirestoreError(err, OperationType.GET, "users");
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchListings = async () => {
    setLoadingListings(true);
    try {
      const snap = await getDocs(collection(db, "listings"));
      const listingsList: Listing[] = [];
      snap.forEach((d) => {
        listingsList.push({ ...d.data(), id: d.id } as Listing);
      });
      listingsList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAllListings(listingsList);
    } catch (err) {
      console.error("Error loading listings for admin:", err);
      handleFirestoreError(err, OperationType.GET, "listings");
    } finally {
      setLoadingListings(false);
    }
  };

  const fetchReports = async () => {
    setLoadingReports(true);
    try {
      const snap = await getDocs(collection(db, "reports"));
      const reportsList: UserReport[] = [];
      snap.forEach((d) => {
        reportsList.push({ ...d.data(), id: d.id } as UserReport);
      });
      reportsList.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAllReports(reportsList);
    } catch (err) {
      console.error("Error loading reports for admin:", err);
      // Suppress or catch gracefully
      console.warn("Reports collection query failed or doesn't exist yet.");
    } finally {
      setLoadingReports(false);
    }
  };

  const fetchEnquiriesStats = async () => {
    try {
      const snap = await getDocs(collection(db, "enquiries"));
      setTotalEnquiriesCount(snap.size);
    } catch (err) {
      console.warn("Failed to get total enquiries:", err);
    }
  };

  // User Actions: Promote / Demote / Delete
  const handleUpdateUserRole = async (userId: string, newRole: UserRole) => {
    if (userId === currentUser.uid) {
      alert("You cannot change your own super-admin privileges!");
      return;
    }
    setIsMutating(true);
    try {
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, { role: newRole });
      
      setAllUsers((prev) => 
        prev.map((u) => (u.uid === userId ? { ...u, role: newRole } : u))
      );
      // Send mock system notification as requested by prompt
      await addSystemNotification(userId, `Your account role has been updated to ${newRole.toUpperCase()} by Admin.`);
    } catch (err) {
      console.error("Failed to update role:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${userId}`);
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === currentUser.uid) {
      alert("You cannot delete your own account!");
      return;
    }
    if (!window.confirm("Are you sure you want to permanently delete this user profile? This action is irreversible.")) {
      return;
    }
    setIsMutating(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      setAllUsers((prev) => prev.filter((u) => u.uid !== userId));
      alert("User account deleted successfully.");
    } catch (err) {
      console.error("Failed to delete user:", err);
      handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
    } finally {
      setIsMutating(false);
    }
  };

  // Listing Actions: Approve / Reject / Delete
  const handleSetListingStatus = async (listingId: string, status: "active" | "rejected") => {
    setIsMutating(true);
    try {
      // Query exact document from Firebase
      const q = query(collection(db, "listings"), where("id", "==", listingId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const docRef = snap.docs[0].ref;
        await updateDoc(docRef, { status });
        
        setAllListings((prev) => 
          prev.map((l) => (l.id === listingId ? { ...l, status } : l))
        );
        onRefreshListings();

        // Add real notification
        const listingData = snap.docs[0].data() as Listing;
        await addSystemNotification(
          listingData.ownerId, 
          `Your space "${listingData.title}" has been reviewed and marked as ${status.toUpperCase()} by the moderator core.`
        );
      }
    } catch (err) {
      console.error("Failed to approve/reject listing:", err);
      handleFirestoreError(err, OperationType.WRITE, `listings/${listingId}`);
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!window.confirm("Are you sure you want to permanently remove this listing from CityMate catalog?")) {
      return;
    }
    setIsMutating(true);
    try {
      const q = query(collection(db, "listings"), where("id", "==", listingId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await deleteDoc(snap.docs[0].ref);
        setAllListings((prev) => prev.filter((l) => l.id !== listingId));
        onRefreshListings();
        alert("Listing removed successfully.");
      }
    } catch (err) {
      console.error("Failed to delete listing:", err);
      handleFirestoreError(err, OperationType.DELETE, `listings/${listingId}`);
    } finally {
      setIsMutating(false);
    }
  };

  // Reports and moderation: Delete Listing vs Dismiss Report
  const handleDismissReport = async (reportId: string) => {
    setIsMutating(true);
    try {
      await deleteDoc(doc(db, "reports", reportId));
      setAllReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error("Failed to delete report:", err);
      handleFirestoreError(err, OperationType.DELETE, `reports/${reportId}`);
    } finally {
      setIsMutating(false);
    }
  };

  const handleModerateReportedListing = async (reportId: string, listingId: string) => {
    if (!window.confirm("Are you sure you want to enforce moderation and delete this flagged space?")) {
      return;
    }
    setIsMutating(true);
    try {
      // 1. Delete listing
      const q = query(collection(db, "listings"), where("id", "==", listingId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        await deleteDoc(snap.docs[0].ref);
        setAllListings((prev) => prev.filter((l) => l.id !== listingId));
        onRefreshListings();
      }

      // 2. Delete report
      await deleteDoc(doc(db, "reports", reportId));
      setAllReports((prev) => prev.filter((r) => r.id !== reportId));

      alert("Listing successfully moderated and deleted. Report closed.");
    } catch (err) {
      console.error("Moderation failed:", err);
      handleFirestoreError(err, OperationType.WRITE, `listings`);
    } finally {
      setIsMutating(false);
    }
  };

  // Helper to trigger system alerts / notification records
  const addSystemNotification = async (userId: string, text: string) => {
    try {
      await addDoc(collection(db, "notifications"), {
        userId,
        text,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Error recording notification log:", e);
    }
  };

  // Math Analytics Breakdown
  const totalListings = allListings.length;
  const activeListings = allListings.filter((l) => l.status === "active").length;
  const pendingListings = allListings.filter((l) => l.status === "pending").length;
  const rejectedListings = allListings.filter((l) => l.status === "rejected").length;

  const usersCount = allUsers.length;
  const ownersCount = allUsers.filter((u) => u.role === "owner").length;
  const seekersCount = allUsers.filter((u) => u.role === "user").length;

  // Category Densities for Custom SVG Bar Chart
  const categoryCounts: Record<string, number> = {};
  allListings.forEach((l) => {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1;
  });

  const categories = ["rooms", "pg", "hostels", "flats", "mess", "tiffin", "jobs", "tuition"];
  const maxVal = Math.max(...categories.map((c) => categoryCounts[c] || 0), 1);

  // Search filter collections
  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.phone && u.phone.includes(userSearch))
  );

  const filteredListings = allListings.filter((l) => {
    const matchesSearch =
      l.title.toLowerCase().includes(listingSearch.toLowerCase()) ||
      l.locality.toLowerCase().includes(listingSearch.toLowerCase()) ||
      l.city.toLowerCase().includes(listingSearch.toLowerCase());
    const matchesStatus = listingStatusFilter === "all" || l.status === listingStatusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className={`relative w-full max-w-6xl rounded-2xl p-6 md:p-8 border flex flex-col h-[85vh] transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 ${
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
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-1.5">
                CityMate Admin Control Panel
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black text-emerald-500 uppercase tracking-widest border border-emerald-500/20 animate-pulse">
                  System Live
                </span>
              </h3>
              <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                Global moderation dashboard, verified telemetry audits, and role-based access management.
              </p>
            </div>
          </div>
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

        {/* Mutation Overlay */}
        {isMutating && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-2xl">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3 shadow-xl">
              <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Syncing Ledger changes...</span>
            </div>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex border-b border-slate-100/10 mb-6 shrink-0 overflow-x-auto gap-2">
          {[
            { id: "analytics", label: "Analytics Hub", icon: BarChart2 },
            { id: "users", label: `User Management (${usersCount})`, icon: Users },
            { id: "listings", label: `Reviews & Approvals (${pendingListings})`, icon: Building },
            { id: "reports", label: `Moderation Queue (${allReports.length})`, icon: ShieldAlert },
            { id: "cms", label: "CMS Homepage Editor", icon: TrendingUp },
            { id: "verification", label: "KYC & Verification", icon: Shield },
            { id: "devops", label: "DevOps Cockpit", icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSel = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  isSel
                    ? darkMode
                      ? "border-purple-500 text-purple-400 bg-purple-950/10"
                      : "border-brand-indigo text-brand-indigo bg-indigo-50/20"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          
          {/* 1. Analytics Hub */}
          {activeTab === "analytics" && (
            <BusinessAnalytics darkMode={darkMode} />
          )}

          {/* 2. User Management */}
          {activeTab === "users" && (
            <div className="space-y-4">
              
              {/* Actions Header */}
              <div className="flex flex-col sm:flex-row justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search users by name, email, or phone..."
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs focus:outline-none font-semibold ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                <button
                  onClick={fetchUsers}
                  className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-black uppercase transition-all cursor-pointer ${
                    darkMode ? "border-slate-800 bg-slate-900 text-slate-300" : "border-slate-200 bg-white text-slate-700"
                  }`}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Reload Ledger</span>
                </button>
              </div>

              {/* Users Table */}
              {loadingUsers ? (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-purple-400 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Retrieving authenticated identities...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-16 border rounded-2xl border-dashed border-slate-100/10">
                  <Users className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No user accounts found matching your query.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-100/10">
                  <table className="w-full text-left text-xs">
                    <thead className={`text-[10px] font-black uppercase tracking-wider border-b ${
                      darkMode ? "bg-slate-900/60 border-slate-800 text-slate-400" : "bg-slate-50 border-slate-100 text-slate-500"
                    }`}>
                      <tr>
                        <th className="px-4 py-3">Full Name</th>
                        <th className="px-4 py-3">Email Address</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Joined Date</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/10 font-semibold">
                      {filteredUsers.map((user) => (
                        <tr key={user.uid} className={darkMode ? "hover:bg-slate-900/40" : "hover:bg-slate-50/50"}>
                          <td className="px-4 py-3.5 font-bold flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black uppercase ${
                              user.role === "admin" 
                                ? "bg-red-500/10 text-red-400" 
                                : user.role === "owner" 
                                  ? "bg-purple-500/10 text-purple-400" 
                                  : "bg-blue-500/10 text-blue-400"
                            }`}>
                              {user.name.charAt(0)}
                            </div>
                            <span>{user.name}</span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 font-medium">{user.email}</td>
                          <td className="px-4 py-3.5 text-slate-400 font-medium">{user.phone || "Not set"}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${
                              user.role === "admin"
                                ? "bg-red-500/10 text-red-400 border border-red-500/10"
                                : user.role === "owner"
                                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/10"
                                  : "bg-blue-500/10 text-blue-400 border border-blue-500/10"
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 font-mono text-[10px]">
                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex justify-end gap-1.5">
                              {/* Change Role selection dropdown */}
                              <select
                                value={user.role}
                                onChange={(e) => handleUpdateUserRole(user.uid, e.target.value as UserRole)}
                                className={`rounded-lg border px-2 py-1 text-[10px] focus:outline-none font-bold ${
                                  darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-700"
                                }`}
                                disabled={user.uid === currentUser.uid}
                              >
                                <option value="user font-bold">Seeker</option>
                                <option value="owner font-bold">Owner</option>
                                <option value="admin font-bold">Admin</option>
                              </select>
                              
                              <button
                                onClick={() => handleDeleteUser(user.uid)}
                                className="p-1 rounded-lg hover:bg-red-500/10 text-red-500/80 hover:text-red-500 transition-colors"
                                title="Delete account"
                                disabled={user.uid === currentUser.uid}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* 3. Review & Approvals Queue */}
          {activeTab === "listings" && (
            <div className="space-y-4">
              {/* Search Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-grow">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={listingSearch}
                    onChange={(e) => setListingSearch(e.target.value)}
                    placeholder="Search listings by title, category, city..."
                    className={`w-full rounded-xl border pl-10 pr-4 py-2.5 text-xs focus:outline-none font-semibold ${
                      darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                    }`}
                  />
                </div>
                
                <select
                  value={listingStatusFilter}
                  onChange={(e) => setListingStatusFilter(e.target.value as any)}
                  className={`rounded-xl border px-3 py-2.5 text-xs focus:outline-none font-bold ${
                    darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-700"
                  }`}
                >
                  <option value="all">All Verification Statuses</option>
                  <option value="pending">Pending Review Only</option>
                  <option value="active">Active / Verified</option>
                  <option value="rejected">Rejected Only</option>
                </select>
              </div>

              {/* Listings Queue */}
              {loadingListings ? (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-purple-400 mb-2" />
                  <p className="text-xs text-slate-500 font-bold">Querying property indices...</p>
                </div>
              ) : filteredListings.length === 0 ? (
                <div className="text-center py-16 border rounded-2xl border-dashed border-slate-100/10">
                  <Building className="mx-auto h-8 w-8 text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No property listings found matching these criteria.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredListings.map((listing) => (
                    <div 
                      key={listing.id}
                      className={`p-4 rounded-xl border flex gap-4 relative overflow-hidden ${
                        darkMode ? "bg-slate-900/30 border-slate-800" : "bg-slate-50 border-slate-150"
                      }`}
                    >
                      {/* Image Preview */}
                      <div className="h-20 w-24 rounded-lg overflow-hidden shrink-0 border border-slate-100/10">
                        <img 
                          src={listing.images[0] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=300&q=80"} 
                          alt={listing.title} 
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>

                      {/* Listing Info */}
                      <div className="flex-grow min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded">
                              {listing.category}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${
                              listing.status === "active" 
                                ? "bg-emerald-500/10 text-emerald-500" 
                                : listing.status === "rejected" 
                                  ? "bg-red-500/10 text-red-500" 
                                  : "bg-amber-500/10 text-amber-500"
                            }`}>
                              {listing.status}
                            </span>
                            <span className="text-[9px] font-bold text-slate-500">
                              {listing.locality}, {listing.city}
                            </span>
                          </div>

                          <h4 className={`text-xs font-black truncate mt-1 ${darkMode ? "text-white" : "text-slate-900"}`}>
                            {listing.title}
                          </h4>
                          <p className={`text-[10px] mt-0.5 text-slate-400 font-medium`}>
                            Posted by <span className="font-bold text-slate-300">{listing.ownerName}</span>
                          </p>
                        </div>

                        {/* Approvals Control Buttons */}
                        <div className="flex items-center justify-between border-t border-slate-100/10 pt-2.5 mt-2 gap-2">
                          <span className="text-xs font-mono font-black text-emerald-500">
                            ₹{listing.price.toLocaleString("en-IN")}/{listing.pricePeriod}
                          </span>
                          
                          <div className="flex gap-1.5 shrink-0">
                            {listing.status !== "active" && (
                              <button
                                onClick={() => handleSetListingStatus(listing.id, "active")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-[9px] font-black uppercase tracking-wider text-white transition-all cursor-pointer active:scale-95"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                                <span>Verify & Approve</span>
                              </button>
                            )}
                            
                            {listing.status !== "rejected" && (
                              <button
                                onClick={() => handleSetListingStatus(listing.id, "rejected")}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-600/10 text-red-500 hover:bg-red-600 hover:text-white text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 border border-red-500/10"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            )}
                            
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

          {/* 4. Moderation Reports Queue */}
          {activeTab === "reports" && (
            <div className="space-y-4">
              
              {loadingReports ? (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-purple-400 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase">Querying incident logs...</p>
                </div>
              ) : allReports.length === 0 ? (
                <div className="text-center py-16 border rounded-2xl border-dashed border-slate-100/10">
                  <Shield className="mx-auto h-8 w-8 text-emerald-500 mb-2 opacity-60" />
                  <p className="text-xs text-slate-400 font-bold">Excellent work! Compliance queue is perfectly clear.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allReports.map((report) => (
                    <div 
                      key={report.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden ${
                        darkMode ? "bg-red-950/10 border-red-900/20" : "bg-red-50/40 border-red-100"
                      }`}
                    >
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
                      
                      <div className="space-y-1.5 pl-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[9px] font-black bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/10 uppercase tracking-widest">
                            <AlertTriangle className="h-3 w-3" /> Flagged Listing
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold">
                            Reported on {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "N/A"}
                          </span>
                        </div>
                        <h4 className={`text-xs font-black truncate max-w-md ${darkMode ? "text-white" : "text-slate-900"}`}>
                          Space: <span className="underline">{report.listingTitle}</span> (ID: {report.listingId})
                        </h4>
                        <p className="text-xs text-slate-400 leading-normal">
                          Reason for alert: <span className="font-bold text-red-400 italic">"{report.reason}"</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          Filed by: <span className="font-semibold">{report.reporterEmail}</span>
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleModerateReportedListing(report.id, report.listingId)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-[10px] font-black uppercase text-white tracking-wider transition-all cursor-pointer active:scale-95 shadow-md shadow-red-950/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Moderate & Delete</span>
                        </button>
                        
                        <button
                          onClick={() => handleDismissReport(report.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                            darkMode ? "border-slate-800 bg-slate-950 text-slate-400 hover:text-white" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                          <span>Dismiss Report</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* 5. CMS Homepage Editor */}
          {activeTab === "cms" && (
            <div className="space-y-6">
              {/* CMS Sub-Tabs Selector */}
              <div className="flex border-b border-slate-100/10 shrink-0 overflow-x-auto gap-2 pb-2">
                {[
                  { id: "banners", label: "Banners (Cities)" },
                  { id: "city_media", label: "City Media (Upload)" },
                  { id: "testimonials", label: "Testimonials" },
                  { id: "stats", label: "Statistics" },
                  { id: "featured_listings", label: "Featured Listings" },
                  { id: "partners", label: "Partners" },
                  { id: "blogs", label: "Blogs" },
                  { id: "seo", label: "SEO Metadata" }
                ].map((subTab) => (
                  <button
                    key={subTab.id}
                    onClick={() => {
                      setCmsSubTab(subTab.id as any);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                      cmsSubTab === subTab.id
                        ? darkMode
                          ? "bg-purple-600 text-white"
                          : "bg-indigo-600 text-white"
                        : darkMode
                          ? "bg-slate-900 text-slate-400 hover:bg-slate-800"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {subTab.label}
                  </button>
                ))}
              </div>

              {loadingCMS ? (
                <div className="text-center py-20 flex flex-col items-center justify-center">
                  <RefreshCw className="h-6 w-6 animate-spin text-purple-400 mb-2" />
                  <p className="text-xs text-slate-500 font-bold uppercase">Loading CMS configuration...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* SUBTAB: Banners */}
                  {cmsSubTab === "banners" && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider mb-3">Add / Update Relocation City Banner</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                          <input
                            type="text"
                            placeholder="City Name (e.g. Bengaluru)"
                            value={newBanner.name}
                            onChange={(e) => setNewBanner({ ...newBanner, name: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Slogan (e.g. Silicon Valley of India)"
                            value={newBanner.slogan}
                            onChange={(e) => setNewBanner({ ...newBanner, slogan: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Image URL"
                            value={newBanner.image}
                            onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Relocations Metric (e.g. 4.8k relocations)"
                            value={newBanner.relocations}
                            onChange={(e) => setNewBanner({ ...newBanner, relocations: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={async () => {
                              if (!newBanner.name || !newBanner.image) return;
                              setIsMutating(true);
                              try {
                                let updated = [...cmsBanners];
                                if (editingBannerIndex !== null) {
                                  updated[editingBannerIndex] = newBanner;
                                } else {
                                  updated.push(newBanner);
                                }
                                await setDoc(doc(db, "cms", "banners"), { list: updated });
                                setCmsBanners(updated);
                                setNewBanner({ name: "", slogan: "", image: "", relocations: "" });
                                setEditingBannerIndex(null);
                                onRefreshCMS();
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                          >
                            {editingBannerIndex !== null ? "Save Update" : "Add Banner"}
                          </button>
                          {editingBannerIndex !== null && (
                            <button
                              onClick={() => {
                                setNewBanner({ name: "", slogan: "", image: "", relocations: "" });
                                setEditingBannerIndex(null);
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {cmsBanners.map((banner, index) => (
                          <div key={index} className={`p-4 rounded-xl border relative overflow-hidden flex flex-col justify-between ${darkMode ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-white"}`}>
                            <div className="h-24 rounded-lg overflow-hidden mb-3 border border-slate-800/20">
                              <img src={banner.image} alt={banner.name} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <h5 className="font-black text-xs">{banner.name}</h5>
                              <p className="text-[10px] text-slate-400 mt-0.5">{banner.slogan}</p>
                              <p className="text-[10px] text-purple-400 font-bold mt-1">{banner.relocations}</p>
                            </div>
                            <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100/10">
                              <button
                                onClick={() => {
                                  setNewBanner(banner);
                                  setEditingBannerIndex(index);
                                }}
                                className="text-[9px] font-black uppercase text-indigo-500 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  setIsMutating(true);
                                  try {
                                    const updated = cmsBanners.filter((_, idx) => idx !== index);
                                    await setDoc(doc(db, "cms", "banners"), { list: updated });
                                    setCmsBanners(updated);
                                    onRefreshCMS();
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setIsMutating(false);
                                  }
                                }}
                                className="text-[9px] font-black uppercase text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: City Media Upload */}
                  {cmsSubTab === "city_media" && (
                    <MediaUploader darkMode={darkMode} />
                  )}

                  {/* SUBTAB: Testimonials */}
                  {cmsSubTab === "testimonials" && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider mb-3">Add / Update Testimonial</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Author Name (e.g. Priya Sharma)"
                            value={newTestimonial.author}
                            onChange={(e) => setNewTestimonial({ ...newTestimonial, author: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Role / Company (e.g. SDE-1 at Amazon)"
                            value={newTestimonial.role}
                            onChange={(e) => setNewTestimonial({ ...newTestimonial, role: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Relocation City (e.g. Bengaluru)"
                            value={newTestimonial.city}
                            onChange={(e) => setNewTestimonial({ ...newTestimonial, city: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Avatar Initial (e.g. P)"
                            maxLength={1}
                            value={newTestimonial.avatar}
                            onChange={(e) => setNewTestimonial({ ...newTestimonial, avatar: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                        </div>
                        <textarea
                          placeholder="Quote content..."
                          value={newTestimonial.quote}
                          onChange={(e) => setNewTestimonial({ ...newTestimonial, quote: e.target.value })}
                          rows={3}
                          className={`w-full px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                        />
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={async () => {
                              if (!newTestimonial.author || !newTestimonial.quote) return;
                              setIsMutating(true);
                              try {
                                let updated = [...cmsTestimonials];
                                if (editingTestimonialIndex !== null) {
                                  updated[editingTestimonialIndex] = newTestimonial;
                                } else {
                                  updated.push(newTestimonial);
                                }
                                await setDoc(doc(db, "cms", "testimonials"), { list: updated });
                                setCmsTestimonials(updated);
                                setNewTestimonial({ quote: "", author: "", role: "", city: "", avatar: "" });
                                setEditingTestimonialIndex(null);
                                onRefreshCMS();
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                          >
                            {editingTestimonialIndex !== null ? "Save Update" : "Add Testimonial"}
                          </button>
                          {editingTestimonialIndex !== null && (
                            <button
                              onClick={() => {
                                setNewTestimonial({ quote: "", author: "", role: "", city: "", avatar: "" });
                                setEditingTestimonialIndex(null);
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {cmsTestimonials.map((test, index) => (
                          <div key={index} className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-white"}`}>
                            <p className="text-xs italic text-slate-400">"{test.quote}"</p>
                            <div className="flex items-center gap-2 mt-4">
                              <div className="h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                                {test.avatar || test.author[0]}
                              </div>
                              <div>
                                <h6 className="font-extrabold text-xs">{test.author}</h6>
                                <p className="text-[10px] text-slate-500">{test.role} • {test.city}</p>
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100/10">
                              <button
                                onClick={() => {
                                  setNewTestimonial(test);
                                  setEditingTestimonialIndex(index);
                                }}
                                className="text-[9px] font-black uppercase text-indigo-500 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  setIsMutating(true);
                                  try {
                                    const updated = cmsTestimonials.filter((_, idx) => idx !== index);
                                    await setDoc(doc(db, "cms", "testimonials"), { list: updated });
                                    setCmsTestimonials(updated);
                                    onRefreshCMS();
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setIsMutating(false);
                                  }
                                }}
                                className="text-[9px] font-black uppercase text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: Stats */}
                  {cmsSubTab === "stats" && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider mb-3">Add / Update City Statistics</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="Stat Label (e.g. Trusted Relocations)"
                            value={newStat.label}
                            onChange={(e) => setNewStat({ ...newStat, label: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Value Metric (e.g. 15,400+)"
                            value={newStat.val}
                            onChange={(e) => setNewStat({ ...newStat, val: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Short Description (e.g. Across 8 metro areas)"
                            value={newStat.desc}
                            onChange={(e) => setNewStat({ ...newStat, desc: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                        </div>
                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={async () => {
                              if (!newStat.label || !newStat.val) return;
                              setIsMutating(true);
                              try {
                                let updated = [...cmsStats];
                                if (editingStatIndex !== null) {
                                  updated[editingStatIndex] = newStat;
                                } else {
                                  updated.push(newStat);
                                }
                                await setDoc(doc(db, "cms", "stats"), { list: updated });
                                setCmsStats(updated);
                                setNewStat({ label: "", val: "", desc: "" });
                                setEditingStatIndex(null);
                                onRefreshCMS();
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                          >
                            {editingStatIndex !== null ? "Save Update" : "Add Stat"}
                          </button>
                          {editingStatIndex !== null && (
                            <button
                              onClick={() => {
                                setNewStat({ label: "", val: "", desc: "" });
                                setEditingStatIndex(null);
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {cmsStats.map((stat, index) => (
                          <div key={index} className={`p-4 rounded-xl border text-center relative overflow-hidden ${darkMode ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-white"}`}>
                            <p className="text-[10px] font-black uppercase text-slate-400">{stat.label}</p>
                            <p className="text-2xl font-black text-indigo-500 mt-1">{stat.val}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{stat.desc}</p>
                            <div className="flex gap-2 justify-center mt-4 pt-2 border-t border-slate-100/10">
                              <button
                                onClick={() => {
                                  setNewStat(stat);
                                  setEditingStatIndex(index);
                                }}
                                className="text-[9px] font-black uppercase text-indigo-500 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  setIsMutating(true);
                                  try {
                                    const updated = cmsStats.filter((_, idx) => idx !== index);
                                    await setDoc(doc(db, "cms", "stats"), { list: updated });
                                    setCmsStats(updated);
                                    onRefreshCMS();
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setIsMutating(false);
                                  }
                                }}
                                className="text-[9px] font-black uppercase text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: Featured Listings */}
                  {cmsSubTab === "featured_listings" && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="text-xs font-black uppercase tracking-wider">Configure Featured Listings</h4>
                          <p className="text-[10px] text-slate-400">Toggle whether a property appears in the hand-picked premium slider.</p>
                        </div>
                        <input
                          type="text"
                          placeholder="Search space..."
                          value={listingSearch}
                          onChange={(e) => setListingSearch(e.target.value)}
                          className={`px-3 py-2 text-xs rounded-lg border max-w-xs ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                        />
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-100/10">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className={darkMode ? "bg-slate-900/60" : "bg-slate-50"}>
                              <th className="p-3 font-black uppercase tracking-wider text-[10px]">Property Title</th>
                              <th className="p-3 font-black uppercase tracking-wider text-[10px]">City / Locality</th>
                              <th className="p-3 font-black uppercase tracking-wider text-[10px]">Owner Name</th>
                              <th className="p-3 font-black uppercase tracking-wider text-[10px]">Pricing</th>
                              <th className="p-3 font-black uppercase tracking-wider text-[10px] text-center">Featured Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {allListings.filter(l => l.title.toLowerCase().includes(listingSearch.toLowerCase())).map((listing) => (
                              <tr key={listing.id} className={`border-t border-slate-100/10 ${darkMode ? "hover:bg-slate-900/20" : "hover:bg-slate-50"}`}>
                                <td className="p-3 font-black">{listing.title}</td>
                                <td className="p-3 text-slate-400">{listing.locality} ({listing.city})</td>
                                <td className="p-3 font-medium">{listing.ownerName}</td>
                                <td className="p-3 font-mono font-bold text-indigo-500">₹{listing.price}</td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={async () => {
                                      setIsMutating(true);
                                      try {
                                        const nextValue = !listing.isFeatured;
                                        await updateDoc(doc(db, "listings", listing.id), { isFeatured: nextValue });
                                        // Update local
                                        setAllListings(prev => prev.map(item => item.id === listing.id ? { ...item, isFeatured: nextValue } : item));
                                        onRefreshListings();
                                      } catch (e) {
                                        console.error(e);
                                      } finally {
                                        setIsMutating(false);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                      listing.isFeatured
                                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                        : "bg-slate-800 text-slate-400 hover:text-white"
                                    }`}
                                  >
                                    {listing.isFeatured ? "Featured Premium" : "Standard"}
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: Partners */}
                  {cmsSubTab === "partners" && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider mb-3">Add Corporate Partner Logo Placeholder</h4>
                        <div className="flex gap-2 max-w-md">
                          <input
                            type="text"
                            placeholder="Partner brand name (e.g. Nestaway)"
                            value={newPartner}
                            onChange={(e) => setNewPartner(e.target.value)}
                            className={`flex-1 px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <button
                            onClick={async () => {
                              if (!newPartner) return;
                              setIsMutating(true);
                              try {
                                const updated = [...cmsPartners, newPartner];
                                await setDoc(doc(db, "cms", "partners"), { list: updated });
                                setCmsPartners(updated);
                                setNewPartner("");
                                onRefreshCMS();
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                          >
                            Add Partner
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2.5">
                        {cmsPartners.map((partner, index) => (
                          <div key={index} className={`px-4 py-2 rounded-xl border flex items-center gap-3 ${darkMode ? "border-slate-800 bg-slate-900/20" : "border-slate-150 bg-white"}`}>
                            <span className="font-extrabold text-xs">{partner}</span>
                            <button
                              onClick={async () => {
                                setIsMutating(true);
                                try {
                                  const updated = cmsPartners.filter((_, idx) => idx !== index);
                                  await setDoc(doc(db, "cms", "partners"), { list: updated });
                                  setCmsPartners(updated);
                                  onRefreshCMS();
                                } catch (e) {
                                  console.error(e);
                                } finally {
                                  setIsMutating(false);
                                }
                              }}
                              className="text-red-500 hover:text-red-400 font-bold text-xs"
                              title="Delete partner"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: Blogs */}
                  {cmsSubTab === "blogs" && (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-xl border ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider mb-3">
                          {editingBlogId ? "Edit Blog Post" : "Publish New Blog Post"}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-3">
                          <input
                            type="text"
                            placeholder="Title (e.g. How to Avoid Rental Scams in Pune)"
                            value={newBlog.title}
                            onChange={(e) => setNewBlog({ ...newBlog, title: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Author Name (e.g. Team CityMate)"
                            value={newBlog.author}
                            onChange={(e) => setNewBlog({ ...newBlog, author: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                          <input
                            type="text"
                            placeholder="Image URL"
                            value={newBlog.image}
                            onChange={(e) => setNewBlog({ ...newBlog, image: e.target.value })}
                            className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="Short Excerpt (visible on list view)"
                          value={newBlog.excerpt}
                          onChange={(e) => setNewBlog({ ...newBlog, excerpt: e.target.value })}
                          className={`w-full px-3 py-2 text-xs rounded-lg border mb-3 ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                        />
                        <textarea
                          placeholder="Full Article Content (Markdown or plain text)"
                          value={newBlog.content}
                          onChange={(e) => setNewBlog({ ...newBlog, content: e.target.value })}
                          rows={6}
                          className={`w-full px-3 py-2 text-xs rounded-lg border mb-3 ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                        />
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={async () => {
                              if (!newBlog.title || !newBlog.content) return;
                              setIsMutating(true);
                              try {
                                let updated = [...cmsBlogs];
                                if (editingBlogId) {
                                  updated = updated.map(item => item.id === editingBlogId ? { ...newBlog, id: editingBlogId } : item);
                                } else {
                                  const idToUse = String(Date.now());
                                  updated.push({
                                    ...newBlog,
                                    id: idToUse,
                                    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
                                  });
                                }
                                await setDoc(doc(db, "cms", "blogs"), { list: updated });
                                setCmsBlogs(updated);
                                setNewBlog({ id: "", title: "", excerpt: "", content: "", date: "", author: "", image: "" });
                                setEditingBlogId(null);
                                onRefreshCMS();
                              } catch (e) {
                                console.error(e);
                              } finally {
                                setIsMutating(false);
                              }
                            }}
                            className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                          >
                            {editingBlogId ? "Save Post Changes" : "Publish Post"}
                          </button>
                          {editingBlogId && (
                            <button
                              onClick={() => {
                                setNewBlog({ id: "", title: "", excerpt: "", content: "", date: "", author: "", image: "" });
                                setEditingBlogId(null);
                              }}
                              className="px-3 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {cmsBlogs.map((blog) => (
                          <div key={blog.id} className={`p-4 rounded-xl border flex flex-col justify-between ${darkMode ? "border-slate-800 bg-slate-900/30" : "border-slate-100 bg-white"}`}>
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] text-slate-500 font-bold">{blog.date}</span>
                                <span className="text-[10px] text-indigo-400 font-bold">By {blog.author}</span>
                              </div>
                              <h5 className="font-black text-xs leading-snug">{blog.title}</h5>
                              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{blog.excerpt}</p>
                            </div>
                            <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100/10">
                              <button
                                onClick={() => {
                                  setNewBlog(blog);
                                  setEditingBlogId(blog.id);
                                }}
                                className="text-[9px] font-black uppercase text-indigo-500 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                onClick={async () => {
                                  setIsMutating(true);
                                  try {
                                    const updated = cmsBlogs.filter((item) => item.id !== blog.id);
                                    await setDoc(doc(db, "cms", "blogs"), { list: updated });
                                    setCmsBlogs(updated);
                                    onRefreshCMS();
                                  } catch (e) {
                                    console.error(e);
                                  } finally {
                                    setIsMutating(false);
                                  }
                                }}
                                className="text-[9px] font-black uppercase text-red-500 hover:underline"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBTAB: SEO Metadata */}
                  {cmsSubTab === "seo" && (
                    <div className="space-y-4 max-w-2xl">
                      <div className={`p-5 rounded-xl border space-y-4 ${darkMode ? "bg-slate-900/40 border-slate-800" : "bg-slate-50 border-slate-200"}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider">Configure Global App SEO Metadata</h4>
                        <div className="space-y-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Document Title</label>
                            <input
                              type="text"
                              value={seoTitle}
                              onChange={(e) => setSeoTitle(e.target.value)}
                              placeholder="Title tags..."
                              className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Meta Description</label>
                            <textarea
                              value={seoDescription}
                              onChange={(e) => setSeoDescription(e.target.value)}
                              placeholder="Description tags..."
                              rows={3}
                              className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-black uppercase text-slate-400 pl-1">Meta Keywords</label>
                            <input
                              type="text"
                              value={seoKeywords}
                              onChange={(e) => setSeoKeywords(e.target.value)}
                              placeholder="Keywords, comma separated..."
                              className={`px-3 py-2 text-xs rounded-lg border ${darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"}`}
                            />
                          </div>
                        </div>

                        <button
                          onClick={async () => {
                            if (!seoTitle || !seoDescription) return;
                            setIsMutating(true);
                            try {
                              const updated: CMSSeo = {
                                title: seoTitle,
                                description: seoDescription,
                                keywords: seoKeywords
                              };
                              await setDoc(doc(db, "cms", "seo"), updated);
                              setCmsSeo(updated);
                              onRefreshCMS();
                            } catch (e) {
                              console.error(e);
                            } finally {
                              setIsMutating(false);
                            }
                          }}
                          className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[10px] uppercase cursor-pointer"
                        >
                          Save SEO Settings
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 6. Verification Console */}
          {activeTab === "verification" && (
            <VerificationQueue darkMode={darkMode} />
          )}

          {/* 7. DevOps Cockpit & Telemetry Console */}
          {activeTab === "devops" && (
            <DevOpsCockpit darkMode={darkMode} />
          )}

        </div>

        {/* Footer */}
        <div className={`border-t pt-4 mt-4 flex justify-between items-center text-[10px] text-slate-500 shrink-0 ${
          darkMode ? "border-slate-800" : "border-slate-100"
        }`}>
          <div>Role: <span className="font-bold text-slate-400 uppercase tracking-wider">Super Administrator</span></div>
          <div>Authorized: {currentUser.email}</div>
        </div>

      </div>
    </div>
  );
}
