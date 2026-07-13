import React, { useState, useEffect } from "react";
import { Enquiry, UserProfile } from "../types";
import { X, Mail, Phone, Calendar, User, MessageSquare, Trash2, Tag } from "lucide-react";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface EnquiryListModalProps {
  currentUser: UserProfile;
  onClose: () => void;
}

export default function EnquiryListModal({ currentUser, onClose }: EnquiryListModalProps) {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEnquiries() {
      try {
        let q;
        // Owners see enquiries received for their listings, Users see enquiries they sent
        if (currentUser.role === "owner") {
          q = query(collection(db, "enquiries"), where("ownerId", "==", currentUser.uid));
        } else {
          q = query(collection(db, "enquiries"), where("userId", "==", currentUser.uid));
        }

        const snap = await getDocs(q);
        const fetched: Enquiry[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          if (data) {
            fetched.push({ ...(data as any), id: docSnap.id } as Enquiry);
          }
        });

        // Sort by newest
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setEnquiries(fetched);
      } catch (err) {
        console.error("Error fetching enquiries:", err);
        handleFirestoreError(err, OperationType.GET, "enquiries");
      } finally {
        setIsLoading(false);
      }
    }
    fetchEnquiries();
  }, [currentUser.uid, currentUser.role]);

  const handleDeleteEnquiry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this enquiry thread?")) return;

    try {
      await deleteDoc(doc(db, "enquiries", id));
      setEnquiries((prev) => prev.filter((e) => e.id !== id));
      alert("Enquiry deleted successfully!");
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `enquiries/${id}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-950">
              {currentUser.role === "owner" ? "Received Enquiries" : "Sent Enquiries / Inquiries"}
            </h3>
            <p className="text-xs text-slate-500">
              {currentUser.role === "owner"
                ? "Track active leads and queries on your posted spaces"
                : "List of relocation queries you've sent to providers"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 shadow-sm"
            id="enquiry-modal-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <p className="text-xs text-center text-slate-400 py-12">Loading enquiries...</p>
          ) : enquiries.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-700">No Enquiries Found</p>
              <p className="text-[10px] text-slate-400 mt-1">
                {currentUser.role === "owner"
                  ? "When seekers inquire on your room or tiffin plan, they will appear here!"
                  : "Explore our listings and send an enquiry to get in touch!"}
              </p>
            </div>
          ) : (
            enquiries.map((enq) => (
              <div
                key={enq.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 relative hover:shadow-xs transition-shadow flex flex-col md:flex-row gap-4"
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDeleteEnquiry(enq.id)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-red-500 rounded p-1 hover:bg-red-50 transition-colors"
                  title="Delete enquiry"
                  id={`del-enq-${enq.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="flex items-center gap-1 rounded bg-orange-50 border border-orange-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-orange-700">
                      <Tag className="h-2.5 w-2.5" /> {enq.listingTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(enq.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Message */}
                  <div className="bg-white border border-slate-100/50 rounded-lg p-3 text-xs text-slate-700 italic leading-relaxed shadow-xs">
                    "{enq.message}"
                  </div>

                  {/* Sender Details */}
                  <div className="flex flex-wrap items-center gap-4 text-[10px] font-semibold text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3 text-slate-400" />
                      {currentUser.role === "owner" ? `From: ${enq.userName}` : `You sent this`}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {enq.userPhone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3 text-slate-400" />
                      {enq.userEmail}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
