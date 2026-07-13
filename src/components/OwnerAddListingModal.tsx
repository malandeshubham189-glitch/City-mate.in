import React, { useState } from "react";
import { Listing, ListingCategory, UserProfile } from "../types";
import { X, Sparkles, Plus, Check, Loader2, Info } from "lucide-react";
import { collection, addDoc, doc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, handleFirestoreError, OperationType, storage } from "../lib/firebase";
import { INDIAN_CITIES, CATEGORY_LABELS } from "../data/seedData";

interface OwnerAddListingModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onSuccess: (newListing: Listing) => void;
  editingListing?: Listing;
}

export default function OwnerAddListingModal({
  currentUser,
  onClose,
  onSuccess,
  editingListing,
}: OwnerAddListingModalProps) {
  // Fields
  const [title, setTitle] = useState(editingListing?.title || "");
  const [category, setCategory] = useState<ListingCategory>(editingListing?.category || "rooms");
  const [city, setCity] = useState(editingListing?.city || "Bengaluru");
  const [locality, setLocality] = useState(editingListing?.locality || "");
  const [price, setPrice] = useState(editingListing?.price ? String(editingListing.price) : "");
  const [pricePeriod, setPricePeriod] = useState(editingListing?.pricePeriod || "month");
  const [description, setDescription] = useState(editingListing?.description || "");
  const [contactNumber, setContactNumber] = useState(editingListing?.contactNumber || currentUser.phone || "");
  const [email, setEmail] = useState(editingListing?.email || currentUser.email || "");
  const [address, setAddress] = useState(editingListing?.address || "");
  const [isFeatured, setIsFeatured] = useState(editingListing?.isFeatured || false);
  const [isVerified, setIsVerified] = useState(editingListing?.isVerified || false);

  // Features list tag builders
  const [featureInput, setFeatureInput] = useState("");
  const [features, setFeatures] = useState<string[]>(editingListing?.features || []);

  // Multi-image upload states
  const [images, setImages] = useState<string[]>(editingListing?.images || []);
  const [isUploadingImages, setIsUploadingImages] = useState(false);

  // AI Generation helpers
  const [isEnhancing, setIsEnhancing] = useState(false);

  // Submit states
  const [isLoading, setIsLoading] = useState(false);

  // Add Feature tag
  const handleAddFeature = () => {
    const val = featureInput.trim();
    if (val && !features.includes(val)) {
      setFeatures((prev) => [...prev, val]);
      setFeatureInput("");
    }
  };

  // Remove Feature tag
  const handleRemoveFeature = (feat: string) => {
    setFeatures((prev) => prev.filter((f) => f !== feat));
  };

  // Handle image upload with elegant firebase storage and base64 fallback
  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        // Upload to Firebase Storage
        const fileRef = ref(storage, `listings/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const url = await getDownloadURL(snapshot.ref);
        uploadedUrls.push(url);
      } catch (err) {
        console.error("Storage upload failed, falling back to base64 reader:", err);
        // Fallback: Read as base64
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        uploadedUrls.push(base64);
      }
    }

    setImages((prev) => [...prev, ...uploadedUrls]);
    setIsUploadingImages(false);
  };

  // Call server-side Gemini API to enhance listing
  const handleAIEnhance = async () => {
    if (!title.trim()) {
      alert("Please enter a basic Title first before enhancing with AI!");
      return;
    }
    setIsEnhancing(true);
    try {
      const response = await fetch("/api/listings/enhance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          category,
          locality: locality || "Premium Neighborhood",
          city,
          price: price || "Reasonable",
          features,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with AI");
      }

      const data = await response.json();
      if (data.description) {
        setDescription(data.description);
      }
      if (data.tags && Array.isArray(data.tags)) {
        // Merge suggested tags uniquely
        const merged = Array.from(new Set([...features, ...data.tags]));
        setFeatures(merged);
      }
    } catch (err) {
      console.error(err);
      alert("AI Service is temporarily busy. Description enhanced manually.");
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !locality || !price) {
      alert("Please fill out all required fields!");
      return;
    }

    setIsLoading(true);
    try {
      const parsedPrice = parseFloat(price);
      if (isNaN(parsedPrice)) {
        alert("Please enter a valid numeric price!");
        setIsLoading(false);
        return;
      }

      // Default mock category images if no custom images uploaded
      let finalImages = [...images];
      if (finalImages.length === 0) {
        if (category === "pg") {
          finalImages = ["https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"];
        } else if (category === "tiffin" || category === "mess") {
          finalImages = ["https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80"];
        } else if (category === "flats" || category === "rooms") {
          finalImages = ["https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80"];
        } else if (category === "jobs") {
          finalImages = ["https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80"];
        } else {
          finalImages = ["https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80"];
        }
      }

      if (editingListing) {
        // Update in Firestore
        const { getDocs, query, where } = await import("firebase/firestore");
        const q = query(collection(db, "listings"), where("id", "==", editingListing.id));
        const querySnapshot = await getDocs(q);

        const statusVal: "pending" | "rejected" | "active" = "pending";

        const updatedFields = {
          title,
          description: description || `Premium ${category} available in ${locality}, ${city}. Contact owner for specifics.`,
          category,
          city,
          locality,
          price: parsedPrice,
          pricePeriod,
          features: features.length > 0 ? features : ["Excellent Location", "Verified Listing"],
          images: finalImages,
          contactNumber,
          email,
          address: address || `${locality}, ${city}, India`,
          status: statusVal,
          isFeatured,
          isVerified,
        };

        if (!querySnapshot.empty) {
          const docRef = querySnapshot.docs[0].ref;
          await updateDoc(docRef, updatedFields);
        } else {
          // Fallback if editing seeded item that wasn't saved in DB
          await addDoc(collection(db, "listings"), {
            ...editingListing,
            ...updatedFields,
          });
        }

        onSuccess({ ...editingListing, ...updatedFields } as Listing);
      } else {
        // Create new listing
        const listingId = "lst_" + Math.random().toString(36).substr(2, 9);
        const newListing: Listing = {
          id: listingId,
          ownerId: currentUser.uid,
          ownerName: currentUser.name,
          title,
          description: description || `Premium ${category} available in ${locality}, ${city}. Contact owner for specifics.`,
          category,
          city,
          locality,
          price: parsedPrice,
          pricePeriod,
          features: features.length > 0 ? features : ["Excellent Location", "Verified Listing"],
          images: finalImages,
          contactNumber,
          email,
          address: address || `${locality}, ${city}, India`,
          rating: 5.0,
          reviewsCount: 0,
          status: "pending", // Pending admin approval by default
          createdAt: new Date().toISOString(),
          isFeatured,
          isVerified,
        };

        await addDoc(collection(db, "listings"), newListing);
        onSuccess(newListing);
      }
      onClose();
    } catch (err) {
      console.error("Submit listing error:", err);
      handleFirestoreError(err, OperationType.WRITE, "listings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white p-6 md:p-8 shadow-2xl border border-slate-100 flex flex-col overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-950">
              {editingListing ? "Edit Service Listing" : "Add Premium Service Listing"}
            </h3>
            <p className="text-xs text-slate-500">Reach thousands of seekers moving to your city</p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 hover:text-slate-600 shadow-sm cursor-pointer"
            id="add-listing-modal-close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Main Title */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Listing Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Premium Single PG Room near Koramangala Sony Signal"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="owner-listing-title"
            />
          </div>

          {/* Category & City */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Service Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ListingCategory)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                id="owner-listing-category"
              >
                {Object.keys(CATEGORY_LABELS).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">City *</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                id="owner-listing-city"
              >
                {INDIAN_CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Locality & Address */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locality / Sector Area *</label>
              <input
                type="text"
                required
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                placeholder="e.g. HSR Layout, Sector 3"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="owner-listing-locality"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Postal Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. House 42A, Lane 3, Near HSR Club"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Price and Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price / Compensation (INR) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 12000"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                id="owner-listing-price"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Price/Salary Period</label>
              <select
                value={pricePeriod}
                onChange={(e) => setPricePeriod(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                id="owner-listing-price-period"
              >
                <option value="month font-semibold">Per Month</option>
                <option value="day font-semibold">Per Day</option>
                <option value="one-time font-semibold">One-Time / Fixed</option>
                <option value="salary-pm font-semibold">Salary (per month)</option>
              </select>
            </div>
          </div>

          {/* Contact and Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp/Call Contact *</label>
              <input
                type="text"
                required
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contact Email *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Service Photos Section (Phase 3 multiple uploads) */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Service Photos / Gallery (Upload Multiple)
            </label>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50/50 transition-all">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {isUploadingImages ? (
                      <div className="flex items-center gap-2 text-xs text-indigo-600 font-bold">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading/Processing photos...</span>
                      </div>
                    ) : (
                      <>
                        <Plus className="h-5 w-5 text-slate-400 mb-1" />
                        <p className="text-[10px] text-slate-500 font-medium">
                          Click to select multiple photos or drag them here
                        </p>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleUploadImage}
                    className="hidden"
                    disabled={isUploadingImages}
                  />
                </label>
              </div>

              {/* Uploaded Thumbnails Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-slate-100 group">
                      <img src={img} alt={`Preview ${idx}`} referrerPolicy="no-referrer" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={async () => {
                          const imgToDelete = img;
                          setImages((prev) => prev.filter((_, i) => i !== idx));
                          if (imgToDelete.includes("firebasestorage.googleapis.com")) {
                            const { deleteStorageImage } = await import("../services/firestoreService");
                            deleteStorageImage(imgToDelete).catch(console.error);
                          }
                        }}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Features tag creator */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Amenities & Features</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                placeholder="e.g. AC, Wi-Fi, CCTV, North Veg meals"
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-semibold"
                id="owner-listing-feature-input"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white hover:bg-slate-800 cursor-pointer"
                id="owner-listing-add-feature"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* List of features */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {features.map((feat) => (
                <span
                  key={feat}
                  className="flex items-center gap-1 rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-[11px] text-indigo-700 font-bold"
                >
                  <span>{feat}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFeature(feat)}
                    className="text-indigo-500 hover:text-indigo-700 font-bold ml-1 cursor-pointer text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* AI Enhancer Module */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-r from-indigo-50/40 to-indigo-50 p-4 relative overflow-hidden">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-md">
                <Sparkles className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <h5 className="text-xs font-bold text-indigo-800">Generate Professional Listing with AI</h5>
                <p className="text-[10px] text-slate-500 leading-normal mt-0.5 font-medium">
                  Let CityMate Gemini AI draft a stunning, SEO-optimized, highly attractive description and auto-suggest tags based on your inputs.
                </p>
                <button
                  type="button"
                  onClick={handleAIEnhance}
                  disabled={isEnhancing}
                  className="mt-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
                  id="ai-enhance-btn"
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Gemini Drafting Copy...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>Magic AI Enhance</span>
                    </>
                  )
                  }
                </button>
              </div>
            </div>
          </div>

          {/* Trust Toggles (Featured & Verified) */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/30">
            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="listing-is-featured"
                checked={isFeatured}
                disabled={currentUser.subscriptionPlan !== "featured"}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
              />
              <div>
                <label htmlFor="listing-is-featured" className="text-xs font-black text-slate-800 flex items-center gap-1 cursor-pointer">
                  Featured Placements
                </label>
                <p className="text-[9px] text-slate-500 font-medium leading-tight">
                  Top-of-page search indexing. {currentUser.subscriptionPlan === "featured" ? "✓ Unlocked" : "Requires Featured Partner package."}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <input
                type="checkbox"
                id="listing-is-verified"
                checked={isVerified}
                disabled={currentUser.kycStatus !== "verified"}
                onChange={(e) => setIsVerified(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
              />
              <div>
                <label htmlFor="listing-is-verified" className="text-xs font-black text-slate-800 flex items-center gap-1 cursor-pointer">
                  Verified Owner Check
                </label>
                <p className="text-[9px] text-slate-500 font-medium leading-tight">
                  Premium glow badge indicator. {currentUser.kycStatus === "verified" ? "✓ Unlocked" : "Requires Approved Owner KYC."}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detailed Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the property/service in detail (or let our AI helper do it for you!)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="owner-listing-desc"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || isUploadingImages}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 py-3 text-xs font-bold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 cursor-pointer"
              id="owner-listing-submit"
            >
              {isLoading ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{editingListing ? "Save Changes" : "Submit for Approval"}</span>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
