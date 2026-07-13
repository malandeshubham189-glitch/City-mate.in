import React, { useState } from "react";
import { Listing, ListingCategory } from "../types";
import { Heart, MapPin, Phone, MessageSquare, Star, Share2, ShieldCheck, Sparkles } from "lucide-react";
import { CATEGORY_LABELS } from "../data/seedData";

interface ListingCardProps {
  listing: Listing;
  isFavourite: boolean;
  onToggleFavourite: (listingId: string, event: React.MouseEvent) => void;
  onSelect: (listing: Listing) => void;
  onContactClick: (listing: Listing, type: "call" | "whatsapp", event: React.MouseEvent) => void;
  darkMode: boolean;
}

export default function ListingCard({
  listing,
  isFavourite,
  onToggleFavourite,
  onSelect,
  onContactClick,
  darkMode,
}: ListingCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const categoryInfo = CATEGORY_LABELS[listing.category] || { label: listing.category, icon: "Home" };

  // Utility to format price
  const formatPrice = (price: number, category: ListingCategory) => {
    if (category === "jobs") {
      return `₹${price.toLocaleString("en-IN")} / mo`;
    }
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const getRentOrPriceLabel = (category: ListingCategory, period: string) => {
    if (category === "jobs") return "Compensation";
    if (period === "month") return "/ month";
    if (period === "day") return "/ day";
    if (period === "one-time") return "one-time";
    return `/${period}`;
  };

  // Let's decide if this listing is verified (all seed data and premium listings can show it for a high-end feel!)
  const isVerified = listing.isVerified || listing.rating >= 4.5;

  return (
    <div
      onClick={() => onSelect(listing)}
      className={`group flex flex-col overflow-hidden rounded-2xl border transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer h-full relative ${
        listing.isFeatured
          ? darkMode
            ? "border-amber-500/50 bg-slate-900/50 hover:bg-slate-900/80 shadow-[0_15px_30px_-5px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20"
            : "border-amber-400/80 bg-white hover:bg-amber-50/10 shadow-[0_15px_30px_-5px_rgba(245,158,11,0.08)] ring-1 ring-amber-400/20"
          : darkMode
            ? "border-slate-800/80 bg-slate-900/40 hover:bg-slate-900/70 hover:border-slate-700/80 hover:shadow-[0_15px_30px_-5px_rgba(124,58,237,0.15)] shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
            : "border-slate-100 bg-white hover:bg-slate-50/50 hover:border-slate-200 hover:shadow-[0_15px_30px_-5px_rgba(0,0,0,0.05)] shadow-[0_4px_12px_rgba(0,0,0,0.01)]"
      }`}
      id={`listing-card-${listing.id}`}
    >
      {/* Listing Image Cover & Carousel */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100/5 dark:bg-slate-800/10">
        <img
          src={listing.images[activeImageIndex] || "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80"}
          alt={listing.title}
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-700"
        />

        {/* Shading overlay for better contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

        {/* Favorite Icon */}
        <button
          onClick={(e) => onToggleFavourite(listing.id, e)}
          className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all active:scale-75 z-10 ${
            isFavourite
              ? "bg-red-500 text-white shadow-lg shadow-red-500/50 scale-105"
              : "bg-black/35 hover:bg-white/90 text-white hover:text-red-500"
          }`}
          id={`fav-btn-${listing.id}`}
        >
          <Heart className={`h-4 w-4 transition-all ${isFavourite ? "fill-current" : "scale-100 group-hover:scale-110"}`} />
        </button>

        {/* Featured Tag */}
        {listing.isFeatured && (
          <div className="absolute top-3 right-12 flex items-center gap-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white shadow-md z-10 animate-pulse">
            <Sparkles className="h-2.5 w-2.5 fill-current" />
            <span>Featured</span>
          </div>
        )}

        {/* Category Tag */}
        <div className={`absolute top-3 left-3 rounded-lg px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-white backdrop-blur-md ${
          darkMode ? "bg-slate-900/70 border border-slate-800" : "bg-slate-900/80"
        }`}>
          {categoryInfo.label}
        </div>

        {/* Verified Badge */}
        {isVerified && (
          <div className="absolute top-3 left-28 flex items-center gap-1 rounded-lg bg-sky-500/80 backdrop-blur-md px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-white">
            <ShieldCheck className="h-3 w-3" />
            <span>Verified</span>
          </div>
        )}

        {/* Status indicator for owner preview */}
        {listing.status !== "active" && (
          <div className={`absolute bottom-3 left-3 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${
            listing.status === "pending" ? "bg-amber-500" : "bg-red-500"
          }`}>
            {listing.status}
          </div>
        )}

        {/* Multi-image indicators */}
        {listing.images.length > 1 && (
          <div className="absolute bottom-3 right-3 flex gap-1 bg-black/40 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
            {listing.images.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex(idx);
                }}
                className={`h-1 w-1 rounded-full transition-all ${
                  activeImageIndex === idx ? "w-2.5 bg-white" : "bg-white/50"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Card Details */}
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        
        {/* Rating and Locality */}
        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-widest mb-2">
          <div className="flex items-center gap-1">
            <MapPin className={`h-3 w-3 ${darkMode ? "text-purple-400" : "text-brand-indigo"}`} />
            <span className={`truncate max-w-[150px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {listing.locality}
            </span>
          </div>

          <div className={`flex items-center gap-0.5 rounded-full px-2 py-0.5 font-black text-xs ${
            darkMode 
              ? "bg-purple-950/40 text-purple-400 border border-purple-900/30" 
              : "bg-indigo-50 text-brand-indigo"
          }`}>
            <Star className={`h-3 w-3 fill-current ${darkMode ? "text-purple-400" : "text-brand-indigo"}`} />
            <span>{listing.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className={`text-sm font-extrabold tracking-tight line-clamp-1 transition-colors mb-2 group-hover:text-transparent group-hover:bg-clip-text ${
          darkMode 
            ? "text-slate-100 group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400" 
            : "text-slate-800 group-hover:bg-gradient-to-r group-hover:from-brand-blue group-hover:to-brand-indigo"
        }`}>
          {listing.title}
        </h3>

        {/* Features Preview */}
        <div className="flex flex-wrap gap-1 mb-4">
          {listing.features.slice(0, 3).map((feat, idx) => (
            <span
              key={idx}
              className={`rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
                darkMode
                  ? "bg-slate-900 border border-slate-800/60 text-slate-400"
                  : "bg-slate-50 border border-slate-100 text-slate-600"
              }`}
            >
              {feat}
            </span>
          ))}
          {listing.features.length > 3 && (
            <span className={`rounded-lg px-1.5 py-0.5 text-[10px] font-bold ${
              darkMode ? "bg-slate-900/50 border border-slate-800 text-slate-500" : "bg-slate-50 border border-slate-100 text-slate-400"
            }`}>
              +{listing.features.length - 3}
            </span>
          )}
        </div>

        {/* Price & Primary CTA */}
        <div className={`mt-auto flex items-center justify-between border-t pt-3.5 ${
          darkMode ? "border-slate-800/80" : "border-slate-100"
        }`}>
          <div>
            <span className={`text-[9px] font-extrabold uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              {getRentOrPriceLabel(listing.category, listing.pricePeriod)}
            </span>
            <p className={`text-base font-black tracking-tight mt-0.5 ${darkMode ? "text-white" : "text-slate-950"}`}>
              {formatPrice(listing.price, listing.category)}
            </p>
          </div>

          {/* Quick Contacts */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => onContactClick(listing, "whatsapp", e)}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 hover:bg-emerald-500/25 text-emerald-500 hover:scale-105 active:scale-95 transition-all border border-emerald-500/20"
              title="Chat on WhatsApp"
              id={`whatsapp-btn-${listing.id}`}
            >
              <MessageSquare className="h-4 w-4 fill-emerald-500/10 text-emerald-500" />
            </button>
            <button
              onClick={(e) => onContactClick(listing, "call", e)}
              className={`flex h-8 w-8 items-center justify-center rounded-xl hover:scale-105 active:scale-95 transition-all shadow-md ${
                darkMode
                  ? "bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-indigo-950/20"
                  : "bg-slate-900 text-white shadow-slate-900/10 hover:bg-slate-800"
              }`}
              title="Call Provider"
              id={`call-btn-${listing.id}`}
            >
              <Phone className="h-3.5 w-3.5 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
