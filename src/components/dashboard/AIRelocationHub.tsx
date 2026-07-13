import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles,
  CheckCircle2,
  MapPin,
  TrendingUp,
  AlertTriangle,
  Clock,
  Compass,
  Building,
  Heart,
  ChevronRight,
  ShieldCheck,
  Zap,
  Info,
  DollarSign,
  Car,
  CheckSquare,
  Square,
  Layers,
  ArrowLeftRight
} from "lucide-react";
import {
  RelocationPreferences,
  MatchedListing,
  LOCALITY_METRICS,
  calculateMatchPercentage,
  fetchAIRecommendedListings
} from "../../services/aiMatcherService";
import { useScamShield } from "../../hooks/useScamShield";
import { Listing } from "../../types";

interface AIRelocationHubProps {
  darkMode: boolean;
  currentUser?: any;
  onSelectListing?: (listing: Listing) => void;
}

export default function AIRelocationHub({ darkMode, currentUser, onSelectListing }: AIRelocationHubProps) {
  // 1. AI Checklist State
  const [checklist, setChecklist] = useState([
    { id: "chk-1", text: "Submit Aadhaar/Govt Identity Verification (KYC)", done: false, priority: "High" },
    { id: "chk-2", text: "Calculate optimal relocation budget bounds", done: true, priority: "Medium" },
    { id: "chk-3", text: "Compare Viman Nagar vs Hinjawadi commute times", done: false, priority: "High" },
    { id: "chk-4", text: "Find verified PG or flat with AI match > 85%", done: false, priority: "High" },
    { id: "chk-5", text: "Book B2B Packer & Mover via referral hub", done: false, priority: "Medium" },
    { id: "chk-6", text: "Order GigaFiber internet installation", done: false, priority: "Low" },
    { id: "chk-7", text: "Subscribe to regional organic tiffin service", done: false, priority: "Low" }
  ]);

  // 2. Area Compare Tool State
  const [selectedAreaA, setSelectedAreaA] = useState("Viman Nagar");
  const [selectedAreaB, setSelectedAreaB] = useState("Hinjawadi");

  // 3. Commute Estimator State
  const [commuteFrom, setCommuteFrom] = useState("Viman Nagar");
  const [commuteTo, setCommuteTo] = useState("HSR Layout");
  const [commuteMode, setCommuteMode] = useState<"metro" | "cab" | "bike" | "bus">("cab");
  const [isCommuting, setIsCommuting] = useState(false);
  const [commuteEstimate, setCommuteEstimate] = useState<any | null>(null);

  // 4. Recommendation Search State
  const [prefs, setPrefs] = useState<RelocationPreferences>({
    maxBudget: 15000,
    workspaceLocality: "Viman Nagar",
    preferredCategory: "pg",
    importanceWeights: {
      budget: 0.4,
      proximity: 0.3,
      safety: 0.15,
      quality: 0.15
    }
  });
  const [recommendedListings, setRecommendedListings] = useState<MatchedListing[]>([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Load recommendations
  const loadRecommendations = async () => {
    setLoadingListings(true);
    try {
      const data = await fetchAIRecommendedListings(prefs, 4);
      setRecommendedListings(data);
    } catch (e) {
      console.error("Error loading recommendations:", e);
    } finally {
      setLoadingListings(false);
    }
  };

  useEffect(() => {
    loadRecommendations();
  }, [prefs.maxBudget, prefs.workspaceLocality, prefs.preferredCategory]);

  // Handle Checklist Toggles
  const handleToggleChecklist = (id: string) => {
    setChecklist(prev =>
      prev.map(item => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const completedCount = checklist.filter(c => c.done).length;
  const progressPercent = Math.round((completedCount / checklist.length) * 100);

  // Calculate Commute Estimates
  const calculateCommute = () => {
    setIsCommuting(true);
    setTimeout(() => {
      // Simple logic based on mock coordinates/localities
      let distance = 8;
      if (commuteFrom === commuteTo) {
        distance = 1.5;
      } else {
        const hash = (commuteFrom.length + commuteTo.length) % 15;
        distance = hash + 4; // 4 to 18 km
      }

      let speedKmh = 25; // default cab speed during peak hour Pune/BLR
      let costPerKm = 18;
      let co2Kg = 0.22; // kg CO2 per km

      if (commuteMode === "metro") {
        speedKmh = 40;
        costPerKm = 4;
        co2Kg = 0.03;
      } else if (commuteMode === "bike") {
        speedKmh = 30;
        costPerKm = 8;
        co2Kg = 0.09;
      } else if (commuteMode === "bus") {
        speedKmh = 18;
        costPerKm = 2;
        co2Kg = 0.06;
      }

      const durationMins = Math.round((distance / speedKmh) * 60) + 5; // adding signal wait buffer
      const totalCost = Math.round(distance * costPerKm) + (commuteMode === "cab" ? 50 : 0);
      const carbonOffset = Math.max(0, Math.round((0.22 - co2Kg) * distance * 10) / 10);

      setCommuteEstimate({
        distance: distance.toFixed(1),
        duration: durationMins,
        cost: totalCost,
        co2Saved: carbonOffset,
        rating: durationMins < 20 ? "Excellent" : durationMins < 45 ? "Moderate" : "Tedious Commute"
      });
      setIsCommuting(false);
    }, 600);
  };

  useEffect(() => {
    calculateCommute();
  }, [commuteFrom, commuteTo, commuteMode]);

  return (
    <div className="space-y-8 p-1">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/20 shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 bg-indigo-500/10 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1.5 text-left">
            <span className="inline-flex items-center gap-1 bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3 animate-pulse" /> Phase 4: Quantum Relocation Suite
            </span>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">AI Relocation Command Center</h2>
            <p className="text-xs text-slate-400 max-w-xl">
              Evaluate live market indicators, simulate transit matrix pipelines, and review personalized match rates across premium micro-markets.
            </p>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 text-center min-w-36">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Checklist Progress</span>
            <span className="text-2xl font-black text-indigo-400">{progressPercent}%</span>
            <div className="w-full bg-slate-950 h-1.5 rounded-full mt-1.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Checklists & Commute Estimator */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. AI Task Milestones Checklist */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <CheckSquare className="h-4.5 w-4.5 text-indigo-400" /> Relocation Checklist Milestones
              </h3>
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-950/50 border border-indigo-900 px-2 py-0.5 rounded">
                {completedCount}/{checklist.length} Done
              </span>
            </div>

            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleToggleChecklist(item.id)}
                  className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                    item.done
                      ? "bg-emerald-950/10 border-emerald-900/30 text-slate-400 line-through"
                      : "bg-slate-900/30 border-slate-800 hover:border-slate-700 text-slate-200"
                  }`}
                >
                  <button className="shrink-0 mt-0.5 text-slate-400 focus:outline-none">
                    {item.done ? (
                      <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400" />
                    ) : (
                      <div className="h-4.5 w-4.5 rounded border border-slate-700 hover:border-indigo-500 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-medium leading-snug">{item.text}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black tracking-wider shrink-0 ${
                    item.priority === "High"
                      ? "bg-rose-950/50 text-rose-400 border border-rose-900/50"
                      : item.priority === "Medium"
                      ? "bg-amber-950/50 text-amber-400 border border-amber-900/50"
                      : "bg-slate-900 text-slate-400"
                  }`}>
                    {item.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Commute Estimator */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-violet-400" /> Relocation Commute Estimator
              </h3>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <Zap className="h-3 w-3" /> Peak Hour Adjusted
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Source Locality</label>
                <select
                  value={commuteFrom}
                  onChange={(e) => setCommuteFrom(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.keys(LOCALITY_METRICS).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Destination (Office)</label>
                <select
                  value={commuteTo}
                  onChange={(e) => setCommuteTo(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  {Object.keys(LOCALITY_METRICS).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Transit Mode</label>
                <div className="grid grid-cols-4 gap-1">
                  {[
                    { id: "metro", label: "Metro" },
                    { id: "cab", label: "Cab" },
                    { id: "bike", label: "Bike" },
                    { id: "bus", label: "Bus" }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setCommuteMode(mode.id as any)}
                      className={`py-2 px-1 text-[9px] font-bold rounded-lg border text-center transition-all ${
                        commuteMode === mode.id
                          ? "bg-violet-600 border-violet-500 text-white"
                          : "bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Commute Results Displays */}
            <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
              {isCommuting ? (
                <div className="flex justify-center items-center h-20 text-xs text-slate-400 gap-2">
                  <div className="h-4 w-4 rounded-full border border-indigo-500 border-t-transparent animate-spin" />
                  Calculating transit matrix pipelines...
                </div>
              ) : commuteEstimate ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Distance</span>
                    <span className="text-sm font-bold text-slate-200">{commuteEstimate.distance} km</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Est. Duration</span>
                    <span className="text-sm font-bold text-violet-400">{commuteEstimate.duration} mins</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">Est. Single Fare</span>
                    <span className="text-sm font-bold text-emerald-400">₹{commuteEstimate.cost}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-900 p-2.5 rounded-lg">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">CO2 Saved</span>
                    <span className="text-sm font-bold text-blue-400">+{commuteEstimate.co2Saved} kg</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Area Compare Tool & Recommended Units */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* 3. Area Compare Tool */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <ArrowLeftRight className="h-4.5 w-4.5 text-blue-400" /> Locality Comparison Matrix
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">BETA</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <select
                value={selectedAreaA}
                onChange={(e) => setSelectedAreaA(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
              >
                {Object.keys(LOCALITY_METRICS).map(loc => (
                  <option key={loc} value={loc} disabled={loc === selectedAreaB}>{loc}</option>
                ))}
              </select>
              <select
                value={selectedAreaB}
                onChange={(e) => setSelectedAreaB(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none"
              >
                {Object.keys(LOCALITY_METRICS).map(loc => (
                  <option key={loc} value={loc} disabled={loc === selectedAreaA}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Side by Side Matrix */}
            <div className="space-y-2 text-xs">
              {[
                { label: "Safety Score Index", key: "safetyScore", suffix: "%" },
                { label: "Transit Connectivity", key: "transportConnectivity", suffix: "%" }
              ].map((row) => {
                const valA = LOCALITY_METRICS[selectedAreaA]?.[row.key as keyof typeof LOCALITY_METRICS[string]] || 80;
                const valB = LOCALITY_METRICS[selectedAreaB]?.[row.key as keyof typeof LOCALITY_METRICS[string]] || 80;
                return (
                  <div key={row.label} className="bg-slate-900/40 border border-slate-900 p-2.5 rounded-lg">
                    <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider font-bold mb-1">
                      <span>{row.label}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-left font-mono font-bold text-blue-400">
                        {selectedAreaA}: {valA}{row.suffix}
                      </div>
                      <div className="text-right font-mono font-bold text-purple-400">
                        {valB}{row.suffix} :{selectedAreaB}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. AI Match Recommendations */}
          <div className="bg-slate-950/40 border border-slate-800/80 p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-emerald-400" /> AI Recommendation Hub
              </h3>
              <button
                onClick={loadRecommendations}
                className="text-[10px] font-bold uppercase text-indigo-400 hover:text-indigo-300"
              >
                Refresh
              </button>
            </div>

            {/* Preference tweaking inputs */}
            <div className="grid grid-cols-2 gap-2 text-left">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Max Budget Rent</label>
                <select
                  value={prefs.maxBudget}
                  onChange={(e) => setPrefs(prev => ({ ...prev, maxBudget: Number(e.target.value) }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-300 focus:outline-none"
                >
                  <option value={8000}>₹8,000 / mo</option>
                  <option value={15000}>₹15,000 / mo</option>
                  <option value={25000}>₹25,000 / mo</option>
                  <option value={40000}>₹40,000 / mo</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Workspace Hub</label>
                <select
                  value={prefs.workspaceLocality}
                  onChange={(e) => setPrefs(prev => ({ ...prev, workspaceLocality: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-1.5 text-[10px] text-slate-300 focus:outline-none"
                >
                  {Object.keys(LOCALITY_METRICS).map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Recommended Listings Results */}
            <div className="space-y-3">
              {loadingListings ? (
                <div className="flex justify-center items-center h-28 text-xs text-slate-400 gap-2">
                  <div className="h-4 w-4 rounded-full border border-emerald-500 border-t-transparent animate-spin" />
                  Generating listing recommendations...
                </div>
              ) : recommendedListings.length === 0 ? (
                <div className="text-center p-6 text-xs text-slate-500">
                  No listings found fitting these constraints. Create active listings in the main screen to run evaluations!
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {recommendedListings.map((listing) => (
                    <div
                      key={listing.id}
                      onClick={() => onSelectListing?.(listing)}
                      className="bg-slate-900/50 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 p-3 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-all text-left"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-black bg-indigo-950/60 text-indigo-400 px-1.5 py-0.5 rounded uppercase">
                            {listing.category}
                          </span>
                          <span className="text-xs font-bold text-slate-200 line-clamp-1">{listing.title}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {listing.locality}, {listing.city} · <span className="text-emerald-400 font-bold">₹{listing.price}/mo</span>
                        </p>
                      </div>

                      {/* Percentage match ring */}
                      <div className="flex flex-col items-end shrink-0 min-w-16">
                        <span className={`text-xs font-black uppercase tracking-wider ${
                          listing.matchPercentage >= 85
                            ? "text-emerald-400"
                            : listing.matchPercentage >= 65
                            ? "text-indigo-400"
                            : "text-amber-400"
                        }`}>
                          {listing.matchPercentage}% Match
                        </span>
                        <span className="text-[9px] text-slate-500">AI Scoring</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
