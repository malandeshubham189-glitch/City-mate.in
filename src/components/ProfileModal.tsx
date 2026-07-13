import React, { useState } from "react";
import { UserProfile } from "../types";
import { X, User, Phone, MapPin, Check, Loader2 } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";

interface ProfileModalProps {
  currentUser: UserProfile;
  onClose: () => void;
  onUpdate: (updatedProfile: UserProfile) => void;
  darkMode: boolean;
}

export default function ProfileModal({
  currentUser,
  onClose,
  onUpdate,
  darkMode,
}: ProfileModalProps) {
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone || "");
  const [cityPreference, setCityPreference] = useState(currentUser.cityPreference || "Bengaluru");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setSuccess(false);

    try {
      const userRef = doc(db, "users", currentUser.uid);
      const updatedFields = {
        name,
        phone,
        cityPreference,
      };

      await updateDoc(userRef, updatedFields);
      
      const newProfile: UserProfile = {
        ...currentUser,
        ...updatedFields,
      };

      onUpdate(newProfile);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Error updating profile:", err);
      handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className={`relative w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl border transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 ${
        darkMode
          ? "bg-slate-950 border-slate-800 text-white shadow-black/40"
          : "bg-white border-slate-100 text-slate-800"
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between border-b pb-4 mb-5 ${
          darkMode ? "border-slate-800" : "border-slate-100"
        }`}>
          <div>
            <h3 className="text-base font-bold">Profile Management</h3>
            <p className={`text-xs mt-0.5 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              Update your account identity and preferences
            </p>
          </div>
          <button
            onClick={onClose}
            className={`flex h-8 w-8 items-center justify-center rounded-full border shadow-sm cursor-pointer ${
              darkMode
                ? "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                : "border-slate-200 bg-white text-slate-400 hover:text-slate-600"
            }`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Alert */}
        {success ? (
          <div className="text-center py-8 space-y-3">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold">Identity Updated!</h4>
            <p className={`text-xs leading-relaxed max-w-xs mx-auto ${
              darkMode ? "text-slate-400" : "text-slate-500"
            }`}>
              Your profile preferences have been successfully committed to CityMate nodes.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (Read Only) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <input
                type="text"
                disabled
                value={currentUser.email}
                className={`w-full rounded-xl border px-4 py-2.5 text-xs focus:outline-none cursor-not-allowed opacity-60 ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 text-slate-400"
                    : "bg-slate-50 border-slate-200 text-slate-500"
                }`}
              />
            </div>

            {/* Role (Read Only) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Account Role</label>
              <input
                type="text"
                disabled
                value={currentUser.role.toUpperCase()}
                className={`w-full rounded-xl border px-4 py-2.5 text-xs focus:outline-none cursor-not-allowed opacity-60 font-bold ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 text-purple-400"
                    : "bg-slate-50 border-slate-200 text-indigo-600"
                }`}
              />
            </div>

            {/* Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Full Name *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs focus:outline-none focus:ring-1 ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-white focus:ring-purple-500"
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-500"
                  }`}
                />
              </div>
            </div>

            {/* Phone */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">WhatsApp Contact Number *</label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  className={`w-full rounded-xl border px-4 py-2.5 text-xs focus:outline-none focus:ring-1 ${
                    darkMode
                      ? "bg-slate-900 border-slate-800 text-white focus:ring-purple-500"
                      : "bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-500"
                  }`}
                />
              </div>
            </div>

            {/* City Preference */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Primary City Preference</label>
              <select
                value={cityPreference}
                onChange={(e) => setCityPreference(e.target.value)}
                className={`w-full rounded-xl border px-3 py-2.5 text-xs focus:outline-none focus:ring-1 font-semibold ${
                  darkMode
                    ? "bg-slate-900 border-slate-800 text-white focus:ring-purple-500"
                    : "bg-slate-50 border-slate-200 text-slate-700 focus:ring-indigo-500"
                }`}
              >
                {["Bengaluru", "Pune", "Mumbai", "Delhi", "Hyderabad", "Jaipur"].map((c) => (
                  <option key={c} value={c} className="font-semibold">
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !name.trim() || !phone.trim()}
              className={`flex w-full items-center justify-center gap-1.5 rounded-xl py-3 text-xs font-bold text-white shadow-md transition-colors cursor-pointer disabled:opacity-50 mt-4 ${
                darkMode
                  ? "bg-purple-600 hover:bg-purple-700 shadow-purple-950/20"
                  : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span>Save Profile Changes</span>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
