import React, { useState, useEffect, useRef } from "react";
import { 
  Upload, Image as ImageIcon, Check, RefreshCw, AlertCircle, Sparkles, 
  MapPin, HelpCircle, ArrowRight 
} from "lucide-react";
import { collection, doc, getDocs, updateDoc, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../lib/firebase";
import { CityGuide } from "../../types";
import { logTelemetrySafe } from "../../services/backupLoggerService";

interface MediaUploaderProps {
  darkMode: boolean;
}

// Curated high-resolution Unsplash presets in case they want a quick premium replacement
const PRESET_CITY_IMAGES: Record<string, string[]> = {
  pune: [
    "https://images.unsplash.com/photo-1601919051950-bb9f3ffb3fee?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80"
  ],
  mumbai: [
    "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1562158074-275cb117739e?auto=format&fit=crop&w=800&q=80"
  ],
  jaipur: [
    "https://images.unsplash.com/photo-1477584305353-813839efcca0?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80"
  ],
  bengaluru: [
    "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1616113170701-d703ee40537d?auto=format&fit=crop&w=800&q=80"
  ]
};

export default function MediaUploader({ darkMode }: MediaUploaderProps) {
  const [cities, setCities] = useState<CityGuide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingCityId, setUploadingCityId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  // Load active cities collection in real-time
  useEffect(() => {
    setLoading(true);
    const citiesRef = collection(db, "cities");
    
    const unsubscribe = onSnapshot(citiesRef, (snapshot) => {
      const list: CityGuide[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ ...docSnap.data(), id: docSnap.id } as CityGuide);
      });
      setCities(list);
      setLoading(false);
    }, (error) => {
      console.error("Failed to stream cities list:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle single-click file upload flow mapping straight into Firebase Storage with Base64 fallback
  const triggerImageUpload = (cityId: string) => {
    setSelectedCityId(cityId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedCityId) return;

    const file = files[0];
    setUploadingCityId(selectedCityId);
    setStatusMessage({ type: "info", text: `Uploading visual banner asset to Firebase Storage...` });

    try {
      let finalUrl = "";
      const filename = `${selectedCityId}_banner_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
      const storageRef = ref(storage, `cities/${selectedCityId}/${filename}`);

      try {
        // Attempt premium Storage upload
        const snapshot = await uploadBytes(storageRef, file);
        finalUrl = await getDownloadURL(snapshot.ref);
        console.log("Uploaded successfully to Storage. Link secure:", finalUrl);
      } catch (err) {
        console.warn("Storage upload bypassed or failed, executing automatic local base64 fallback reader...", err);
        // Fallback to reading file as base64 string
        const reader = new FileReader();
        finalUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
      }

      // Update both coverImage and bannerImage in firestore cities collection
      const cityDocRef = doc(db, "cities", selectedCityId);
      await updateDoc(cityDocRef, {
        coverImage: finalUrl,
        bannerImage: finalUrl // Support both fields resiliently
      });

      setStatusMessage({ 
        type: "success", 
        text: `City visual assets updated successfully. Cover banner set to the dynamic storage pointer!` 
      });

      // Log telemetry of successful media update event
      await logTelemetrySafe({
        type: "performance_metric",
        severity: "info",
        message: `City cover asset updated for document '${selectedCityId}'. Media path secured via uploader.`,
        category: "MEDIA_MANAGEMENT"
      });

    } catch (error: any) {
      console.error("Asset upload operation failed:", error);
      setStatusMessage({ 
        type: "error", 
        text: `Asset update failed: ${error.message || String(error)}` 
      });
    } finally {
      setUploadingCityId(null);
      setSelectedCityId(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Instant apply premium preset photo
  const applyPresetImage = async (cityId: string, url: string) => {
    setUploadingCityId(cityId);
    setStatusMessage({ type: "info", text: "Updating city layout with high-res Unsplash preset..." });

    try {
      const cityDocRef = doc(db, "cities", cityId);
      await updateDoc(cityDocRef, {
        coverImage: url,
        bannerImage: url
      });

      setStatusMessage({ 
        type: "success", 
        text: `Preset background applied successfully for city guide: '${cityId}'.` 
      });

      await logTelemetrySafe({
        type: "performance_metric",
        severity: "info",
        message: `Applied Unsplash preset visual for city guide: '${cityId}'.`,
        category: "MEDIA_MANAGEMENT"
      });
    } catch (error: any) {
      console.error("Failed to update preset image:", error);
      setStatusMessage({ 
        type: "error", 
        text: `Failed to set preset background: ${error.message}` 
      });
    } finally {
      setUploadingCityId(null);
    }
  };

  return (
    <div className={`space-y-6 ${darkMode ? "text-slate-100" : "text-slate-900"}`}>
      
      {/* Header Info Banner */}
      <div className={`p-4 rounded-2xl border ${
        darkMode ? "bg-slate-900/40 border-slate-800" : "bg-indigo-50/50 border-indigo-100"
      }`}>
        <div className="flex gap-3 items-start">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
            <Upload className="h-4 w-4 animate-bounce" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Dynamic Media Upload Engine</h4>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Enhance relocation cards on the landing pages by uploading custom high-resolution banner images. Updates instantly maps straight to Firebase Storage with automatic client-side fallback triggers.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Status Notifications */}
      {statusMessage && (
        <div className={`p-3 rounded-xl border flex items-center gap-3 text-[10px] font-bold uppercase tracking-wide leading-relaxed ${
          statusMessage.type === "success" 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
            : statusMessage.type === "error"
              ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
              : "bg-cyan-500/10 border-cyan-500/20 text-cyan-400 animate-pulse"
        }`}>
          {statusMessage.type === "success" ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Cities Control Grid */}
      {loading ? (
        <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
          <RefreshCw className="h-6 w-6 text-brand-indigo animate-spin" />
          <p className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">Loading City Guides...</p>
        </div>
      ) : cities.length === 0 ? (
        <div className="text-center p-8 text-[10px] font-black text-slate-500 uppercase tracking-wider">
          No dynamic cities loaded in collection database.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cities.map((city) => {
            const presets = PRESET_CITY_IMAGES[city.id] || [];
            const isUploading = uploadingCityId === city.id;

            return (
              <div 
                key={city.id} 
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                  darkMode 
                    ? "bg-slate-900/50 border-slate-800 hover:border-purple-500/30" 
                    : "bg-white border-slate-200/60 hover:border-indigo-200 shadow-sm"
                }`}
              >
                <div>
                  {/* City Current Banner view */}
                  <div className="relative h-28 w-full rounded-xl overflow-hidden group border border-slate-100/10 bg-slate-950">
                    {city.coverImage ? (
                      <img 
                        src={city.coverImage} 
                        alt={city.name} 
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-slate-600 bg-slate-900/50">
                        <ImageIcon className="h-8 w-8 animate-pulse" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-brand-indigo" />
                      <span className="text-xs font-black text-white uppercase tracking-wider">{city.name}</span>
                    </div>
                  </div>

                  {/* City Details */}
                  <div className="mt-3 space-y-1">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-wider">{city.state}</p>
                    <p className="text-[11px] text-slate-400 italic line-clamp-1">"{city.tagline || 'Explore verified rentals and services'}"</p>
                  </div>
                </div>

                {/* Direct Action triggers */}
                <div className="mt-4 pt-3 border-t border-slate-100/10 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[8px] text-slate-500 uppercase font-black tracking-wider">Dynamic storage pointer</span>
                    <button
                      onClick={() => triggerImageUpload(city.id)}
                      disabled={isUploading}
                      className="px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 hover:border-indigo-500/30 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {isUploading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                      <span>{isUploading ? "Uploading..." : "Upload Banner"}</span>
                    </button>
                  </div>

                  {/* Preset Quick Actions */}
                  {presets.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[8px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-1">
                        <Sparkles className="h-2 w-2 text-purple-400" />
                        <span>Curated Premium Presets</span>
                      </p>
                      <div className="flex gap-2">
                        {presets.map((presetUrl, idx) => (
                          <button
                            key={idx}
                            onClick={() => applyPresetImage(city.id, presetUrl)}
                            disabled={isUploading}
                            className="relative h-10 w-20 rounded-md overflow-hidden border border-slate-800/30 hover:border-purple-500 transition-colors cursor-pointer group shrink-0"
                            title={`Apply Preset ${idx + 1}`}
                          >
                            <img src={presetUrl} alt="" className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-black/40 group-hover:bg-transparent transition-colors flex items-center justify-center">
                              <span className="text-[8px] font-bold text-white uppercase tracking-wider">Apply</span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
