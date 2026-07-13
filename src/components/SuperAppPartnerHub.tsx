import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useMarketplaceLeads } from "../hooks/useMarketplaceLeads";
import {
  Sparkles,
  Calculator,
  TrendingUp,
  UserCheck,
  Users,
  Percent,
  DollarSign,
  Gift,
  Zap,
  Briefcase,
  Building,
  Truck,
  Coffee,
  Wifi,
  Tv,
  CheckCircle,
  Clock,
  ArrowRight,
  Plus,
  Share2,
  Award,
  Activity,
  Heart,
  Grid,
  MapPin,
  Check,
  PhoneCall,
  Loader2,
  Lock
} from "lucide-react";

interface SuperAppPartnerHubProps {
  currentUser: {
    uid: string;
    name: string;
    email: string;
    role: string;
  };
  darkMode: boolean;
}

// Defining partner types and their metadata
const PARTNERS = [
  { id: "pg", label: "PG Owners Hub", icon: Building, desc: "Manage rooms, PG rules, rent collections & utilities", theme: "from-purple-500 to-indigo-600" },
  { id: "hostel", label: "Student Hostels", icon: Award, desc: "Dorm assignments, curfew timers & warden logs", theme: "from-emerald-500 to-teal-600" },
  { id: "flat", label: "Flats & Brokers", icon: Grid, desc: "Escrow deposits, BHK formats & tenant agreements", theme: "from-amber-500 to-orange-600" },
  { id: "packers", label: "Packers & Movers", icon: Truck, desc: "Real-time dispatch, route logs & damage insurance", theme: "from-blue-500 to-cyan-600" },
  { id: "tiffin", label: "Tiffin & Mess", icon: Coffee, desc: "Veg/Non-veg plans, daily menus & dispatch rosters", theme: "from-rose-500 to-pink-600" },
  { id: "broadband", label: "Broadband/Wi-Fi", icon: Wifi, desc: "Speed tiers, router dispatches & installation schedules", theme: "from-violet-500 to-purple-600" },
  { id: "furniture", label: "Furniture Rentals", icon: Tv, desc: "Beds/sofa catalogs, lease terms & recovery trackers", theme: "from-yellow-500 to-amber-600" },
  { id: "local_services", label: "Local Services", icon: UserCheck, desc: "Rosters for cooks, maids & electricians with ratings", theme: "from-sky-500 to-blue-600" },
  { id: "college", label: "Colleges & Academics", icon: Award, desc: "Hostel alignments, admissions & local transit setups", theme: "from-lime-500 to-emerald-600" },
  { id: "employer", label: "Corporate HR Desk", icon: Briefcase, desc: "Stipend benchmarks, candidate slots & moving support", theme: "from-fuchsia-500 to-rose-600" }
];

