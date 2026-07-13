import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  TrendingUp,
  Compass,
  Train,
  Building,
  ShieldCheck,
  Search,
  BookOpen,
  Award,
  ArrowRight,
  Info,
  Layers,
  Sparkles,
  Heart
} from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  onSnapshot
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../../lib/firebase";
import { CityGuide } from "../../types";
import { getCityImageWithFallback } from "../../utils/forceAssetSync";

// Pre-seeded comprehensive data for metro guides
const INITIAL_GUIDES: CityGuide[] = [
  {
    id: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    tagline: "The Silicon Valley of India & High-Yield Career Capital",
    coverImage: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
    rentBands: {
      bachelorRoom: "₹8,500 - ₹14,000",
      flat2BHK: "₹22,000 - ₹38,000",
      luxuryApartment: "₹45,000 - ₹80,000"
    },
    transport: {
      metroAvailability: "Namma Metro Purple & Green lines fully operational, Outer Ring Road lines under active construction.",
      busNetwork: "BMTC Air-conditioned Volvo buses connect major nodes flawlessly.",
      averageCommuteCost: "₹40 - ₹120 per day (via Metro/Bus)",
      keyTips: [
        "Avoid road transit during 9 AM and 6 PM peak slots on Outer Ring Road.",
        "Secure a smart card to avail 5% discount on Metro commutes.",
        "Use auto-booking apps with pre-negotiated legal metering scales."
      ]
    },
    colleges: [
      { name: "IISc Bengaluru", type: "Research & Science", rating: "4.9/5" },
      { name: "RV College of Engineering (RVCE)", type: "Engineering", rating: "4.7/5" },
      { name: "PES University", type: "Engineering & Science", rating: "4.5/5" },
      { name: "M. S. Ramaiah College of Pharmacy", type: "B.Pharm & Biotech", rating: "4.6/5" }
    ],
    proximityHubs: [
      "Manyata Tech Park (Hebbal)",
      "Bagmane Constellation Business Park (ORR)",
      "Electronic City Phase 1 & 2",
      "Whitefield ITPL Technology Belt"
    ],
    safetyScore: 89,
    safetyDetails: "Extremely receptive corporate corridors. Highly active night shifts with regular local police patrolling across corporate zones.",
    seoTitle: "Relocation Guide to Bengaluru (HSR Layout, Whitefield, Indiranagar) | CityMate",
    seoDescription: "The ultimate relocation guide to Bengaluru. Browse rent budgets, Namma Metro transit details, top engineering and B.Pharm universities, and hyper-local security index matrix.",
    seoKeywords: "Bengaluru relocation, tech parks Hebbal, rent in HSR Layout, BMTC bus routes, B.Pharm Bengaluru"
  },
  {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    tagline: "Oxford of the East & Academic-IT Convergence Hub",
    coverImage: "https://images.unsplash.com/photo-1601919051950-bb9f3ffb3fee?auto=format&fit=crop&w=800&q=80",
    rentBands: {
      bachelorRoom: "₹6,000 - ₹10,000",
      flat2BHK: "₹16,000 - ₹28,000",
      luxuryApartment: "₹35,000 - ₹55,000"
    },
    transport: {
      metroAvailability: "Pune Metro Line 1 & Line 2 operational across central nodes, Hinjewadi phase in progress.",
      busNetwork: "PMPML local bus loops operate extensively throughout the wider city parameters.",
      averageCommuteCost: "₹30 - ₹90 per day",
      keyTips: [
        "Rent an electric two-wheeler to maneuver through internal old-city alleys.",
        "Shared local cabs operate frequently towards Hinjewadi Phase 3.",
        "Purchase local bus day passes for unlimited commutes under ₹70."
      ]
    },
    colleges: [
      { name: "COEP Technological University", type: "Engineering", rating: "4.8/5" },
      { name: "Symbiosis International University", type: "Management & Law", rating: "4.6/5" },
      { name: "Poona College of Pharmacy", type: "B.Pharm & Medical", rating: "4.5/5" },
      { name: "MIT World Peace University", type: "Engineering & Arts", rating: "4.4/5" }
    ],
    proximityHubs: [
      "Rajiv Gandhi Infotech Park (Hinjewadi)",
      "EON Free Zone (Kharadi)",
      "Magarpatta Cyber City",
      "Talawade IT Park"
    ],
    safetyScore: 92,
    safetyDetails: "Ranked as one of the safest metropolitan areas in Western India. High educational density fosters an extremely safe and respectful community culture.",
    seoTitle: "Pune Relocation Matrix (Hinjewadi, Kharadi, Viman Nagar) | CityMate",
    seoDescription: "Explore Pune's complete rental catalog, Hinjewadi Phase 1/2/3 proximity hubs, Symbiosis/COEP academic guide, and Western safety index levels.",
    seoKeywords: "Pune rental flat, Hinjewadi IT park, EON zone Kharadi, PMPML bus schedules, Pune colleges"
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    tagline: "The Financial Epicenter & Maximum City Matrix",
    coverImage: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80",
    rentBands: {
      bachelorRoom: "₹12,000 - ₹22,000",
      flat2BHK: "₹35,000 - ₹65,000",
      luxuryApartment: "₹80,500 - ₹1,80,000"
    },
    transport: {
      metroAvailability: "Expanding Mumbai Metro lines connect Andheri, Dahisar, and Ghatkopar efficiently.",
      busNetwork: "BEST red double-decker buses and air-conditioned routes cover every micro-market.",
      averageCommuteCost: "₹50 - ₹150 per day (via suburban locals)",
      keyTips: [
        "Prefer Suburban Local Trains for North-South express transits.",
        "Buy first-class coach tickets or use mobile UTS app to skip terminal queues.",
        "Avoid peak hours (8:30 - 11:30 AM Southbound, 5:30 - 9:00 PM Northbound)."
      ]
    },
    colleges: [
      { name: "IIT Bombay (Powai)", type: "Engineering & Tech", rating: "4.9/5" },
      { name: "ICT Mumbai", type: "Chemical & Pharmacy", rating: "4.8/5" },
      { name: "Veermata Jijabai Technological Institute (VJTI)", type: "Engineering", rating: "4.6/5" },
      { name: "NMIMS School of Pharmacy", type: "B.Pharm & Biotech", rating: "4.4/5" }
    ],
    proximityHubs: [
      "Bandras-Kurla Complex (BKC)",
      "Nesco IT Park (Goregaon)",
      "Mindspace Cyber City (Malad)",
      "Kanjurmarg-Powai Corporate Belt"
    ],
    safetyScore: 95,
    safetyDetails: "Outstanding metropolitan safety record. The city never sleeps, with fully lit pedestrian streets and prompt transit availability 24 hours a day.",
    seoTitle: "Mumbai Relocation & Suburban Housing Guide | CityMate",
    seoDescription: "Relocate to Mumbai seamlessly. Complete cost catalog for Powai, BKC, and Western Suburbs. Local train UTS guides and premier colleges (IIT Bombay, ICT).",
    seoKeywords: "Mumbai local train map, Bandra rent, BKC tech parks, IIT Bombay, Powai flatshares"
  }
];

