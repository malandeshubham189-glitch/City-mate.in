import React, { useState, useEffect } from "react";
import { Listing, Enquiry, Review, UserProfile } from "../types";
import { X, MapPin, Phone, MessageSquare, Star, Send, ShieldAlert, Check, Calendar, User, Heart, Compass, Share2 } from "lucide-react";
import { useScamShield } from "../hooks/useScamShield";
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface ListingDetailModalProps {
  listing: Listing;
  onClose: () => void;
  currentUser: UserProfile | null;
  isFavourite: boolean;
  onToggleFavourite: (listingId: string) => void;
  onContactClick: (listing: Listing, type: "call" | "whatsapp") => void;
  onStartChat?: (ownerId: string, ownerName: string, listingId: string, listingTitle: string) => void;
}

export default function ListingDetailModal({
  listing,
  onClose,
  currentUser,
  isFavourite,
  onToggleFavourite,
  onContactClick,
  onStartChat,
}: ListingDetailModalProps) {
  const scamReport = useScamShield(listing);
  // Gallery index state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Enquiry state
  const [enquiryMsg, setEnquiryMsg] = useState("");
  const [isSendingEnquiry, setIsSendingEnquiry] = useState(false);
  const [enquirySent, setEnquirySent] = useState(false);

  // Booking site visit states
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("11:00 AM");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingCompleted, setBookingCompleted] = useState(false);

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isFetchingReviews, setIsFetchingReviews] = useState(true);

  // Sharing states
  const [shareCopied, setShareCopied] = useState(false);

  // Reporting states
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportReason, setReportReason] = useState("spam");
  const [isReporting, setIsReporting] = useState(false);
  const [reported, setReported] = useState(false);

  // Increment view count in Firestore upon opening
  useEffect(() => {
    async function incrementViews() {
      try {
        const listingRef = doc(db, "listings", listing.id);
        const currentViews = listing.viewsCount || 0;
        await updateDoc(listingRef, {
          viewsCount: currentViews + 1
        });
      } catch (err) {
        console.error("Error incrementing viewsCount:", err);
      }
    }
    incrementViews();
  }, [listing.id]);

  // Load reviews for this listing
  useEffect(() => {
    async function fetchReviews() {
      try {
        const q = query(collection(db, "reviews"), where("listingId", "==", listing.id));
        const snap = await getDocs(q);
        const fetched: Review[] = [];
        snap.forEach((docSnap) => {
          fetched.push({ ...docSnap.data(), id: docSnap.id } as Review);
        });
        // Sort by newest
        fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(fetched);
      } catch (err) {
        console.error("Error fetching reviews:", err);
        handleFirestoreError(err, OperationType.GET, "reviews");
      } finally {
        setIsFetchingReviews(false);
      }
    }
    fetchReviews();
  }, [listing.id]);

  // Handle Share listing copying
  const handleShareListing = () => {
    const shareUrl = `${window.location.origin}/?listing=${listing.id}`;
    navigator.clipboard.writeText(shareUrl);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Handle Report submission
  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsReporting(true);

    try {
      await addDoc(collection(db, "reports"), {
        listingId: listing.id,
        listingTitle: listing.title,
        reporterUid: currentUser.uid,
        reporterEmail: currentUser.email,
        reason: reportReason,
        createdAt: new Date().toISOString(),
      });
      setReported(true);
      setShowReportForm(false);
      alert("Report filed successfully. Thank you for keeping CityMate verified!");
    } catch (err) {
      console.error("Error reporting listing:", err);
      handleFirestoreError(err, OperationType.CREATE, "reports");
    } finally {
      setIsReporting(false);
    }
  };

  // Handle Enquiry submission
  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login first to send an enquiry!");
      return;
    }
    if (!enquiryMsg.trim()) return;

    setIsSendingEnquiry(true);
    try {
      const newEnquiry: Omit<Enquiry, "id"> = {
        listingId: listing.id,
        listingTitle: listing.title,
        ownerId: listing.ownerId,
        userId: currentUser.uid,
        userName: currentUser.name,
        userPhone: currentUser.phone || "Not provided",
        userEmail: currentUser.email,
        message: enquiryMsg,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "enquiries"), newEnquiry);
      setEnquirySent(true);
      setEnquiryMsg("");

      // Increment enquiry count on listing
      try {
        const listingRef = doc(db, "listings", listing.id);
        const currentEnquiries = listing.enquiriesCount || 0;
        await updateDoc(listingRef, {
          enquiriesCount: currentEnquiries + 1
        });
      } catch (err) {
        console.error("Error incrementing enquiriesCount:", err);
      }
    } catch (err) {
      console.error("Error sending enquiry:", err);
      handleFirestoreError(err, OperationType.CREATE, "enquiries");
    } finally {
      setIsSendingEnquiry(false);
    }
  };

  // Handle booking tour submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login first to book a tour visit!");
      return;
    }
    if (!bookingDate) {
      alert("Please select a valid date!");
      return;
    }

    setIsBooking(true);
    try {
      const bookingData = {
        listingId: listing.id,
        listingTitle: listing.title,
        listingCity: listing.city,
        listingLocality: listing.locality,
        listingImage: listing.images[0] || "",
        ownerId: listing.ownerId,
        ownerName: listing.ownerName,
        userId: currentUser.uid,
        userName: currentUser.name,
        userEmail: currentUser.email,
        userPhone: currentUser.phone || "Not provided",
        date: bookingDate,
        time: bookingTime,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      // Add document to "bookings" collection in Firestore
      await addDoc(collection(db, "bookings"), bookingData);

      // Increment clicks count on listing for stats
      try {
        const listingRef = doc(db, "listings", listing.id);
        const currentClicks = listing.clicksCount || 0;
        await updateDoc(listingRef, {
          clicksCount: currentClicks + 1
        });
      } catch (err) {
        console.error("Error incrementing clicksCount:", err);
      }

      // Create a simulated Push alert and Email alert document inside "notifications"
      try {
        await addDoc(collection(db, "notifications"), {
          userId: currentUser.uid,
          recipientEmail: currentUser.email,
          title: "Site Tour Request Received",
          message: `Your booking request for "${listing.title}" on ${bookingDate} at ${bookingTime} is registered. We have notified ${listing.ownerName}!`,
          type: "email_and_push",
          read: false,
          createdAt: new Date().toISOString()
        });

        // Notify Owner too!
        await addDoc(collection(db, "notifications"), {
          userId: listing.ownerId,
          recipientEmail: listing.email,
          title: "New Site Tour Booked!",
          message: `${currentUser.name} has scheduled a site visit for "${listing.title}" on ${bookingDate} at ${bookingTime}. Please login to confirm.`,
          type: "email_and_push",
          read: false,
          createdAt: new Date().toISOString()
        });
      } catch (e) {
        console.warn("Notifications storage failed, but booking was successful:", e);
      }

      setBookingCompleted(true);
      alert(`🎉 Booking Requested! An email & push alert has been dispatched to both you and the property owner (${listing.ownerName}).`);
    } catch (err) {
      console.error("Error booking tour visit:", err);
      handleFirestoreError(err, OperationType.CREATE, "bookings");
    } finally {
      setIsBooking(false);
    }
  };

  // Handle Review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      alert("Please login first to write a review!");
      return;
    }
    if (!newComment.trim()) return;

    setIsSubmittingReview(true);
    try {
      const reviewId = "rev_" + Math.random().toString(36).substr(2, 9);
      const newReview: Review = {
        id: reviewId,
        listingId: listing.id,
        userId: currentUser.uid,
        userName: currentUser.name,
        rating: newRating,
        comment: newComment,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, "reviews"), newReview);

      // Optimistically update review list
      setReviews((prev) => [newReview, ...prev]);

      // Refresh listing average
      const updatedReviewsCount = listing.reviewsCount + 1;
      const updatedRating = ((listing.rating * listing.reviewsCount) + newRating) / updatedReviewsCount;

      try {
        const listingQuery = query(collection(db, "listings"), where("id", "==", listing.id));
        const querySnapshot = await getDocs(listingQuery);
        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, {
            rating: updatedRating,
            reviewsCount: updatedReviewsCount,
          });
        }
        listing.rating = updatedRating;
        listing.reviewsCount = updatedReviewsCount;
      } catch (e) {
        console.warn("Failed to update listing rating in DB:", e);
      }

      setNewComment("");
      setNewRating(5);
      alert("Review posted successfully!");
    } catch (err) {
      console.error("Error submitting review:", err);
      handleFirestoreError(err, OperationType.CREATE, "reviews");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 flex flex-col md:flex-row overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Left Hand: Photos & Description */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 border-b md:border-b-0 md:border-r border-slate-100 max-h-[45vh] md:max-h-none">
          {/* Close button for mobile */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 md:hidden flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 z-10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Primary image & gallery */}
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-slate-100 mb-3">
            <img
              src={listing.images[activeImageIndex] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"}
              alt={listing.title}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover transition-all duration-300"
            />
            
            {/* Share and Favourite Overlay Row */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={handleShareListing}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-slate-700 hover:bg-white shadow-md backdrop-blur-md transition-all active:scale-90 cursor-pointer"
                title="Share Listing"
                id="share-listing-btn"
              >
                {shareCopied ? (
                  <Check className="h-5 w-5 text-emerald-600" />
                ) : (
                  <Share2 className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => onToggleFavourite(listing.id)}
                className={`flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-90 shadow-md cursor-pointer ${
                  isFavourite
                    ? "bg-red-500 text-white"
                    : "bg-white/90 text-slate-700 hover:bg-white"
                }`}
                title="Bookmark Listing"
                id="fav-listing-detail-btn"
              >
                <Heart className={`h-5 w-5 ${isFavourite ? "fill-current" : ""}`} />
              </button>
            </div>
          </div>

          {/* Image Gallery Mini Previews (Phase 5 gallery) */}
          {listing.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto py-1 mb-6 scrollbar-thin">
              {listing.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative h-12 w-16 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx ? "border-indigo-600 scale-105" : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          )}

          {/* Category, Title & Location */}
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
              {listing.category}
            </span>
            <span className="text-xs font-bold text-slate-400">• Posted by {listing.ownerName}</span>
          </div>

          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mb-2 leading-tight">
            {listing.title}
          </h2>

          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-6">
            <MapPin className="h-4 w-4 text-indigo-600" />
            <span>{listing.locality}, {listing.city}</span>
          </div>

          {/* About description */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2">
              About This Listing
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap font-medium">
              {listing.description}
            </p>
          </div>

          {/* Features/Amenities */}
          <div className="mb-8">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              Key Features & Amenities
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {listing.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 rounded-lg border border-slate-50 bg-slate-50/50 p-2.5 text-xs text-slate-700 font-semibold"
                >
                  <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Google Maps (Phase 5 real dynamic map layout) */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Compass className="h-4 w-4 text-indigo-600" /> Interactive Location Map
            </h4>
            <div className="relative rounded-xl border border-slate-200 bg-blue-50/50 overflow-hidden h-52">
              <iframe
                title={`Google Map representation of ${listing.locality}`}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://maps.google.com/maps?q=${encodeURIComponent(
                  listing.locality + ", " + listing.city + ", India"
                )}&t=&z=14&ie=UTF8&iwloc=&output=embed`}
                referrerPolicy="no-referrer"
              ></iframe>
            </div>
          </div>

          {/* Report Listing Section */}
          <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Verification Badge: CM-{listing.id.toUpperCase()}
            </span>
            
            {reported ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-amber-600">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Listing reported for audit</span>
              </span>
            ) : showReportForm ? (
              <form onSubmit={handleReportSubmit} className="w-full max-w-sm space-y-2 mt-2">
                <p className="text-xs font-bold text-slate-800">Why are you reporting this listing?</p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 focus:outline-none font-semibold"
                >
                  <option value="spam font-semibold">Spam or Misleading details</option>
                  <option value="fake font-semibold">Fake owner or profile</option>
                  <option value="closed font-semibold">Closed down or already occupied</option>
                  <option value="inappropriate font-semibold">Inappropriate content or features</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isReporting}
                    className="rounded bg-indigo-600 text-white px-3 py-1 text-[10px] font-bold cursor-pointer"
                  >
                    {isReporting ? "Reporting..." : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportForm(false)}
                    className="rounded bg-slate-200 text-slate-700 px-3 py-1 text-[10px] font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => {
                  if (!currentUser) {
                    alert("Please login first to report a listing!");
                    return;
                  }
                  setShowReportForm(true);
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                id="report-listing-btn"
              >
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Report inaccurate listing</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Hand: Action desk, reviews, contact and lead submission */}
        <div className="w-full md:w-[360px] flex flex-col bg-slate-50 overflow-y-auto p-6 md:p-8 max-h-[45vh] md:max-h-none">
          {/* Header Close on Desktop */}
          <div className="hidden md:flex justify-end mb-4">
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 shadow-sm cursor-pointer"
              id="detail-modal-close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Price Panel */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm mb-6">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {listing.category === "jobs" ? "Compensation" : "Rent / Budget"}
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-extrabold text-slate-900">
                ₹{listing.price.toLocaleString("en-IN")}
              </span>
              <span className="text-xs font-bold text-slate-400 font-semibold">
                /{listing.pricePeriod}
              </span>
            </div>

            {/* Quick Contact buttons */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <button
                onClick={() => onContactClick(listing, "whatsapp")}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-emerald-100 bg-emerald-50 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                id="modal-whatsapp-btn"
              >
                <MessageSquare className="h-4 w-4 fill-emerald-50 text-emerald-700" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={() => onContactClick(listing, "call")}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white hover:bg-slate-800 transition-colors cursor-pointer"
                id="modal-call-btn"
              >
                <Phone className="h-3.5 w-3.5 fill-current" />
                <span>Direct Call</span>
              </button>
            </div>

            <button
              onClick={() => {
                if (!currentUser) {
                  alert("Please login first to chat with the owner.");
                  return;
                }
                if (currentUser.uid === listing.ownerId) {
                  alert("This is your own listing!");
                  return;
                }
                if (onStartChat) {
                  onStartChat(listing.ownerId, listing.ownerName, listing.id, listing.title);
                }
              }}
              className="w-full flex items-center justify-center gap-1.5 rounded-xl mt-2 border border-indigo-200 bg-indigo-50 py-2.5 text-xs font-extrabold text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all duration-300 cursor-pointer shadow-sm shadow-indigo-100/50"
              id="modal-inapp-chat-btn"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Message in App</span>
            </button>

            {/* Site Tour Booking Interface */}
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
              {bookingCompleted ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 text-center animate-in fade-in">
                  <p className="text-xs font-extrabold text-emerald-800">Site Tour Scheduled!</p>
                  <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Confirmed for {bookingDate} at {bookingTime}.</p>
                </div>
              ) : showBookingForm ? (
                <form onSubmit={handleBookingSubmit} className="space-y-3 animate-in slide-in-from-top-2 duration-200">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Select Visit Date</label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold block"
                      required
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Select Time Slot</label>
                    <select
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-bold block"
                    >
                      <option value="10:00 AM" className="font-bold">10:00 AM (Morning Slot)</option>
                      <option value="11:30 AM" className="font-bold">11:30 AM (Morning Slot)</option>
                      <option value="1:00 PM" className="font-bold">1:00 PM (Afternoon Slot)</option>
                      <option value="2:30 PM" className="font-bold">2:30 PM (Afternoon Slot)</option>
                      <option value="4:00 PM" className="font-bold">4:00 PM (Evening Slot)</option>
                      <option value="5:30 PM" className="font-bold">5:30 PM (Evening Slot)</option>
                    </select>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={isBooking}
                      className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-black text-white hover:bg-indigo-700 transition-colors cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isBooking ? "Scheduling..." : "Confirm Booking"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowBookingForm(false)}
                      className="rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-extrabold text-slate-600 cursor-pointer"
                    >
                      Back
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    if (!currentUser) {
                      alert("Please login first to request a physical site viewing!");
                      return;
                    }
                    setShowBookingForm(true);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 py-3 text-xs font-black text-white hover:scale-[1.02] active:scale-95 transition-all shadow-md shadow-indigo-100 cursor-pointer"
                  id="request-site-tour-trigger"
                >
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>Schedule physical Site Tour</span>
                </button>
              )}
            </div>
          </div>

          {/* Scam Shield Alerts System Card */}
          <div className={`rounded-2xl border p-4 mb-6 transition-all shadow-sm ${
            scamReport.safetyRating === "critical"
              ? "bg-rose-50 border-rose-100 text-rose-950"
              : scamReport.safetyRating === "warning"
              ? "bg-amber-50 border-amber-100 text-amber-950"
              : "bg-emerald-50/80 border-emerald-100 text-emerald-950"
          }`}>
            <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldAlert className={`h-4 w-4 shrink-0 ${
                scamReport.safetyRating === "critical"
                  ? "text-rose-600"
                  : scamReport.safetyRating === "warning"
                  ? "text-amber-600"
                  : "text-emerald-600"
              }`} />
              Scam Shield Telemetry
            </h4>
            
            <div className="space-y-1.5 text-[11px] font-semibold leading-relaxed">
              <div className="flex justify-between items-center text-xs font-bold">
                <span>Trust Index:</span>
                <span className={
                  scamReport.safetyRating === "critical"
                    ? "text-rose-600"
                    : scamReport.safetyRating === "warning"
                    ? "text-amber-600"
                    : "text-emerald-600"
                }>
                  {scamReport.trustIndex}/100 ({scamReport.safetyRating.toUpperCase()})
                </span>
              </div>
              <p className="text-[10px] opacity-85">
                {scamReport.pricingAssessment}
              </p>
              
              {scamReport.reasons.length > 0 && (
                <div className="pt-2 border-t border-slate-200/50 space-y-1 text-[9px] font-medium">
                  {scamReport.reasons.map((reason, idx) => (
                    <div key={idx} className="flex items-start gap-1">
                      <span className="shrink-0">•</span>
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Enquiry desk */}
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm mb-6">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-3">
              Send Local Enquiry
            </h4>

            {enquirySent ? (
              <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-center animate-in fade-in">
                <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-green-100 text-green-700 mb-2">
                  <Check className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-green-800">Enquiry Sent!</p>
                <p className="text-[10px] text-green-600 mt-1">The owner has been notified and will contact you back.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitEnquiry} className="space-y-3">
                {currentUser ? (
                  <>
                    <textarea
                      rows={3}
                      value={enquiryMsg}
                      onChange={(e) => setEnquiryMsg(e.target.value)}
                      placeholder={`I'm interested in this. Please share more details about security deposit, vacancy...`}
                      className="w-full rounded-xl border border-slate-100 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                      required
                      id="modal-enquiry-msg"
                    />
                    <button
                      type="submit"
                      disabled={isSendingEnquiry || !enquiryMsg.trim()}
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                      id="modal-enquiry-submit"
                    >
                      {isSendingEnquiry ? (
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="h-3.5 w-3.5" />
                          <span>Submit Enquiry</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                    <ShieldAlert className="mx-auto h-5 w-5 text-amber-600 mb-1" />
                    <p className="text-[10px] font-bold text-amber-800">Login Required</p>
                    <p className="text-[9px] text-amber-600 mt-0.5">Please login to send inquiries or reviews.</p>
                  </div>
                )}
              </form>
            )}
          </div>

          {/* Reviews List & Write Review Panel */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span>Reviews & Ratings</span>
              <span className="flex items-center gap-0.5 text-indigo-600">
                <Star className="h-3 w-3 fill-current text-indigo-500" />
                {listing.rating.toFixed(1)} ({listing.reviewsCount})
              </span>
            </h4>

            {/* Write review */}
            {currentUser && (
              <form onSubmit={handleSubmitReview} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Write a Review
                </p>

                {/* Stars selector */}
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setNewRating(star)}
                      className="text-amber-400 hover:scale-110 active:scale-90 transition-transform focus:outline-none cursor-pointer"
                    >
                      <Star className={`h-4.5 w-4.5 ${newRating >= star ? "fill-current" : ""}`} />
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Review comment... (e.g., highly recommended!)"
                  className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                  required
                  id="modal-review-comment"
                />

                <button
                  type="submit"
                  disabled={isSubmittingReview || !newComment.trim()}
                  className="w-full rounded-lg bg-slate-900 py-1.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  id="modal-review-submit"
                >
                  Post Review
                </button>
              </form>
            )}

            {/* Render Reviews */}
            <div className="space-y-3">
              {isFetchingReviews ? (
                <p className="text-[10px] text-center text-slate-400 py-4">Fetching reviews...</p>
              ) : reviews.length === 0 ? (
                <p className="text-[10px] text-center text-slate-400 py-4 bg-white rounded-xl border border-slate-100">
                  No reviews yet. Be the first to rate!
                </p>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-slate-100 bg-white p-3 shadow-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-slate-700">{rev.userName}</span>
                      <div className="flex items-center gap-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        <Star className="h-2 w-2 fill-current text-indigo-500" />
                        <span>{rev.rating}</span>
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal font-medium">{rev.comment}</p>
                    <span className="text-[8px] text-slate-400 block text-right mt-1.5">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