export default function SuperAppPartnerHub({ currentUser, darkMode }: SuperAppPartnerHubProps) {
  const [activePartnerTab, setActivePartnerTab] = useState<string>("pg");
  const [activeSection, setActiveSection] = useState<"dashboards" | "business" | "referrals" | "loyalty">("dashboards");

  // Real B2B Marketplace Leads hook and state variables
  const { trackMarketplaceLead, getUserLeads, loading: leadLoading } = useMarketplaceLeads();
  const [dbLeads, setDbLeads] = useState<any[]>([]);

  // Form states for Packers & Movers
  const [packersFrom, setPackersFrom] = useState("");
  const [packersTo, setPackersTo] = useState("");
  const [packersRooms, setPackersRooms] = useState("1 BHK");

  // Form states for Tiffin Service
  const [tiffinPref, setTiffinPref] = useState("veg");
  const [tiffinDuration, setTiffinDuration] = useState("30");

  // Form states for Broadband
  const [broadbandLocality, setBroadbandLocality] = useState("");
  const [broadbandSpeed, setBroadbandSpeed] = useState("100 Mbps");

  const fetchLeads = async () => {
    if (!currentUser?.uid) return;
    try {
      const data = await getUserLeads(currentUser.uid);
      setDbLeads(data);
    } catch (e) {
      console.error("Error loading leads:", e);
    }
  };

  useEffect(() => {
    if (currentUser?.uid) {
      fetchLeads();
    }
  }, [currentUser]);

  // Referral State
  const [referrals, setReferrals] = useState([
    { id: "ref-101", name: "Kunal Sen", email: "kunal.sen@gmail.com", status: "Verified Relocation", reward: "₹500 Gift Voucher", date: "2026-06-15" },
    { id: "ref-102", name: "Sanya Malhotra", email: "sanya.m@yahoo.com", status: "Pending Visit", reward: "Pending", date: "2026-07-02" },
    { id: "ref-103", name: "Vikram Rathore", email: "vikram.r@outlook.com", status: "Sign Up Complete", reward: "Pending", date: "2026-07-07" }
  ]);
  const [refName, setRefName] = useState("");
  const [refEmail, setRefEmail] = useState("");
  const [referralLinkCopied, setReferralLinkCopied] = useState(false);

  // Business Model Simulator States
  const [activeUsers, setActiveUsers] = useState(5000); // monthly active relocating seekers
  const [verifiedPartnersCount, setVerifiedPartnersCount] = useState(120); // subscribing merchants
  const [averageBookingCommission, setAverageBookingCommission] = useState(12); // average % commission
  const [featuredAdBid, setFeaturedAdBid] = useState(1500); // placement fee per spot per month
  const [averageLeadCost, setAverageLeadCost] = useState(150); // CPL (Cost-per-lead) in INR

  // Loyalty Program States
  const [userCoins, setUserCoins] = useState(1450); // MateCoins
  const [claimedRewards, setClaimedRewards] = useState<string[]>([]);
  const [isClaiming, setIsClaiming] = useState<string | null>(null);

  // Business specific states
  const [pgOccupancy, setPgOccupancy] = useState(85);
  const [pgRentCollected, setPgRentCollected] = useState(165000);
  const [curfewLogs, setCurfewLogs] = useState([
    { name: "Ananya Roy", time: "22:15", status: "Flagged Late" },
    { name: "Dhruv Kapoor", time: "21:30", status: "On Time" }
  ]);
  const [flatDepositEscrow, setFlatDepositEscrow] = useState(48000);
  const [truckDispatch, setTruckDispatch] = useState([
    { route: "HSR Layout ➔ Whitefield", driver: "Ramesh K.", status: "In Transit", eta: "25 min" },
    { route: "Koramangala ➔ Bannerghatta", driver: "Gurpreet S.", status: "Loading", eta: "45 min" }
  ]);
  const [tiffinCount, setTiffinCount] = useState(45);
  const [broadbandSchedules, setBroadbandSchedules] = useState([
    { client: "Aman Preet", slot: "10:00 AM - 12:00 PM", plan: "500 Mbps Fiber" },
    { client: "Sneha Nair", slot: "02:30 PM - 04:30 PM", plan: "200 Mbps Fiber" }
  ]);
  const [furnitureRentedOut, setFurnitureRentedOut] = useState(18);
  const [cookMaidStatus, setCookMaidStatus] = useState([
    { name: "Lakshmi Bai (Cook)", rate: "₹4,000/mo", status: "Assigned" },
    { name: "Raju Prasad (Maid)", rate: "₹2,500/mo", status: "Available" }
  ]);
  const [collegeIntake, setCollegeIntake] = useState(140);
  const [interviewsBooked, setInterviewsBooked] = useState(8);

  // Dynamic calculations for investor business model
  const monthlySubscriptionRevenue = verifiedPartnersCount * 1499; // ₹1499/month partner listing subscription
  const monthlyFeaturedPlacementsRevenue = 25 * featuredAdBid; // say 25 featured slots
  const monthlyLeadsRevenue = activeUsers * 0.15 * averageLeadCost; // 15% conversion to paid lead queries
  const monthlyCommissionsRevenue = activeUsers * 0.08 * 14000 * (averageBookingCommission / 100); // 8% complete booking * 14k avg transaction value
  const monthlyAIPremiumRevenue = activeUsers * 0.05 * 499; // 5% buy the premium concierge assistant at ₹499

  const totalMonthlyRecurringRevenue = monthlySubscriptionRevenue + monthlyFeaturedPlacementsRevenue + monthlyLeadsRevenue + monthlyCommissionsRevenue + monthlyAIPremiumRevenue;
  const networkEffectsMultiplier = (verifiedPartnersCount / 50 + activeUsers / 2000).toFixed(1);

  // Copy simulated referral link
  const copyReferralLink = () => {
    setReferralLinkCopied(true);
    navigator.clipboard.writeText(`https://citymate.in/invite/CM-${currentUser.uid.substring(0, 5).toUpperCase()}`);
    setTimeout(() => setReferralLinkCopied(false), 2000);
  };

  // Submit dynamic referral
  const handleAddReferral = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refName.trim() || !refEmail.trim()) return;
    const newRef = {
      id: `ref-${Math.floor(100 + Math.random() * 900)}`,
      name: refName,
      email: refEmail,
      status: "Sign Up Complete",
      reward: "Pending",
      date: new Date().toISOString().split("T")[0]
    };
    setReferrals([newRef, ...referrals]);
    setRefName("");
    setRefEmail("");
    setUserCoins((prev) => prev + 100); // Give MateCoins for inviting!
  };

  // Redeem reward
  const handleRedeemReward = (rewardId: string, cost: number, providerName: string) => {
    if (userCoins < cost) return;
    setIsClaiming(rewardId);
    setTimeout(() => {
      setUserCoins((prev) => prev - cost);
      setClaimedRewards([...claimedRewards, rewardId]);
      setIsClaiming(null);
    }, 1000);
  };

  return (
    <div className={`space-y-6 ${darkMode ? "text-slate-100" : "text-slate-800"}`}>
      {/* Super App Hero Badge Card */}
      <div className={`relative overflow-hidden rounded-2xl border p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all ${
        darkMode 
          ? "bg-gradient-to-r from-slate-950 via-indigo-950/20 to-purple-950/20 border-slate-800/80" 
          : "bg-gradient-to-r from-white via-indigo-50/20 to-purple-50/20 border-slate-150"
      }`}>
        <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-indigo bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15">
              India's first AI Relocation Super App
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight uppercase">
            Marketplace & Revenue Engine
          </h2>
          <p className="text-xs text-slate-400 max-w-xl font-medium leading-relaxed">
            CityMate is not just a listing board. We are a hyper-local marketplace bridging home-seekers with vetted services, generating scalable B2B revenues, referral incentives, and network synergies.
          </p>
        </div>

        {/* Dashboard Sub-tabs Switcher */}
        <div className="flex bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 shrink-0 gap-1">
          <button
            onClick={() => setActiveSection("dashboards")}
            className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeSection === "dashboards" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Partner Dashboards
          </button>
          <button
            onClick={() => setActiveSection("business")}
            className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeSection === "business" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Investor Model
          </button>
          <button
            onClick={() => setActiveSection("referrals")}
            className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeSection === "referrals" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Referrals Hub
          </button>
          <button
            onClick={() => setActiveSection("loyalty")}
            className={`px-3 py-2 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
              activeSection === "loyalty" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            Loyalty Engine
          </button>
        </div>
      </div>

      {/* SECTION 1: 10 PARTNER DASHBOARDS */}
      {activeSection === "dashboards" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar selector of B2B partners */}
          <div className="lg:col-span-4 space-y-2">
            <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl mb-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Merchant Type Selector</h4>
              <p className="text-[10px] text-slate-500 font-medium">Toggle any of the 10 core co-living vertical dashboards inside CityMate's ecosystem.</p>
            </div>
            <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
              {PARTNERS.map((p) => {
                const IconComp = p.icon;
                const isSelected = activePartnerTab === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setActivePartnerTab(p.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-slate-900 border-indigo-500/40 text-white shadow-md shadow-indigo-950/20"
                        : "bg-slate-950/30 border-slate-900 hover:border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className={`p-2 rounded-lg bg-gradient-to-br ${p.theme} text-white`}>
                      <IconComp className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-black uppercase tracking-wide truncate">{p.label}</p>
                      <p className="text-[10px] text-slate-500 font-medium truncate">{p.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Core Dashboard Workspace */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePartnerTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 space-y-6"
              >
                {/* Dashboard Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/15 uppercase tracking-widest">
                      Verified CityMate Partner
                    </span>
                    <h3 className="text-lg font-black uppercase tracking-tight mt-1">
                      {PARTNERS.find((p) => p.id === activePartnerTab)?.label}
                    </h3>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Estimated Revenue Slice</p>
                    <p className="text-sm font-mono font-extrabold text-emerald-400">10% commission on deal</p>
                  </div>
                </div>

                {/* CONDITIONAL SUB-DASHBOARD INVENTORIES */}

                {/* 1. PG Owners Dashboard */}
                {activePartnerTab === "pg" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Occupancy Rate</p>
                        <h4 className="text-xl font-mono font-black text-indigo-400">{pgOccupancy}%</h4>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={pgOccupancy}
                          onChange={(e) => setPgOccupancy(Number(e.target.value))}
                          className="w-full accent-indigo-500 mt-2"
                        />
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Room Inventory</p>
                        <h4 className="text-xl font-mono font-black text-emerald-400">32 Rooms / 4 PGs</h4>
                        <p className="text-[9px] text-slate-500 font-bold mt-2">HSR Lay. | Koramangala</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Collected Rent (MTD)</p>
                        <h4 className="text-xl font-mono font-black text-amber-400">₹{(pgRentCollected).toLocaleString("en-IN")}</h4>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setPgRentCollected(prev => prev + 15000)} className="px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 text-[8px] font-bold rounded">Add Rent</button>
                          <button onClick={() => setPgRentCollected(0)} className="px-1.5 py-0.5 bg-red-950/40 text-red-400 text-[8px] font-bold rounded">Reset</button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-2.5">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-emerald-400" /> Roommate Matching Ledger
                      </h4>
                      <p className="text-[10px] text-slate-400 leading-relaxed">
                        CityMate AI uses matching preferences (veg diet, night shift, quiet study, cleanliness score) to pair seekers with vacant beds dynamically.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1.5">
                        <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg text-[10px]">
                          <p className="font-extrabold text-indigo-400">Room 102 Match Result</p>
                          <p className="text-slate-500">Candidate: Vikram S. • Match compatibility: <strong className="text-emerald-400">96%</strong></p>
                        </div>
                        <div className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg text-[10px]">
                          <p className="font-extrabold text-indigo-400">Room 304 Match Result</p>
                          <p className="text-slate-500">Candidate: Shruthi K. • Match compatibility: <strong className="text-emerald-400">89%</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Hostels Dashboard */}
                {activePartnerTab === "hostel" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Active Student Beds</p>
                        <h4 className="text-xl font-mono font-black text-purple-400">120 Beds / 8 Dorms</h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Mess Meal Timing</p>
                        <h4 className="text-xl font-mono font-black text-amber-400">Breakfast: 7:30 AM - 9:30 AM</h4>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-rose-400" /> Digital Warden Curfew Logs
                        </h4>
                        <button
                          onClick={() => setCurfewLogs([{ name: `Student ${Math.floor(Math.random() * 50)}`, time: "22:45", status: "Flagged Late" }, ...curfewLogs])}
                          className="px-2 py-1 bg-indigo-600 text-[8px] font-black uppercase rounded"
                        >
                          Simulate Late Entry
                        </button>
                      </div>
                      <div className="divide-y divide-slate-800/80">
                        {curfewLogs.map((log, i) => (
                          <div key={i} className="py-2.5 flex justify-between text-[11px] font-bold">
                            <span>{log.name}</span>
                            <span className="font-mono text-slate-400">{log.time}</span>
                            <span className={log.status === "On Time" ? "text-emerald-400" : "text-rose-400"}>{log.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Flats Dashboard */}
                {activePartnerTab === "flat" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Flats Listed (1/2/3 BHK)</p>
                        <h4 className="text-lg font-mono font-black text-amber-500">14 Gated Flats</h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Escrow Security Deposits</p>
                        <h4 className="text-lg font-mono font-black text-emerald-400">₹{flatDepositEscrow.toLocaleString("en-IN")}</h4>
                        <button onClick={() => setFlatDepositEscrow(prev => prev + 12000)} className="text-[8px] font-black bg-slate-800 px-2 py-0.5 rounded mt-1.5">Escrow Inflow</button>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Standard Brokerage commission</p>
                        <h4 className="text-lg font-mono font-black text-indigo-400">0% (Zero Brokerage)</h4>
                        <p className="text-[8px] text-slate-500 mt-1">Saves tenant ₹15k-40k</p>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider">Tenant e-Agreement Wizard</h4>
                      <p className="text-[10px] text-slate-400">
                        Instantly compile and seal rental agreements using Aadhaar e-Sign on the CityMate blockchain network node.
                      </p>
                      <div className="flex gap-2 pt-2">
                        <button className="px-3 py-1.5 bg-indigo-600 text-[10px] font-black uppercase rounded-lg">Draft Agreement</button>
                        <button className="px-3 py-1.5 bg-slate-800 text-[10px] font-black uppercase rounded-lg">View Template</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Packers & Movers Dashboard */}
                {activePartnerTab === "packers" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Available Fleet Trucks</p>
                        <h4 className="text-xl font-mono font-black text-blue-400">12 Trucks Active</h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Assured Goods Insurance</p>
                        <h4 className="text-xl font-mono font-black text-emerald-400">₹5,00,000 Cover</h4>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                          <Truck className="h-4 w-4 text-cyan-400" /> Active Dispatch Status
                        </h4>
                        <button
                          onClick={() => setTruckDispatch([{ route: "Indiranagar ➔ Jayanagar", driver: "Ajit Singh", status: "Assigned", eta: "15 min" }, ...truckDispatch])}
                          className="px-2 py-1 bg-indigo-600 text-[8px] font-black uppercase rounded"
                        >
                          Dispatch New Truck
                        </button>
                      </div>
                      <div className="divide-y divide-slate-800/80">
                        {truckDispatch.map((truck, i) => (
                          <div key={i} className="py-2.5 flex justify-between items-center text-[11px] font-bold">
                            <div className="space-y-0.5">
                              <p className="font-extrabold">{truck.route}</p>
                              <p className="text-[9px] text-slate-500">Driver: {truck.driver}</p>
                            </div>
                            <span className="font-mono text-slate-400">ETA: {truck.eta}</span>
                            <span className="text-cyan-400 bg-cyan-900/10 border border-cyan-800/40 px-1.5 py-0.5 rounded text-[9px] uppercase font-black">{truck.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Packers & Movers B2B Interactive Lead Generator */}
                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> Book Packer & Mover Referral
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Input relocation details. This dynamically submits an encrypted corporate lead to third-party movers and calculates a 5% commission for CityMate.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          placeholder="From (e.g. Viman Nagar)"
                          value={packersFrom}
                          onChange={(e) => setPackersFrom(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 text-slate-200 outline-none"
                        />
                        <input
                          type="text"
                          placeholder="To (e.g. HSR Layout)"
                          value={packersTo}
                          onChange={(e) => setPackersTo(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 text-slate-200 outline-none"
                        />
                        <select
                          value={packersRooms}
                          onChange={(e) => setPackersRooms(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-300 focus:outline-none"
                        >
                          <option value="1 BHK">1 BHK (Est: ₹5,000)</option>
                          <option value="2 BHK">2 BHK (Est: ₹8,000)</option>
                          <option value="3 BHK">3 BHK (Est: ₹12,000)</option>
                        </select>
                      </div>
                      <button
                        onClick={async () => {
                          if (!packersFrom.trim() || !packersTo.trim()) {
                            alert("Please provide both from and to locations.");
                            return;
                          }
                          const cost = packersRooms === "1 BHK" ? 5000 : packersRooms === "2 BHK" ? 8000 : 12000;
                          try {
                            await trackMarketplaceLead({
                              partnerType: "packers_movers",
                              partnerName: "CityMate Logistics Corp",
                              userId: currentUser?.uid || "guest",
                              userName: currentUser?.name || "Guest User",
                              userEmail: currentUser?.email || "guest@citymate.in",
                              userPhone: "+91 98765 43210",
                              city: "Pune",
                              payloadDetails: {
                                from: packersFrom,
                                to: packersTo,
                                size: packersRooms,
                                estimatedMoveCost: cost
                              }
                            });
                            alert("Relocation Lead Logged Securely! B2B commission recorded.");
                            setPackersFrom("");
                            setPackersTo("");
                            fetchLeads();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        disabled={leadLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-black uppercase py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {leadLoading ? "Processing Lead..." : `Submit Lead (Est. Comm: ₹${Math.round((packersRooms === "1 BHK" ? 5000 : packersRooms === "2 BHK" ? 8000 : 12000) * 0.05)})`}
                      </button>

                      {/* Display active leads */}
                      {dbLeads.filter(l => l.partnerType === "packers_movers").length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">Your Dispatched Movers Leads</span>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {dbLeads.filter(l => l.partnerType === "packers_movers").map((l, idx) => (
                              <div key={idx} className="bg-slate-950 border border-slate-900 p-2 rounded flex justify-between items-center text-[10px]">
                                <span className="font-medium text-slate-300">
                                  {l.payloadDetails?.size} ({l.payloadDetails?.from} ➔ {l.payloadDetails?.to})
                                </span>
                                <span className="text-emerald-400 font-mono font-bold">Comm: ₹{l.commissionAmount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 5. Tiffin Providers Dashboard */}
                {activePartnerTab === "tiffin" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Active Subscribers</p>
                        <h4 className="text-xl font-mono font-black text-rose-400">{tiffinCount} subscribers</h4>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setTiffinCount(prev => prev + 5)} className="px-1.5 py-0.5 bg-slate-800 text-[8px] font-bold rounded">+</button>
                          <button onClick={() => setTiffinCount(prev => Math.max(0, prev - 5))} className="px-1.5 py-0.5 bg-slate-800 text-[8px] font-bold rounded">-</button>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Vegetarian Share</p>
                        <h4 className="text-xl font-mono font-black text-emerald-400">72% Green Meals</h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Avg Meal Price</p>
                        <h4 className="text-xl font-mono font-black text-amber-400">₹85 / Plate</h4>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Coffee className="h-4 w-4 text-rose-400" /> Today's Tiffin Dispatch Menu
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs font-medium py-1">
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                          <p className="font-extrabold text-emerald-400">VEG LUNCH BOX</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Paneer Masala, Tadka Dal, 3 Rotis, Rice & Curd</p>
                        </div>
                        <div className="bg-slate-950 p-2.5 rounded-lg border border-slate-850">
                          <p className="font-extrabold text-rose-400">NON-VEG LUNCH BOX</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Homestyle Chicken Curry, Tadka Dal, 3 Rotis, Rice</p>
                        </div>
                      </div>
                    </div>

                    {/* Tiffin Services B2B Interactive Lead Generator */}
                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> Request Tiffin Service Subscription
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Choose meal plans. Generates a flat rate of ₹150 referral commission automatically recorded to CityMate.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          value={tiffinPref}
                          onChange={(e) => setTiffinPref(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-300 focus:outline-none"
                        >
                          <option value="veg">Pure Vegetarian Plan (₹2,500/mo)</option>
                          <option value="nonveg">Veg + Non-Veg Combo (₹3,200/mo)</option>
                        </select>
                        <select
                          value={tiffinDuration}
                          onChange={(e) => setTiffinDuration(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-300 focus:outline-none"
                        >
                          <option value="7">Weekly Trial (7 Days)</option>
                          <option value="30">Monthly subscription (30 Days)</option>
                        </select>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await trackMarketplaceLead({
                              partnerType: "tiffin",
                              partnerName: "Maa Ki Rasoi Tiffins",
                              userId: currentUser?.uid || "guest",
                              userName: currentUser?.name || "Guest User",
                              userEmail: currentUser?.email || "guest@citymate.in",
                              userPhone: "+91 98765 43210",
                              city: "Pune",
                              payloadDetails: {
                                preference: tiffinPref,
                                days: tiffinDuration
                              }
                            });
                            alert("Tiffin Meal Lead Logged! Flat commission recorded.");
                            fetchLeads();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        disabled={leadLoading}
                        className="w-full bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-black uppercase py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {leadLoading ? "Processing..." : "Subscribe Tiffin Referral (Est. Comm: ₹150)"}
                      </button>

                      {/* Display active leads */}
                      {dbLeads.filter(l => l.partnerType === "tiffin").length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">Your Dispatched Tiffin Referrals</span>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {dbLeads.filter(l => l.partnerType === "tiffin").map((l, idx) => (
                              <div key={idx} className="bg-slate-950 border border-slate-900 p-2 rounded flex justify-between items-center text-[10px]">
                                <span className="font-medium text-slate-300 uppercase">
                                  {l.payloadDetails?.preference === "veg" ? "Pure Veg" : "Veg/Non-Veg"} ({l.payloadDetails?.days} Days)
                                </span>
                                <span className="text-emerald-400 font-mono font-bold">Comm: ₹{l.commissionAmount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 6. Broadband Companies Dashboard */}
                {activePartnerTab === "broadband" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Fiber Connectivity Status</p>
                        <h4 className="text-xl font-mono font-black text-violet-400">GigaFiber Active</h4>
                        <p className="text-[9px] text-slate-500 mt-1">99.9% uptime verified node</p>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">CityMate Member Discount</p>
                        <h4 className="text-xl font-mono font-black text-emerald-400">15% Off Router Plans</h4>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <Wifi className="h-4 w-4 text-violet-400" /> Installation Schedules (Today)
                      </h4>
                      <div className="divide-y divide-slate-800/80">
                        {broadbandSchedules.map((sched, i) => (
                          <div key={i} className="py-2 flex justify-between items-center text-[11px] font-bold">
                            <div>
                              <p className="font-extrabold text-slate-300">{sched.client}</p>
                              <p className="text-[9px] text-slate-500">Tier: {sched.plan}</p>
                            </div>
                            <span className="font-mono text-violet-400">{sched.slot}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Broadband B2B Interactive Lead Generator */}
                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4" /> Order GigaFiber Internet Referral
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        Schedule an installation. Generates a flat rate of ₹300 B2B installation commission recorded instantly on lead validation.
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Your Locality (e.g. Viman Nagar)"
                          value={broadbandLocality}
                          onChange={(e) => setBroadbandLocality(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 focus:ring-1 focus:ring-indigo-500 text-slate-200 outline-none"
                        />
                        <select
                          value={broadbandSpeed}
                          onChange={(e) => setBroadbandSpeed(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-300 focus:outline-none"
                        >
                          <option value="100 Mbps">100 Mbps Plan (₹599/mo)</option>
                          <option value="300 Mbps">300 Mbps Plan (₹999/mo)</option>
                          <option value="500 Mbps">500 Mbps Plan (₹1499/mo)</option>
                        </select>
                      </div>
                      <button
                        onClick={async () => {
                          if (!broadbandLocality.trim()) {
                            alert("Please specify the installation locality.");
                            return;
                          }
                          try {
                            await trackMarketplaceLead({
                              partnerType: "broadband",
                              partnerName: "Airtel GigaFiber",
                              userId: currentUser?.uid || "guest",
                              userName: currentUser?.name || "Guest User",
                              userEmail: currentUser?.email || "guest@citymate.in",
                              userPhone: "+91 98765 43210",
                              city: "Pune",
                              payloadDetails: {
                                locality: broadbandLocality,
                                speed: broadbandSpeed
                              }
                            });
                            alert("High-Speed Fiber Lead Submitted! Flat commission logged.");
                            setBroadbandLocality("");
                            fetchLeads();
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        disabled={leadLoading}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-black uppercase py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                      >
                        {leadLoading ? "Scheduling..." : "Book Fiber Installation (Est. Comm: ₹300)"}
                      </button>

                      {/* Display active leads */}
                      {dbLeads.filter(l => l.partnerType === "broadband").length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1">Your Dispatched Fiber Connections</span>
                          <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                            {dbLeads.filter(l => l.partnerType === "broadband").map((l, idx) => (
                              <div key={idx} className="bg-slate-950 border border-slate-900 p-2 rounded flex justify-between items-center text-[10px]">
                                <span className="font-medium text-slate-300">
                                  {l.payloadDetails?.speed} Fiber ({l.payloadDetails?.locality})
                                </span>
                                <span className="text-emerald-400 font-mono font-bold">Comm: ₹{l.commissionAmount}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* 7. Furniture Rental Dashboard */}
                {activePartnerTab === "furniture" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Total Rented Appliances</p>
                        <h4 className="text-xl font-mono font-black text-yellow-500">{furnitureRentedOut} items active</h4>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setFurnitureRentedOut(prev => prev + 1)} className="px-1.5 py-0.5 bg-slate-800 text-[8px] font-bold rounded">+</button>
                          <button onClick={() => setFurnitureRentedOut(prev => Math.max(0, prev - 1))} className="px-1.5 py-0.5 bg-slate-800 text-[8px] font-bold rounded">-</button>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Top Rented Asset</p>
                        <h4 className="text-xl font-mono font-black text-emerald-400">Modular Study Desk</h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Average Lease Duration</p>
                        <h4 className="text-xl font-mono font-black text-purple-400">11 Months</h4>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider">Premium Package Bundles</h4>
                      <p className="text-[10px] text-slate-400">
                        CityMate subscribers can choose predefined bedroom + workstation bundles to fully furnish their spaces in 24 hours.
                      </p>
                      <div className="bg-slate-950 p-3 rounded-lg border border-slate-850 text-[11px] font-bold flex justify-between items-center">
                        <div>
                          <p className="text-indigo-400 uppercase tracking-wider text-[10px]">Elite Study Workstation</p>
                          <p className="text-[10px] text-slate-500 font-medium">Includes Ergonomic Chair, Study Desk & Modular bookshelf</p>
                        </div>
                        <span className="font-mono text-emerald-400">₹499/month</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 8. Local Services Dashboard */}
                {activePartnerTab === "local_services" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Verified Cleaners & Cooks</p>
                        <h4 className="text-xl font-mono font-black text-sky-400">48 Verified Partners</h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Average Service Rating</p>
                        <h4 className="text-xl font-mono font-black text-emerald-400">4.9 / 5 Stars</h4>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                        <UserCheck className="h-4 w-4 text-sky-400" /> Active Local Roster
                      </h4>
                      <div className="divide-y divide-slate-800/80">
                        {cookMaidStatus.map((service, i) => (
                          <div key={i} className="py-2 flex justify-between items-center text-[11px] font-bold">
                            <div>
                              <p className="font-extrabold">{service.name}</p>
                              <p className="text-[9px] text-slate-500">Rate Benchmark: {service.rate}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                              service.status === "Assigned" ? "bg-indigo-500/15 text-indigo-400" : "bg-emerald-500/15 text-emerald-400"
                            }`}>{service.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 9. Colleges Dashboard */}
                {activePartnerTab === "college" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Aligned Hostels</p>
                        <h4 className="text-xl font-mono font-black text-emerald-400">6 Verified Hubs</h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Pending Student Intakes</p>
                        <h4 className="text-xl font-mono font-black text-amber-500">{collegeIntake} Candidates</h4>
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => setCollegeIntake(prev => prev + 15)} className="px-1 py-0.5 bg-slate-800 text-[8px] font-bold rounded">+</button>
                          <button onClick={() => setCollegeIntake(0)} className="px-1 py-0.5 bg-red-950/40 text-red-400 text-[8px] font-bold rounded">Reset</button>
                        </div>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Shuttle Transit Support</p>
                        <h4 className="text-xl font-mono font-black text-indigo-400">Bus Loops Active</h4>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider">Symbiosis / RV College Student Relocations Desk</h4>
                      <p className="text-[10px] text-slate-400">
                        We partner directly with leading institutions in Pune and Bengaluru to assist incoming freshman classes with housing and mess bookings.
                      </p>
                    </div>
                  </div>
                )}

                {/* 10. Employers Dashboard */}
                {activePartnerTab === "employer" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Employer Corporate accounts</p>
                        <h4 className="text-xl font-mono font-black text-fuchsia-400">18 Corporations</h4>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800/60">
                        <p className="text-[10px] text-slate-500 font-black uppercase">Interviews Scheduled (This Week)</p>
                        <h4 className="text-xl font-mono font-black text-emerald-400">{interviewsBooked} slots</h4>
                        <button onClick={() => setInterviewsBooked(prev => prev + 1)} className="text-[8px] font-black bg-slate-800 px-2 py-0.5 rounded mt-1.5">Add Slot</button>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-4 border border-slate-800 rounded-xl space-y-2">
                      <h4 className="text-xs font-black uppercase tracking-wider">Corporate Candidate Moving Desk</h4>
                      <p className="text-[10px] text-slate-400">
                        Provide zero-stress, corporate-sponsored relocation allowance to SDE interns and new hires. Integrates seamlessly with employee onboarding systems.
                      </p>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* SECTION 2: INVESTOR-GRADE BUSINESS MODEL SIMULATOR */}
      {activeSection === "business" && (
        <div className="space-y-6">
          {/* Executive metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Projected MRR (INR)</p>
              <h3 className="text-xl font-mono font-black text-emerald-400">₹{Math.round(totalMonthlyRecurringRevenue).toLocaleString("en-IN")}</h3>
              <p className="text-[9px] text-slate-500 mt-1">Multi-channel subscription + bookings</p>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Verified Merchant Subscriptions</p>
              <h3 className="text-xl font-mono font-black text-indigo-400">₹{Math.round(monthlySubscriptionRevenue).toLocaleString("en-IN")}</h3>
              <p className="text-[9px] text-slate-500 mt-1">₹1,499/mo per merchant partner</p>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Booking Commission Cut</p>
              <h3 className="text-xl font-mono font-black text-amber-400">₹{Math.round(monthlyCommissionsRevenue).toLocaleString("en-IN")}</h3>
              <p className="text-[9px] text-slate-500 mt-1">Commissions slice on completed tours</p>
            </div>
            <div className="bg-slate-950 p-4 border border-slate-800 rounded-xl">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Network Effects Multiplier</p>
              <h3 className="text-xl font-mono font-black text-cyan-400">{networkEffectsMultiplier}x</h3>
              <p className="text-[9px] text-slate-500 mt-1">Room listing volume cross-selling strength</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Control Sliders */}
            <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-5">
              <h4 className="text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
                <Calculator className="h-4 w-4 text-brand-indigo" /> Financial Model Parameters
              </h4>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Monthly Relocators</span>
                  <span className="text-white font-mono">{activeUsers.toLocaleString()} seekers</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="20000"
                  step="500"
                  value={activeUsers}
                  onChange={(e) => setActiveUsers(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Vetted Merchants</span>
                  <span className="text-white font-mono">{verifiedPartnersCount} merchants</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={verifiedPartnersCount}
                  onChange={(e) => setVerifiedPartnersCount(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Booking Commission Percentage</span>
                  <span className="text-white font-mono">{averageBookingCommission}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="25"
                  step="1"
                  value={averageBookingCommission}
                  onChange={(e) => setAverageBookingCommission(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Featured Placement Bid (INR/mo)</span>
                  <span className="text-white font-mono">₹{featuredAdBid.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="100"
                  value={featuredAdBid}
                  onChange={(e) => setFeaturedAdBid(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold">
                  <span className="text-slate-400">Average Cost-per-Lead (INR)</span>
                  <span className="text-white font-mono">₹{averageLeadCost} CPL</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="500"
                  step="10"
                  value={averageLeadCost}
                  onChange={(e) => setAverageLeadCost(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>

            {/* Dynamic Charts & Insights */}
            <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-6">
              <h4 className="text-xs font-black uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-emerald-400" /> MRR Projections & Revenue Stream Breakdown</span>
                <span className="text-[10px] text-indigo-400 font-extrabold uppercase font-mono">Series A Deck ready</span>
              </h4>

              {/* Dynamic Revenue Streams List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-black text-slate-300">
                    <span>Subscriptions (B2B)</span>
                    <span className="text-indigo-400">₹{Math.round(monthlySubscriptionRevenue).toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Merchants pay ₹1,499 per hub to secure premium visibility on our marketplace grid.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-black text-slate-300">
                    <span>Featured Listings</span>
                    <span className="text-amber-400">₹{Math.round(monthlyFeaturedPlacementsRevenue).toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Auction bids for placement at the top of city search results.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-black text-slate-300">
                    <span>Lead Gen Bids (CPL)</span>
                    <span className="text-cyan-400">₹{Math.round(monthlyLeadsRevenue).toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed">Brokers and movers purchase hot relocation leads wanting local setups.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex justify-between items-center font-black text-slate-300">
                    <span>Booking Commissions</span>
                    <span className="text-rose-400">₹{Math.round(monthlyCommissionsRevenue).toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed">CityMate retains {averageBookingCommission}% commission of the booking value on completed deals.</p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl sm:col-span-2 space-y-1">
                  <div className="flex justify-between items-center font-black text-slate-300">
                    <span>AI Relocation Assistant Fees</span>
                    <span className="text-purple-400">₹{Math.round(monthlyAIPremiumRevenue).toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 font-medium leading-relaxed">5% conversion of relocating users purchase our AI Buddy premium planner & helper package at ₹499/mo.</p>
                </div>
              </div>

              {/* Dynamic SVG Revenue Visualizer chart */}
              <div className="pt-2">
                <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">
                  <span>Growth Velocity (6-Month Projection)</span>
                  <span>Logarithmic scale</span>
                </div>
                <div className="h-28 w-full bg-slate-900/60 rounded-xl border border-slate-800 p-2 flex items-end justify-between relative">
                  <div className="absolute top-2 left-3 text-[9px] text-slate-500 font-bold">MRR Projection: ₹{(totalMonthlyRecurringRevenue * 3.5).toLocaleString("en-IN", { maximumFractionDigits: 0 })}/mo by Month 6</div>
                  {[1, 1.4, 1.9, 2.5, 3.1, 3.5].map((factor, i) => {
                    const monthMRR = Math.round(totalMonthlyRecurringRevenue * factor);
                    const heightPercent = Math.min(100, Math.max(15, (factor / 3.5) * 85));
                    return (
                      <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                        <div className="text-[8px] font-mono text-emerald-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity absolute mb-14 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">
                          ₹{monthMRR.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                        </div>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-8 bg-gradient-to-t from-indigo-950 via-indigo-600 to-purple-500 rounded-t-md hover:from-purple-500 hover:to-indigo-400 transition-all cursor-pointer relative shadow-[0_0_15px_rgba(124,58,237,0.15)]"
                        />
                        <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-1.5">M{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: REFERRAL HUB */}
      {activeSection === "referrals" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4 text-indigo-400" /> Share Relocation Code
            </h4>
            <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
              Invite friends or co-workers relocating to Bengaluru, Pune, Delhi or Mumbai. Once they book a verified PG/flat, both of you earn premium rewards and free MateCoins!
            </p>

            <div className="space-y-2">
              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Your Private Referral Link</p>
              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 overflow-hidden">
                <input
                  type="text"
                  readOnly
                  value={`https://citymate.in/invite/CM-${currentUser.uid.substring(0, 5).toUpperCase()}`}
                  className="bg-transparent text-xs text-indigo-400 font-mono font-bold px-3 py-2 flex-grow focus:outline-none"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  {referralLinkCopied ? "Copied!" : "Copy Link"}
                </button>
              </div>
            </div>

            <form onSubmit={handleAddReferral} className="space-y-3 pt-3 border-t border-slate-900">
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Send Direct Invite email</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Friend's Name"
                  required
                  value={refName}
                  onChange={(e) => setRefName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold placeholder-slate-600 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Friend's Email"
                  required
                  value={refEmail}
                  onChange={(e) => setRefEmail(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white font-bold placeholder-slate-600 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl border border-slate-800 transition-colors cursor-pointer"
              >
                Send Invite Link (+100 MateCoins)
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider flex justify-between items-center border-b border-slate-800 pb-3">
              <span>Your Referral Registry</span>
              <span className="text-[10px] text-emerald-400 font-extrabold uppercase font-mono">Live Sync Ledger</span>
            </h4>

            <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
              {referrals.map((r) => (
                <div key={r.id} className="p-3 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between text-xs font-semibold gap-4">
                  <div>
                    <p className="text-slate-200 font-extrabold">{r.name}</p>
                    <p className="text-[10px] text-slate-500 font-medium">Invited on {r.date} • {r.email}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border mb-1 ${
                      r.status === "Verified Relocation"
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-500 border-amber-500/20 animate-pulse"
                    }`}>
                      {r.status}
                    </span>
                    <p className="text-[10px] text-slate-400 font-mono font-black">{r.reward}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: LOYALTY ENGINE (MATECOINS) */}
      {activeSection === "loyalty" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="text-[9px] font-black uppercase bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/15">
                CityMate Rewards Network
              </span>
              <h4 className="text-lg font-black uppercase tracking-tight">Your MateCoin Balance</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                MateCoins are gained through onboarding tasks, referring relocating colleagues, and setting up utilities. Trade coins for premium service waivers with B2B merchants.
              </p>
            </div>

            <div className="py-6 border-y border-slate-800 flex items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black shadow-[0_0_20px_rgba(245,158,11,0.25)] animate-bounce">
                M
              </div>
              <div>
                <p className="text-3xl font-mono font-black text-amber-400">{userCoins} MC</p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Ready for Redemptions</p>
              </div>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl text-[10px] text-slate-400 font-medium">
              💡 <strong>Instant Earning Tip:</strong> Link your corporate offer letter on your profile page to gain an instant 500 MC bonus instantly!
            </div>
          </div>

          <div className="lg:col-span-7 bg-slate-950/40 border border-slate-800 p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider border-b border-slate-800 pb-3">
              Available Redeems and Partnerships
            </h4>

            <div className="space-y-3">
              {[
                { id: "rd-1", title: "Free Moving Cardboards (3 Pcs)", provider: "Stanza Movers", cost: 300, icon: Truck, color: "text-blue-400 bg-blue-950/20" },
                { id: "rd-2", title: "1-Week Free Veg Lunch Box Plan", provider: "TiffinMate", cost: 600, icon: Coffee, color: "text-rose-400 bg-rose-950/20" },
                { id: "rd-3", title: "Free Wi-Fi Installation + Router", provider: "GigaFiber", cost: 800, icon: Wifi, color: "text-violet-400 bg-violet-950/20" },
                { id: "rd-4", title: "Modular Study Table Month Waive", provider: "HomeFurnish", cost: 500, icon: Tv, color: "text-amber-400 bg-amber-950/20" }
              ].map((reward) => {
                const RewardIcon = reward.icon;
                const isClaimed = claimedRewards.includes(reward.id);
                const canAfford = userCoins >= reward.cost;
                return (
                  <div key={reward.id} className="p-3.5 bg-slate-900 border border-slate-850 rounded-xl flex items-center justify-between text-xs gap-4 font-semibold">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${reward.color}`}>
                        <RewardIcon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-slate-200 font-extrabold">{reward.title}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Partner: {reward.provider}</p>
                      </div>
                    </div>
                    <div>
                      {isClaimed ? (
                        <span className="text-emerald-400 border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 rounded-lg font-black uppercase text-[10px]">
                          Claimed Code!
                        </span>
                      ) : (
                        <button
                          disabled={!canAfford || isClaiming === reward.id}
                          onClick={() => handleRedeemReward(reward.id, reward.cost, reward.provider)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${
                            canAfford
                              ? "bg-amber-500 text-slate-950 hover:bg-amber-400"
                              : "bg-slate-800 text-slate-500 cursor-not-allowed"
                          }`}
                        >
                          {isClaiming === reward.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            `Claim for ${reward.cost} MC`
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
