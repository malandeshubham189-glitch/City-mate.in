import React, { useState, useEffect } from "react";
import { 
  Shield, Check, X, FileText, Sliders, MessageSquare, 
  Clock, User, Building, Award, Sparkles, ShieldCheck, 
  ShieldAlert, Database, Loader2, Info
} from "lucide-react";
import { VerificationRequest } from "../../types";
import { 
  listenVerificationRequests, 
  updateVerificationStatus, 
  updateVerificationTrustMatrix 
} from "../../services/verificationService";
import { motion, AnimatePresence } from "motion/react";
import { db } from "../../lib/firebase";
import { collection, addDoc, updateDoc } from "firebase/firestore";

interface VerificationQueueProps {
  darkMode: boolean;
}

export default function VerificationQueue({ darkMode }: VerificationQueueProps) {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState<"all" | "user" | "owner" | "listing">("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "pending" | "verified" | "rejected">("all");

  // Real-time listener for incoming verification requests
  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenVerificationRequests(
      (data) => {
        setRequests(data);
        setLoading(false);
        // Sync selected request if it exists in the updated list
        if (selectedRequest) {
          const updated = data.find((r) => r.id === selectedRequest.id);
          if (updated) setSelectedRequest(updated);
        }
      },
      (err) => {
        console.error("Failed to stream verification requests:", err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, [selectedRequest]);

  // Seed sample requests for instant presentation
  const handleSeedMockRequests = async () => {
    setActionLoading(true);
    try {
      const mockData: Omit<VerificationRequest, "id" | "createdAt">[] = [
        {
          userId: "demo_owner_rohan",
          userName: "Rohan Deshmukh",
          userEmail: "rohan.d@symbiosis.edu.in",
          userPhone: "+91 98765 43210",
          type: "owner",
          documentType: "Aadhaar Card",
          documentNumber: "4321-8765-0987",
          documentUrl: "https://images.unsplash.com/photo-1554774853-aae0a22c8aa4?auto=format&fit=crop&w=600&q=80",
          status: "pending",
          trustScore: 45,
          scoreBreakdown: {
            backgroundCheck: false,
            profileComplete: true,
            documentMatch: false,
          },
        },
        {
          userId: "demo_owner_priya",
          userName: "Priya Sharma",
          userEmail: "priya.sharma@amazon.com",
          userPhone: "+91 99887 76655",
          type: "owner",
          documentType: "PAN Card",
          documentNumber: "ABCDE1234F",
          documentUrl: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=600&q=80",
          status: "pending",
          trustScore: 70,
          scoreBreakdown: {
            backgroundCheck: true,
            profileComplete: true,
            documentMatch: false,
          },
        },
        {
          userId: "demo_owner_rohan",
          userName: "Rohan Deshmukh",
          userEmail: "rohan.d@symbiosis.edu.in",
          type: "listing",
          targetId: "listing_viman_pg",
          targetTitle: "Symbiosis Premium Student Hostels",
          documentType: "Property Ownership Agreement",
          documentNumber: "PROP-PUNE-8872",
          documentUrl: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80",
          status: "pending",
          trustScore: 20,
          scoreBreakdown: {
            backgroundCheck: false,
            profileComplete: false,
            documentMatch: false,
          },
        }
      ];

      const colRef = collection(db, "verification_requests");
      for (const req of mockData) {
        const docRef = await addDoc(colRef, {
          ...req,
          createdAt: new Date().toISOString()
        });
        await updateDoc(docRef, { id: docRef.id });
      }
    } catch (err) {
      console.error("Error seeding mock requests:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Matrix items in real-time
  const handleToggleMatrix = async (key: keyof VerificationRequest["scoreBreakdown"]) => {
    if (!selectedRequest || actionLoading) return;
    const currentBreakdown = { ...selectedRequest.scoreBreakdown };
    currentBreakdown[key] = !currentBreakdown[key];

    try {
      await updateVerificationTrustMatrix(selectedRequest.id, currentBreakdown);
    } catch (err) {
      console.error("Failed to update trust matrix:", err);
    }
  };

  // Approve Listing or User Badge
  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await updateVerificationStatus(id, "verified");
      
      // Dispatch live system notification
      if (selectedRequest && selectedRequest.id === id) {
        await addDoc(collection(db, "notifications"), {
          userId: selectedRequest.userId,
          title: "KYC Status Verified ✓",
          message: `Congratulations! Your verification request for "${selectedRequest.targetTitle || selectedRequest.userName}" has been audited and approved by the trust safety committee.`,
          type: "success",
          read: false,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error("Failed to approve:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Reject with Feedback Dialog
  const handleRejectSubmit = async () => {
    if (!selectedRequest || actionLoading) return;
    setActionLoading(true);
    try {
      await updateVerificationStatus(selectedRequest.id, "rejected", feedbackText);
      
      // Dispatch live system notification
      await addDoc(collection(db, "notifications"), {
        userId: selectedRequest.userId,
        title: "KYC Action Required ⚠",
        message: `Your verification request has been returned with auditor feedback: "${feedbackText}". Please revise and resubmit.`,
        type: "alert",
        read: false,
        createdAt: new Date().toISOString()
      });
      
      setFeedbackText("");
      setShowRejectModal(false);
    } catch (err) {
      console.error("Failed to reject:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtering Logic
  const filteredRequests = requests.filter((req) => {
    const matchesType = filterType === "all" || req.type === filterType;
    const matchesStatus = filterStatus === "all" || req.status === filterStatus;
    return matchesType && matchesStatus;
  });

  // Color helper based on trust score
  const getTrustScoreColor = (score: number) => {
    if (score >= 75) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (score >= 45) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  return (
    <div id="verification-console" className="space-y-6">
      {/* Console Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-indigo-400 animate-pulse" />
            <h2 className="text-xl font-bold text-white tracking-tight font-sans">
              KYC & Trust-Matrix Verification Console
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time administrative verification engine and compliance scoring matrix.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedMockRequests}
            disabled={actionLoading}
            className="flex items-center gap-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-4 py-2.5 rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-600/10 disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Database className="h-3.5 w-3.5" />
            )}
            Seed KYC Requests
          </button>
        </div>
      </div>

      {/* Main Panel Structure */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Real-Time Stream Queues */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
              <span>Incoming Compliance Stream</span>
              <span className="text-[10px] uppercase tracking-wider font-mono bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full">
                {filteredRequests.length} Requests
              </span>
            </h3>

            {/* Queue Filters */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Filter Entity</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">All Types</option>
                  <option value="user">User</option>
                  <option value="owner">Owner</option>
                  <option value="listing">Listing</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-mono block mb-1">Filter Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="all">All States</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* List Stream */}
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                  <Loader2 className="h-8 w-8 animate-spin text-indigo-400 mb-2" />
                  <span className="text-xs font-mono">Connecting Live Pipeline...</span>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                  <Info className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs font-sans">No pending requests matched your filter.</p>
                  <p className="text-[10px] text-slate-600 mt-1">Click &quot;Seed KYC Requests&quot; to test.</p>
                </div>
              ) : (
                filteredRequests.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`group relative p-3 rounded-lg border text-left cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? "bg-slate-800 border-indigo-500" 
                          : "bg-slate-950 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {/* Left color glow based on score */}
                      <div className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-lg ${
                        req.trustScore >= 75 ? "bg-emerald-500" : req.trustScore >= 45 ? "bg-amber-500" : "bg-rose-500"
                      }`} />

                      <div className="pl-2 flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded uppercase font-semibold ${
                              req.type === "owner" ? "bg-amber-500/10 text-amber-400" : req.type === "listing" ? "bg-teal-500/10 text-teal-400" : "bg-sky-500/10 text-sky-400"
                            }`}>
                              {req.type}
                            </span>
                            <span className="text-xs font-bold text-slate-200">
                              {req.userName}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-400 truncate mt-1">
                            {req.type === "listing" ? req.targetTitle : req.userEmail}
                          </p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-slate-500 font-mono">
                              Doc: {req.documentType}
                            </span>
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end gap-1.5 shrink-0">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${getTrustScoreColor(req.trustScore)}`}>
                            {req.trustScore}% Trust
                          </span>

                          <span className={`text-[9px] uppercase font-bold tracking-wider font-mono ${
                            req.status === "verified" ? "text-emerald-400" : req.status === "rejected" ? "text-rose-400" : "text-amber-400"
                          }`}>
                            {req.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Compliance Matrix and Details Console */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedRequest ? (
              <motion.div
                key={selectedRequest.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded">
                      Compliance Inspection File
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {selectedRequest.userName}
                    </h3>
                    <p className="text-xs text-slate-400">{selectedRequest.userEmail}</p>
                  </div>

                  <span className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${
                    selectedRequest.status === "verified" 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                      : selectedRequest.status === "rejected"
                      ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                  }`}>
                    {selectedRequest.status}
                  </span>
                </div>

                {/* Inspect Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left subcolumn: Details & Document Preview */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" />
                      Submitted Document
                    </h4>

                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 space-y-3">
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Document Type</span>
                        <span className="text-xs font-medium text-slate-200">{selectedRequest.documentType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block">Document ID Number</span>
                        <span className="text-xs font-mono font-medium text-indigo-400">{selectedRequest.documentNumber}</span>
                      </div>
                      {selectedRequest.type === "listing" && selectedRequest.targetTitle && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-mono block">Target Service Listing</span>
                          <span className="text-xs font-sans font-semibold text-teal-400 flex items-center gap-1">
                            <Building className="h-3 w-3 inline" /> {selectedRequest.targetTitle}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Image Preview Container */}
                    {selectedRequest.documentUrl ? (
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono block mb-1">Secure Attachment Verification</span>
                        <div className="border border-slate-800 rounded-lg overflow-hidden relative group bg-slate-950 h-36">
                          <img
                            src={selectedRequest.documentUrl}
                            alt="KYC Attachment"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <a
                            href={selectedRequest.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[11px] text-white font-mono font-medium transition-opacity cursor-pointer"
                          >
                            Open High-Res Document
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg bg-slate-950">
                        <span className="text-xs font-mono">No document scan provided.</span>
                      </div>
                    )}
                  </div>

                  {/* Right subcolumn: Real-Time Trust Matrix Engine */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Sliders className="h-3.5 w-3.5" />
                      Dynamic Trust-Matrix Engine
                    </h4>

                    {/* Trust Score Gauge */}
                    <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 flex flex-col items-center justify-center space-y-2 text-center">
                      <div className="relative flex items-center justify-center">
                        {/* Interactive Circle Path SVG */}
                        <svg className="w-24 h-24 transform -rotate-95">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            strokeWidth="6"
                            stroke="#1e293b"
                            fill="transparent"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            strokeWidth="6"
                            stroke={selectedRequest.trustScore >= 75 ? "#10b981" : selectedRequest.trustScore >= 45 ? "#f59e0b" : "#ef4444"}
                            fill="transparent"
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - selectedRequest.trustScore / 100)}
                            className="transition-all duration-500 ease-out"
                          />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                          <span className="text-2xl font-black font-sans text-white leading-none">
                            {selectedRequest.trustScore}
                          </span>
                          <span className="text-[9px] uppercase tracking-wider font-mono text-slate-400 mt-0.5">
                            Matrix Score
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-400 font-sans max-w-[200px]">
                        {selectedRequest.trustScore >= 75 
                          ? "Approved Trust Standard. Excellent score, highly credible background."
                          : selectedRequest.trustScore >= 45
                          ? "Requires caution. Mid-level compliance matrix score."
                          : "High Risk File. Requires strict background checks."}
                      </p>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2.5">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block">
                        Compliance Factors (Toggle to adjust score live)
                      </span>

                      {/* Toggle 1: Background Check */}
                      <button
                        onClick={() => handleToggleMatrix("backgroundCheck")}
                        disabled={actionLoading}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">Official Background Check</span>
                          <span className="text-[9px] text-slate-500 font-mono">Criminal, business, and rental reports (+30)</span>
                        </div>
                        <div className={`w-8 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                          selectedRequest.scoreBreakdown.backgroundCheck ? "bg-indigo-600" : "bg-slate-800"
                        }`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            selectedRequest.scoreBreakdown.backgroundCheck ? "translate-x-3" : "translate-x-0"
                          }`} />
                        </div>
                      </button>

                      {/* Toggle 2: Profile completeness */}
                      <button
                        onClick={() => handleToggleMatrix("profileComplete")}
                        disabled={actionLoading}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">Profile Completeness Audit</span>
                          <span className="text-[9px] text-slate-500 font-mono">Phone verified, complete details (+25)</span>
                        </div>
                        <div className={`w-8 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                          selectedRequest.scoreBreakdown.profileComplete ? "bg-indigo-600" : "bg-slate-800"
                        }`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            selectedRequest.scoreBreakdown.profileComplete ? "translate-x-3" : "translate-x-0"
                          }`} />
                        </div>
                      </button>

                      {/* Toggle 3: Document Match */}
                      <button
                        onClick={() => handleToggleMatrix("documentMatch")}
                        disabled={actionLoading}
                        className="w-full bg-slate-950 border border-slate-800 hover:border-slate-700 p-2.5 rounded-lg flex items-center justify-between text-left transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-200">Govt ID Details Match</span>
                          <span className="text-[9px] text-slate-500 font-mono">Matched name, image, and document fields (+25)</span>
                        </div>
                        <div className={`w-8 h-5 flex items-center rounded-full p-0.5 transition-colors duration-200 ${
                          selectedRequest.scoreBreakdown.documentMatch ? "bg-indigo-600" : "bg-slate-800"
                        }`}>
                          <div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-200 ${
                            selectedRequest.scoreBreakdown.documentMatch ? "translate-x-3" : "translate-x-0"
                          }`} />
                        </div>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Feedback status */}
                {selectedRequest.feedback && (
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3 text-left">
                    <span className="text-[10px] font-mono text-rose-400 block uppercase tracking-wider mb-1">
                      Historical Rejection Reason:
                    </span>
                    <p className="text-xs text-rose-300 font-medium font-sans">
                      {selectedRequest.feedback}
                    </p>
                  </div>
                )}

                {/* Console Actions */}
                <div className="flex items-center gap-3 border-t border-slate-800 pt-5">
                  <button
                    onClick={() => handleApprove(selectedRequest.id)}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors cursor-pointer text-xs disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="h-4 w-4" />
                    )}
                    Approve Badge
                  </button>

                  <button
                    onClick={() => {
                      setFeedbackText("");
                      setShowRejectModal(true);
                    }}
                    disabled={actionLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-600/15 hover:bg-rose-600/25 text-rose-400 border border-rose-500/30 font-semibold py-2.5 px-4 rounded-lg transition-all cursor-pointer text-xs disabled:opacity-50 animate-pulse-subtle"
                  >
                    <ShieldAlert className="h-4 w-4" />
                    Reject with Feedback
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="h-[450px] border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 text-center p-6 bg-slate-900/50">
                <Sparkles className="h-10 w-10 text-indigo-500/40 mb-3 animate-pulse" />
                <h3 className="text-sm font-semibold text-slate-300">Compliance Inspector Offline</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select an incoming compliance request from the real-time stream queue to audit user credentials, update trust values, and grant system badges.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Reject with Feedback Modal dialog overlay */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-xl p-6 shadow-2xl relative space-y-4 text-left"
          >
            <button
              onClick={() => setShowRejectModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Reject and Provide Feedback
            </h4>

            <p className="text-xs text-slate-400 leading-relaxed">
              State the exact non-compliance reasons (e.g. illegible photo, mismatching identification numbers). This will be displayed securely to the applicant.
            </p>

            <textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="e.g. Aadhaar Card scan is blur. Please re-upload a clear colored image with visible text fields."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg p-3 focus:outline-none focus:ring-1 focus:ring-rose-500 font-sans"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="text-xs bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-2 rounded-lg cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={!feedbackText.trim() || actionLoading}
                className="text-xs bg-rose-600 hover:bg-rose-500 text-white font-medium px-4 py-2 rounded-lg cursor-pointer transition-all disabled:opacity-50"
              >
                {actionLoading ? "Submitting..." : "Reject File"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