export default function CityGuideExplorer({ darkMode }: { darkMode: boolean }) {
  const [cities, setCities] = useState<CityGuide[]>([]);
  const [selectedCity, setSelectedCity] = useState<CityGuide | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Sync /cities database collection with initial pre-seeded values if empty
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let active = true;

    const fetchAndInitializeCities = async () => {
      setLoading(true);
      const citiesRef = collection(db, "cities");
      try {
        const snap = await getDocs(citiesRef);
        
        if (active) {
          // If empty in database, seed them securely first
          if (snap.empty) {
            for (const item of INITIAL_GUIDES) {
              await setDoc(doc(db, "cities", item.id), item);
            }
          }

          // Live streaming listener from /cities Firestore collection
          const q = query(citiesRef);
          unsub = onSnapshot(q, (snapshot) => {
            const fetched: CityGuide[] = [];
            snapshot.forEach((docSnap) => {
              fetched.push(docSnap.data() as CityGuide);
            });
            setCities(fetched);
            if (fetched.length > 0) {
              setSelectedCity((prev) => {
                if (prev) {
                  const updated = fetched.find((c) => c.id === prev.id);
                  return updated || fetched[0];
                }
                return fetched[0];
              });
            }
            setLoading(false);
          });
        }
      } catch (err) {
        if (active) {
          try {
            handleFirestoreError(err, OperationType.GET, "cities");
          } catch (diagErr) {
            console.warn("Firestore collection retrieval failed. Resorting to premium local fallbacks.", diagErr);
          }
          // Fallback to initial guides if network is constrained
          setCities(INITIAL_GUIDES);
          if (INITIAL_GUIDES.length > 0) {
            setSelectedCity(INITIAL_GUIDES[0]);
          }
          setLoading(false);
        }
      }
    };

    fetchAndInitializeCities();

    const handleForceSync = () => {
      console.log("[CityGuideExplorer] Forcing refresh trigger...");
      fetchAndInitializeCities();
    };
    window.addEventListener("citymate_force_asset_sync", handleForceSync);

    return () => {
      active = false;
      if (unsub) unsub();
      window.removeEventListener("citymate_force_asset_sync", handleForceSync);
    };
  }, []);

  // Update Dynamic SEO Parameters when a city is selected
  useEffect(() => {
    if (!selectedCity) return;
    
    // Page Title
    document.title = selectedCity.seoTitle;

    // Meta Description
    let descMeta = document.querySelector("meta[name='description']");
    if (!descMeta) {
      descMeta = document.createElement("meta");
      descMeta.setAttribute("name", "description");
      document.head.appendChild(descMeta);
    }
    descMeta.setAttribute("content", selectedCity.seoDescription);

    // Meta Keywords
    let keywordsMeta = document.querySelector("meta[name='keywords']");
    if (!keywordsMeta) {
      keywordsMeta = document.createElement("meta");
      keywordsMeta.setAttribute("name", "keywords");
      document.head.appendChild(keywordsMeta);
    }
    keywordsMeta.setAttribute("content", selectedCity.seoKeywords);

  }, [selectedCity]);

  const filteredCities = cities.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.state.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 text-left">
      
      {/* Top Banner & Search */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <h2 className="text-sm font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
            <Compass className="h-4.5 w-4.5 text-indigo-400 animate-spin" /> SEO Metropolitan Intelligence
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed font-semibold">
            Dynamic metropolitan database index syncing public transits, local average rent indexes, top technology parks, and hyper-local security matrix values.
          </p>
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Filter city guide catalogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs py-2 pl-8 pr-3 text-slate-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      {/* Grid: City Selection Catalog & Detail panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: City Selection Roll */}
        <div className="lg:col-span-4 space-y-3.5">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
            Curated City Index
          </span>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {loading ? (
              <div className="h-20 bg-slate-900 animate-pulse rounded-2xl" />
            ) : filteredCities.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-500 border border-slate-900 rounded-2xl">
                No indexed cities match this criteria.
              </div>
            ) : (
              filteredCities.map((city) => {
                const isSelected = selectedCity?.id === city.id;
                return (
                  <button
                    key={city.id}
                    onClick={() => setSelectedCity(city)}
                    className={`w-full text-left p-3 rounded-2xl border text-xs font-black transition-all cursor-pointer flex gap-3 items-center ${
                      isSelected
                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg"
                        : "bg-slate-950/40 border-slate-900 text-slate-300 hover:border-slate-800"
                    }`}
                  >
                    <img
                      src={getCityImageWithFallback(city.id, city.coverImage)}
                      alt={city.name}
                      referrerPolicy="no-referrer"
                      className="h-11 w-11 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm leading-tight flex items-center gap-1">
                        {city.name}
                        {city.safetyScore > 90 && (
                          <ShieldCheck className="h-3.5 w-3.5 text-emerald-300 fill-emerald-950" />
                        )}
                      </p>
                      <p className={`text-[10px] truncate ${isSelected ? "text-indigo-200" : "text-slate-500"}`}>
                        {city.tagline}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Guide Parameters */}
        <div className="lg:col-span-8">
          <AnimatePresence mode="wait">
            {selectedCity ? (
              <motion.div
                key={selectedCity.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-5"
              >
                {/* Header Profile with cover image */}
                <div className="relative rounded-xl overflow-hidden h-36 border border-slate-900">
                  <img
                    src={getCityImageWithFallback(selectedCity.id, selectedCity.coverImage)}
                    alt={selectedCity.name}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 h-full w-full object-cover brightness-[0.4]"
                  />
                  <div className="absolute bottom-4 left-4 right-4">
                    <span className="text-[9px] font-black uppercase tracking-wider bg-indigo-600/80 border border-indigo-500/40 text-white px-2 py-0.5 rounded-full">
                      {selectedCity.state}
                    </span>
                    <h3 className="text-xl font-black text-white mt-1">{selectedCity.name} Relocation Hub</h3>
                    <p className="text-[10px] text-slate-300 font-semibold">{selectedCity.tagline}</p>
                  </div>
                </div>

                {/* Grid stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Rent bands */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5" /> Est. Rent Bands Index
                    </span>
                    <div className="space-y-1.5 font-semibold text-slate-300">
                      <div className="flex justify-between">
                        <span>Single Room/PG:</span>
                        <span className="text-slate-200">{selectedCity.rentBands.bachelorRoom}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>2BHK Flat Share:</span>
                        <span className="text-slate-200">{selectedCity.rentBands.flat2BHK}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Premium Apartment:</span>
                        <span className="text-slate-200">{selectedCity.rentBands.luxuryApartment}</span>
                      </div>
                    </div>
                  </div>

                  {/* Proximity / IT Hubs */}
                  <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-900 space-y-2 text-xs">
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                      <Building className="h-3.5 w-3.5" /> High-Density Proximity Hubs
                    </span>
                    <div className="grid grid-cols-1 gap-1 font-semibold text-slate-300">
                      {selectedCity.proximityHubs.map((hub, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full" />
                          <span>{hub}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Public Transport Desk */}
                <div className="bg-slate-900/30 p-4 rounded-xl border border-slate-900 space-y-3 text-xs text-slate-300">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                    <Train className="h-3.5 w-3.5 text-emerald-400" /> Regional Transit Network (Metro / Local)
                  </span>
                  
                  <div className="space-y-1">
                    <p className="font-bold text-slate-200">Metro Network:</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">{selectedCity.transport.metroAvailability}</p>
                  </div>

                  <div className="space-y-1">
                    <p className="font-bold text-slate-200">Bus Network & Locals:</p>
                    <p className="text-[11px] leading-relaxed text-slate-400">{selectedCity.transport.busNetwork}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-900 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-slate-500 block">Pro tips for commuters:</span>
                    <div className="grid grid-cols-1 gap-1 text-[10px]">
                      {selectedCity.transport.keyTips.map((tip, idx) => (
                        <div key={idx} className="flex items-start gap-1">
                          <span className="text-indigo-400 font-extrabold shrink-0">•</span>
                          <span className="text-slate-400 leading-snug">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colleges Matrix */}
                <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-900 space-y-3 text-xs">
                  <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" /> High-Density Educational Colleges Index
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedCity.colleges.map((col, idx) => (
                      <div
                        key={idx}
                        className="bg-slate-950/50 p-2.5 rounded-lg border border-slate-900/80 flex justify-between items-center text-[11px]"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-200">{col.name}</p>
                          <p className="text-[9px] text-slate-500 font-semibold">{col.type}</p>
                        </div>
                        <span className="text-[10px] font-black text-amber-400 bg-amber-950/30 border border-amber-900/30 px-1.5 py-0.5 rounded">
                          {col.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Safety Score Indicator */}
                <div className="bg-emerald-950/20 border border-emerald-900/40 p-4 rounded-xl flex gap-4 items-center text-xs">
                  <div className="h-12 w-12 rounded-full border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0">
                    {selectedCity.safetyScore}%
                  </div>
                  <div className="space-y-0.5 text-slate-300">
                    <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> Curated Safety Index Metric
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-400 font-medium">
                      {selectedCity.safetyDetails}
                    </p>
                  </div>
                </div>

                {/* Schema JSON payload preview for SEO indexers */}
                <div className="bg-slate-950/60 border border-slate-900 p-3 rounded-lg text-[9px] font-mono text-slate-500 leading-relaxed">
                  <span className="block text-slate-400 font-bold mb-1">// SEO METADATA PARAMETERS (AUTO-INDEXED)</span>
                  <p>Title: {selectedCity.seoTitle}</p>
                  <p>Description: {selectedCity.seoDescription}</p>
                  <p>Keywords: {selectedCity.seoKeywords}</p>
                </div>

              </motion.div>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 p-10">
                Select a curated metropolitan center to open the relocate guide.
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
