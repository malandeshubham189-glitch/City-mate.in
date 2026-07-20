import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { simulatePlan, simulateScam } from "../../fallbackSimulator";
import {
  Sparkles,
  Calculator,
  Compass,
  ArrowRightLeft,
  Zap,
  ShieldAlert,
  ListTodo,
  ThumbsUp,
  MessageSquare,
  BookOpen,
  PhoneCall,
  Package,
  ArrowRight,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldCheck,
  UserCheck,
  MapPin,
  Heart,
  Send,
  Plus,
  TrendingUp,
  ChevronRight,
  Info,
  DollarSign
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

interface AIRelocationSuiteProps {
  currentCity: string;
  darkMode: boolean;
}

// Sub-tabs list
const RELOCATION_TABS = [
  { id: "planner", label: "AI Planner", icon: Sparkles, desc: "Personalized timelines" },
  { id: "calculator", label: "Cost Calculator", icon: Calculator, desc: "Detailed rent & living cost breakdowns" },
  { id: "compare", label: "Smart Area Compare", icon: ArrowRightLeft, desc: "Side-by-side locality specs" },
  { id: "commute", label: "Commute Estimator", icon: Clock, desc: "Transit duration & fare rates" },
  { id: "trust", label: "Trust Score", icon: UserCheck, desc: "Owner verification metrics" },
  { id: "scam", label: "Scam Shield", icon: ShieldAlert, desc: "AI listing fraud analyzer" },
  { id: "checklist", label: "Checklist Tracker", icon: ListTodo, desc: "Interactive task milestones" },
  { id: "recs", label: "Personalized Match", icon: ThumbsUp, desc: "Tailored locality recommendations" },
  { id: "feed", label: "Community Feed", icon: MessageSquare, desc: "Locals, cook matching & buy/sell" },
  { id: "guide", label: "City Guides", icon: BookOpen, desc: "Security deposit norms & local rules" },
  { id: "contacts", label: "Emergency Hub", icon: PhoneCall, desc: "Local helplines & buddy volunteers" },
  { id: "package", label: "1-Click Relocate", icon: Package, desc: "Concierge packers & movers packages" }
];

// Area details for comparison & smart estimation
const LOCALITIES_DATA: { [city: string]: { name: string; safety: number; transit: number; food: number; rent: number; vibe: number; pros: string[]; cons: string[] }[] } = {
  Bengaluru: [
    { name: "Koramangala", safety: 92, transit: 88, food: 96, rent: 85, vibe: 95, pros: ["Incredible startup vibe", "Infinite cafes & eateries", "Excellent PG density"], cons: ["Heavy water logging in heavy rains", "High security deposits", "Traffic choke points"] },
    { name: "HSR Layout", safety: 95, transit: 90, food: 92, rent: 82, vibe: 93, pros: ["Clean layouts & parks", "Excellent start-up hub", "Quiet residential parts"], cons: ["Silk Board junction transit pain", "Rent increases are steep", "Limited metro line access"] },
    { name: "Indiranagar", safety: 90, transit: 94, food: 98, rent: 70, vibe: 98, pros: ["Elite pubs & social scene", "Metro accessibility", "Leafy green streets"], cons: ["Absurdly expensive rents", "Noisy weekend nights", "Severe lack of budget PG spots"] },
    { name: "Whitefield", safety: 88, transit: 82, food: 85, rent: 88, vibe: 80, pros: ["IT park proximity (ITPL)", "Spacious apartment complexes", "Metro connectivity now live"], cons: ["Extremely dusty", "Very far from main city center", "Severe road traffic hours"] },
    { name: "BTM Layout", safety: 85, transit: 92, food: 94, rent: 92, vibe: 85, pros: ["Highly budget-friendly PGs", "Excellent bus transit connectivity", "Huge student crowd"], cons: ["Very crowded streets", "Lacks premium green cover", "Narrow lanes traffic"] }
  ],
  Pune: [
    { name: "Viman Nagar", safety: 96, transit: 94, food: 95, rent: 85, vibe: 94, pros: ["Near airport & Symbiosis college", "Superb youth crowd", "Very safe and clean"], cons: ["Rents are higher than Pune average", "Noisy flight path zone", "Congestion during peak hours"] },
    { name: "Hinjewadi Phase 1", safety: 90, transit: 80, food: 88, rent: 90, vibe: 85, pros: ["Next to primary IT park", "Very cheap room rents", "Great gated societies"], cons: ["Severe traffic on Hinjewadi bridge", "Very far from Pune main city", "Fewer nightlife options"] },
    { name: "Kothrud", safety: 98, transit: 92, food: 94, rent: 88, vibe: 88, pros: ["Rich Maharashtrian culture", "Extremely safe", "Incredible local tiffin/mess choices"], cons: ["Highly traditional deposit rules", "Very high traffic density", "Hard to find multi-cuisine hubs"] },
    { name: "Baner", safety: 93, transit: 88, food: 92, rent: 80, vibe: 92, pros: ["High-end flats & premium streets", "Excellent cafes", "Close to Mumbai highway"], cons: ["Water scarcity in summers", "High security deposits", "Distant from Pune railway station"] }
  ],
  Mumbai: [
    { name: "Andheri West", safety: 92, transit: 96, food: 95, rent: 60, vibe: 96, pros: ["Media hub & lively community", "Superb metro & local rail sync", "Infinite street food"], cons: ["Extremely high rents for tiny spaces", "Severe monsoon water logging", "Insanely crowded transit stations"] },
    { name: "Malad East", safety: 89, transit: 88, food: 85, rent: 80, vibe: 82, pros: ["Relatively affordable PG rents", "IT hubs close in Mindspace", "Western Express Highway access"], cons: ["Heavy rush hour traffic", "Highly congested lanes", "Distant from South Mumbai"] },
    { name: "Powai", safety: 95, transit: 85, food: 92, rent: 70, vibe: 94, pros: ["Elite Hiranandani architecture", "Lakeside views & peace", "Great startup crowd"], cons: ["Lacks direct local train connectivity", "High-budget lifestyle", "Expensive groceries"] },
    { name: "Thane West", safety: 94, transit: 90, food: 88, rent: 85, vibe: 85, pros: ["Very spacious residential complexes", "Excellent mall density", "Good nature & hills around"], cons: ["Long commute to main corporate hubs", "Thane toll naka traffic jam", "Local trains are heavily packed"] }
  ],
  Delhi: [
    { name: "Noida Sector 62", safety: 86, transit: 94, food: 88, rent: 88, vibe: 84, pros: ["Spacious tech parks & colleges", "Blue line metro access", "Affordable modular kitchens & PGs"], cons: ["Quiet streets after late hours", "High pollution levels in winters", "Lacks historical food spots"] },
    { name: "Gurugram Phase 3", safety: 88, transit: 90, food: 94, rent: 75, vibe: 94, pros: ["Directly bordering Cyber City", "Rapid metro network", "Excellent pubs & shopping malls"], cons: ["Expensive utility tariffs", "Severe water clogging in monsoons", "High brokerage market"] },
    { name: "Saket", safety: 92, transit: 95, food: 96, rent: 72, vibe: 92, pros: ["Elite South Delhi location", "Metro accessibility", "Incredible malls & parks"], cons: ["Extremely narrow parking spaces", "Rent pricing is premier", "Old buildings with no elevator"] },
    { name: "Mukherjee Nagar", safety: 85, transit: 88, food: 92, rent: 95, vibe: 82, pros: ["IAS/UPSC study hubs", "Very cheap room rents & library halls", "Excellent street foods"], cons: ["Highly congested", "Old buildings", "Intense student pressure vibe"] }
  ],
  Hyderabad: [
    { name: "Gachibowli", safety: 94, transit: 90, food: 90, rent: 82, vibe: 92, pros: ["Close to all major tech parks", "Wide clean roads", "Modern gated housing complexes"], cons: ["Rents rising rapidly", "Lacks historical food vibe", "Summers are extremely hot"] },
    { name: "Madhapur", safety: 93, transit: 94, food: 95, rent: 80, vibe: 95, pros: ["Heart of IT action & pubs", "Metro connectivity", "Infinite hostels & food stalls"], cons: ["Heavy traffic bottlenecks", "Very high noise levels", "Water reliance on tankers"] }
  ],
  Jaipur: [
    { name: "Mansarovar", safety: 96, transit: 92, food: 90, rent: 92, vibe: 85, pros: ["Asia's largest residential colony", "Metro connectivity", "Extremely spacious & safe"], cons: ["Distant from historical core", "Lacks late night party spots", "Limited IT park presence"] },
    { name: "Malviya Nagar", safety: 95, transit: 94, food: 94, rent: 88, vibe: 90, pros: ["Next to GT Mall & tech institutes", "Very premium residential blocks", "Awesome food hub"], cons: ["High rents for student standards", "Congested main junctions", "Water supply can be erratic"] }
  ]
};

export default function AIRelocationSuite({ currentCity, darkMode }: AIRelocationSuiteProps) {
  const [activeTab, setActiveTab] = useState("planner");

  // State: AI Planner
  const [plannerSetup, setPlannerSetup] = useState({
    destination: "",
    budget: "12000",
    diet: "Vegetarian",
    livingSetup: "Sharing with Flatmates"
  });
  const [plannerResult, setPlannerResult] = useState<any | null>(null);
  const [isPlannerLoading, setIsPlannerLoading] = useState(false);

  // State: Cost Calculator
  const [calcVals, setCalcVals] = useState({
    rent: 12000,
    food: 3500, // Tiffin / Cook / Self
    commute: 2000, // Metro, Auto, Cab
    utilities: 1500, // Wi-Fi, AC, electricity
    lifestyle: 2500 // Leisure, shopping
  });
  const [calcSetup, setCalcSetup] = useState({
    foodType: "tiffin",
    commuteType: "metro",
    acUsage: "moderate"
  });

  // State: Area Comparison
  const [compareAreas, setCompareAreas] = useState({
    area1: "",
    area2: ""
  });

  // State: Commute Time Estimator
  const [commuteSetup, setCommuteSetup] = useState({
    fromLoc: "",
    toLoc: "",
    rushHour: true
  });
  const [commuteResult, setCommuteResult] = useState<any | null>(null);

  // State: Trust Score
  const [trustForm, setTrustForm] = useState({
    ownerName: "Subhash Chandra",
    aadhaarVerified: true,
    utilityBillVerified: false,
    ownerSince: "2024",
    videoWalkthroughs: true,
    reviewsCount: 12,
    avgReviewRating: 4.8
  });

  // State: Scam Analyzer
  const [scamText, setScamText] = useState("");
  const [scamResult, setScamResult] = useState<any | null>(null);
  const [isScamLoading, setIsScamLoading] = useState(false);

  // State: Checklist
  const [checklist, setChecklist] = useState<any[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");

  // State: Personalized Recs
  const [recsQuiz, setRecsQuiz] = useState({
    age: "24",
    profession: "Software Engineer",
    officeLoc: "",
    diet: "Vegetarian",
    socialVibe: "Active Nightlife & Cafes",
    budgetRent: "15000"
  });
  const [recsResult, setRecsResult] = useState<any[] | null>(null);

  // State: Local Community Feed
  const [feedPosts, setFeedPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState({
    category: "flatmates",
    title: "",
    content: ""
  });

  // State: Concierge Relocation packages
  const [selectedPackage, setSelectedPackage] = useState<any | null>(null);
  const [conciergeModalOpen, setConciergeModalOpen] = useState(false);
  const [bookingFormData, setBookingFormData] = useState({
    name: "",
    phone: "",
    addressFrom: "",
    addressTo: "",
    date: ""
  });
  const [orderInvoice, setOrderInvoice] = useState<any | null>(null);

  // -------------------------------------------------------------
  // INITIALIZERS
  // -------------------------------------------------------------
  useEffect(() => {
    // Initialize default localities based on selected city
    const list = LOCALITIES_DATA[currentCity] || LOCALITIES_DATA["Bengaluru"];
    if (list && list.length >= 2) {
      setCompareAreas({
        area1: list[0].name,
        area2: list[1].name
      });
      setCommuteSetup({
        fromLoc: list[0].name,
        toLoc: list[4] ? list[4].name : list[1].name,
        rushHour: true
      });
      setRecsQuiz(prev => ({ ...prev, officeLoc: list[3] ? list[3].name : list[1].name }));
    }

    // Load or set default checklist
    const savedChecklist = localStorage.getItem(`citymate_checklist_${currentCity}`);
    if (savedChecklist) {
      setChecklist(JSON.parse(savedChecklist));
    } else {
      const defaultChecklist = [
        { id: "cl1", category: "pre", task: "Shortlist verified PGs or flats on CityMate", done: false },
        { id: "cl2", category: "pre", task: "Submit Aadhaar KYC on Seeker profile", done: false },
        { id: "cl3", category: "pre", task: "Book Concierge Packers & Movers slot", done: false },
        { id: "cl4", category: "pre", task: "Get gas connection cylinder / induction setup ready", done: false },
        { id: "cl5", category: "mid", task: "Confirm physical walkthrough with owner before transferring money", done: false },
        { id: "cl6", category: "mid", task: "Take photos/videos of flat rooms during move-in", done: false },
        { id: "cl7", category: "mid", task: "Verify direct meter electricity reading with landlord", done: false },
        { id: "cl8", category: "post", task: "Register local Wi-Fi provider connection", done: false },
        { id: "cl9", category: "post", task: "Subscribe to regional Tiffin/Mess delivery", done: false },
        { id: "cl10", category: "post", task: "Buy/rent second-hand study table & chair from community feed", done: false }
      ];
      setChecklist(defaultChecklist);
      localStorage.setItem(`citymate_checklist_${currentCity}`, JSON.stringify(defaultChecklist));
    }

    // Load custom community feed default state
    const defaultPosts = [
      {
        id: "post1",
        author: "Karan Johar",
        role: "Renter at HSR Sector 3",
        avatar: "K",
        category: "flatmates",
        title: "Urgent: 1 Room available in 3BHK flat",
        content: "Need 1 chill flatmate to share a luxurious semi-furnished 3BHK in HSR Layout Sector 3. Rent is ₹12,500. Gym, high-speed Wi-Fi, and modular kitchen fully set up. Drop me a line!",
        likes: 18,
        liked: false,
        comments: [
          { author: "Deepak", content: "Is it pure veg or non-veg allowed?" },
          { author: "Karan", content: "No food restrictions, super chill flatmates!" }
        ],
        timestamp: "2 hours ago"
      },
      {
        id: "post2",
        author: "Ananya Panday",
        role: "Student at Symbiosis",
        avatar: "A",
        category: "cooks",
        title: "Recommended Home-Cook: Shanti Tai (Viman Nagar)",
        content: "Shanti Tai has been cooking amazing Maharashtrian and North Indian food for us for 6 months. Extremely hygienic, punctual, and budget-friendly (charges ₹2,500/month for 3 people, twice a day). Highly recommended!",
        likes: 32,
        liked: false,
        comments: [
          { author: "Sneha", content: "Does she cover Clover Park area?" },
          { author: "Ananya", content: "Yes! She travels all around Symbiosis circle." }
        ],
        timestamp: "5 hours ago"
      },
      {
        id: "post3",
        author: "Vikram Seth",
        role: "Renter at Powai",
        avatar: "V",
        category: "buysell",
        title: "Selling study table + ergonomic office chair",
        content: "Moving out of Mumbai. Selling my premium Wakefit study desk and adjustable lumbar support ergonomic office chair. Both in pristine condition (used 8 months). Bundle price: ₹4,500. Pick up from Powai.",
        likes: 9,
        liked: false,
        comments: [],
        timestamp: "Yesterday"
      }
    ];
    setFeedPosts(defaultPosts);
  }, [currentCity]);

  // Handle calculator adjustments based on selections
  useEffect(() => {
    let foodCost = 3500;
    if (calcSetup.foodType === "self") foodCost = 2000;
    else if (calcSetup.foodType === "cook") foodCost = 5000;
    else if (calcSetup.foodType === "restaurants") foodCost = 8500;

    let travelCost = 2000;
    if (calcSetup.commuteType === "bus") travelCost = 900;
    else if (calcSetup.commuteType === "cab") travelCost = 9500;
    else if (calcSetup.commuteType === "auto") travelCost = 4500;

    let utilityCost = 1500;
    if (calcSetup.acUsage === "high") utilityCost = 3500;
    else if (calcSetup.acUsage === "none") utilityCost = 800;

    setCalcVals(prev => ({
      ...prev,
      food: foodCost,
      commute: travelCost,
      utilities: utilityCost
    }));
  }, [calcSetup]);

  // -------------------------------------------------------------
  // API INTEGRATIONS & HANDLERS
  // -------------------------------------------------------------
  const handleGenerateAITimeline = async () => {
    setIsPlannerLoading(true);
    setPlannerResult(null);
    try {
      const res = await fetch("/api/relocation/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentCity,
          budget: plannerSetup.budget,
          diet: plannerSetup.diet,
          livingSetup: plannerSetup.livingSetup,
          destination: plannerSetup.destination
        })
      });
      if (res.ok) {
        const data = await res.json();
        setPlannerResult(data);
      } else {
        throw new Error("Timeline generation error");
      }
    } catch (err) {
      console.warn("[Vercel Connection Warn] Planner API failed. Running client-side simulation fallback:", err);
      try {
        const data = simulatePlan({
          currentCity,
          budget: plannerSetup.budget,
          diet: plannerSetup.diet,
          livingSetup: plannerSetup.livingSetup,
          destination: plannerSetup.destination
        });
        setPlannerResult(data);
      } catch (fallbackErr) {
        console.error("Fallback planner simulation failed:", fallbackErr);
        alert("Encountered connection traffic. Generating high-fidelity visual plan.");
      }
    } finally {
      setIsPlannerLoading(false);
    }
  };

  const handleAnalyzeScam = async () => {
    if (!scamText.trim()) return;
    setIsScamLoading(true);
    setScamResult(null);
    try {
      const res = await fetch("/api/scam-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: scamText })
      });
      if (res.ok) {
        const data = await res.json();
        setScamResult(data);
      } else {
        throw new Error("Scam analysis failed");
      }
    } catch (err) {
      console.warn("[Vercel Connection Warn] Scam Analyzer API failed. Running client-side simulation fallback:", err);
      try {
        const data = simulateScam(scamText);
        setScamResult(data);
      } catch (fallbackErr) {
        console.error("Fallback scam simulation failed:", fallbackErr);
        alert("Error calculating security telemetry.");
      }
    } finally {
      setIsScamLoading(false);
    }
  };

  const runPersonalizedRecQuiz = () => {
    const list = LOCALITIES_DATA[currentCity] || LOCALITIES_DATA["Bengaluru"];
    const matches = list.map(item => {
      let score = 70;
      // Budget matching
      const targetBudget = parseInt(recsQuiz.budgetRent);
      const isAffordable = item.rent >= 85 ? targetBudget < 12000 : targetBudget >= 12000;
      if (isAffordable) score += 15;
      
      // Social matching
      if (recsQuiz.socialVibe.includes("Nightlife") && item.vibe >= 90) score += 15;
      if (recsQuiz.socialVibe.includes("Quiet") && item.vibe < 90) score += 15;

      return {
        ...item,
        score: Math.min(score + Math.floor(Math.random() * 10), 99)
      };
    }).sort((a, b) => b.score - a.score);

    setRecsResult(matches);
  };

  const calculateCommuteEstimator = () => {
    const fromLoc = commuteSetup.fromLoc;
    const toLoc = commuteSetup.toLoc;
    const isRush = commuteSetup.rushHour;

    // Simulate commute based on area comparison data
    const distance = Math.floor(Math.random() * 12) + 4; // 4 to 16 km
    const baseTime = distance * 2.5; // minutes
    const rushMultiplier = isRush ? 2.2 : 1.1;

    setCommuteResult({
      distance: `${distance} km`,
      durationMetro: `${Math.round(distance * 2)} mins`,
      durationCab: `${Math.round(baseTime * rushMultiplier)} mins`,
      durationBike: `${Math.round(baseTime * 1.2)} mins`,
      costMetro: `₹${distance * 4}`,
      costCab: `₹${Math.round(distance * 22)}`,
      costBike: `₹${Math.round(distance * 10)}`,
      crowdIndex: isRush ? "Extremely High (Peak)" : "Moderate",
      tip: `Namma Metro (or City Transit) is the absolute fastest escape from ${fromLoc} to ${toLoc} during peak rush. Avoid car cabs on flyovers!`
    });
  };

  // -------------------------------------------------------------
  // LOCAL STATE UPDATES
  // -------------------------------------------------------------
  const toggleChecklist = (id: string) => {
    const updated = checklist.map(item =>
      item.id === id ? { ...item, done: !item.done } : item
    );
    setChecklist(updated);
    localStorage.setItem(`citymate_checklist_${currentCity}`, JSON.stringify(updated));
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    const newItem = {
      id: Math.random().toString(),
      category: "custom",
      task: newChecklistItem.trim(),
      done: false
    };
    const updated = [...checklist, newItem];
    setChecklist(updated);
    setNewChecklistItem("");
    localStorage.setItem(`citymate_checklist_${currentCity}`, JSON.stringify(updated));
  };

  const removeChecklistItem = (id: string) => {
    const updated = checklist.filter(item => item.id !== id);
    setChecklist(updated);
    localStorage.setItem(`citymate_checklist_${currentCity}`, JSON.stringify(updated));
  };

  const handleLikePost = (postId: string) => {
    setFeedPosts(prev =>
      prev.map(p => {
        if (p.id === postId) {
          return {
            ...p,
            likes: p.liked ? p.likes - 1 : p.likes + 1,
            liked: !p.liked
          };
        }
        return p;
      })
    );
  };

  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    const post = {
      id: Math.random().toString(),
      author: "Guest Seeker",
      role: "Relocating to " + currentCity,
      avatar: "G",
      category: newPost.category,
      title: newPost.title,
      content: newPost.content,
      likes: 0,
      liked: false,
      comments: [],
      timestamp: "Just now"
    };

    setFeedPosts(prev => [post, ...prev]);
    setNewPost({ category: "flatmates", title: "", content: "" });
    alert("Post published live on local CityMate community wall!");
  };

  const handleBookPackage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingFormData.name || !bookingFormData.phone || !bookingFormData.date) {
      alert("Please fill in the required fields to verify your slot.");
      return;
    }

    const orderNo = "CM-" + Math.floor(100000 + Math.random() * 900000);
    setOrderInvoice({
      orderNo,
      packageName: selectedPackage.title,
      price: selectedPackage.price,
      date: bookingFormData.date,
      clientName: bookingFormData.name,
      phone: bookingFormData.phone,
      addressFrom: bookingFormData.addressFrom || "Current Location",
      addressTo: bookingFormData.addressTo || `Assigned home in ${currentCity}`,
      status: "Confirmed ✓"
    });
    setConciergeModalOpen(false);
  };

  // Calculations for Trust Score Level
  const calculateTrustScore = () => {
    let score = 20; // baseline
    if (trustForm.aadhaarVerified) score += 40;
    if (trustForm.utilityBillVerified) score += 20;
    if (trustForm.videoWalkthroughs) score += 20;
    return score;
  };

  // Recharts Pie Chart Data for Cost Calculator
  const pieData = [
    { name: "Rent Accommodation", value: calcVals.rent, color: "#6366f1" },
    { name: "Food & Meals", value: calcVals.food, color: "#a855f7" },
    { name: "Daily Commute", value: calcVals.commute, color: "#14b8a6" },
    { name: "Utilities & WiFi", value: calcVals.utilities, color: "#f43f5e" },
    { name: "Lifestyle & Leisure", value: calcVals.lifestyle, color: "#eab308" }
  ];

  const totalCostCombined = calcVals.rent + calcVals.food + calcVals.commute + calcVals.utilities + calcVals.lifestyle;

  return (
    <section className={`rounded-3xl border p-6 md:p-8 space-y-8 shadow-2xl transition-all duration-500 relative overflow-hidden ${
      darkMode
        ? "bg-slate-950/40 border-slate-800/80 shadow-black/40 neon-border-glow-indigo"
        : "bg-white/90 border-slate-200/80 shadow-slate-200/40"
    }`} id="ai-relocation-suite-root">
      
      {/* Glow Effects */}
      <div className="absolute top-0 left-10 h-72 w-72 rounded-full bg-brand-indigo/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-10 h-72 w-72 rounded-full bg-brand-violet/10 blur-3xl pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1 text-left">
          <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border ${
            darkMode ? "bg-purple-950/50 text-purple-400 border-purple-500/30" : "bg-indigo-50 text-brand-indigo border-indigo-100"
          }`}>
            <Sparkles className="h-3.5 w-3.5 animate-pulse" /> India's First AI-Powered Engine
          </div>
          <h2 className={`text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
            AI Relocation Command Center
          </h2>
          <p className={`text-xs ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
            Solve real-world moving bottlenecks in <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-indigo to-brand-violet">{currentCity}</span> with our unified toolset.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black px-3.5 py-1.5 rounded-xl border ${
            darkMode ? "bg-slate-900 border-slate-800 text-slate-300" : "bg-slate-50 border-slate-200 text-slate-700"
          }`}>
            Target: {currentCity}
          </span>
        </div>
      </div>

      {/* Grid Layout: Navigation Tabs Left/Top, Tool Area Right */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Side Tab bar for quick selector */}
        <div className="lg:col-span-3 space-y-2 flex flex-wrap lg:flex-col gap-1.5 lg:border-r border-slate-200/20 lg:pr-4">
          {RELOCATION_TABS.map((tab) => {
            const Icon = tab.icon;
            const isAct = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full text-left flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  isAct
                    ? darkMode
                      ? "bg-gradient-to-r from-brand-indigo to-brand-violet text-white shadow-lg shadow-purple-900/20 border border-purple-500/30"
                      : "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : darkMode
                      ? "text-slate-400 hover:text-white hover:bg-slate-900/60"
                      : "text-slate-600 hover:text-slate-950 hover:bg-slate-50"
                }`}
                id={`tab-trigger-${tab.id}`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isAct ? "text-white animate-pulse" : ""}`} />
                <div className="truncate">
                  <p className="leading-none">{tab.label}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right side Container: Interactive Content Area */}
        <div className="lg:col-span-9 rounded-2xl p-5 border min-h-[460px] flex flex-col justify-between transition-all ${
          darkMode 
            ? 'bg-slate-950/70 border-slate-800/80 text-white shadow-inner' 
            : 'bg-slate-50/60 border-slate-200/80 text-slate-800'
        }">
          <AnimatePresence mode="wait">
            
            {/* 1. AI PLANNER */}
            {activeTab === "planner" && (
              <motion.div
                key="planner"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <Sparkles className="h-5 w-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">AI Relocation Planner</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Generates detailed transition roadmap & checklist milestones</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Commute Destination</label>
                    <input
                      type="text"
                      value={plannerSetup.destination}
                      onChange={(e) => setPlannerSetup(prev => ({ ...prev, destination: e.target.value }))}
                      placeholder="e.g. ITPL, Symbiosis campus, Cyber City"
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Accommodation Budget Limit</label>
                    <select
                      value={plannerSetup.budget}
                      onChange={(e) => setPlannerSetup(prev => ({ ...prev, budget: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="8000">₹6,000 - ₹9,000 / month</option>
                      <option value="15000">₹10,000 - ₹15,000 / month</option>
                      <option value="25000">₹15,000 - ₹25,000 / month</option>
                      <option value="50000">₹25,000+ / month</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dietary Preferences</label>
                    <select
                      value={plannerSetup.diet}
                      onChange={(e) => setPlannerSetup(prev => ({ ...prev, diet: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="Vegetarian">Pure Veg (Prefers veg mess/tiffin)</option>
                      <option value="Eggetarian">Eggetarian</option>
                      <option value="Non-Vegetarian">No Food Restrictions</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Living Setup Mode</label>
                    <select
                      value={plannerSetup.livingSetup}
                      onChange={(e) => setPlannerSetup(prev => ({ ...prev, livingSetup: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="Alone / Studio">Single Room / Studio Flat</option>
                      <option value="Sharing with Flatmates">Shared Occupancy PG / Roommates</option>
                      <option value="Family Move">Moving with Family (Needs full 2/3BHK)</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleGenerateAITimeline}
                  disabled={isPlannerLoading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-indigo to-brand-violet text-white text-xs font-black py-3 transition-transform hover:scale-[1.02] active:scale-95 cursor-pointer disabled:opacity-50"
                  id="generate-planner-btn"
                >
                  {isPlannerLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Synchronizing relocation timeline nodes...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      <span>Formulate Relocation Plan</span>
                    </>
                  )}
                </button>

                {/* Planner Result Renders */}
                {plannerResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`p-4 rounded-xl border space-y-4 ${
                      darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-xs font-black text-purple-400">
                      <CheckCircle className="h-4.5 w-4.5" />
                      <span>AI Relocation Plan for {currentCity} Generated!</span>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Milestone Timeline</p>
                      <div className="border-l border-indigo-500/30 ml-2 space-y-4">
                        {plannerResult.timeline?.map((step: any, idx: number) => (
                          <div key={idx} className="relative pl-6">
                            <div className="absolute left-[-5px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-indigo" />
                            <span className="text-[10px] font-black text-brand-indigo uppercase block">{step.time}</span>
                            <ul className="list-disc list-inside text-xs mt-1 space-y-1 text-slate-300 font-semibold">
                              {step.tasks?.map((t: string, i: number) => (
                                <li key={i}>{t}</li>
                              ))}
                            </ul>
                            <p className="text-[10px] text-slate-400 italic mt-1 font-medium bg-slate-900/40 p-2 rounded-lg border border-slate-800/20">
                              💡 {step.tips}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100/10">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Top Recommended Area Hubs</span>
                        <div className="flex flex-wrap gap-1.5">
                          {plannerResult.neighborhoods?.map((n: string) => (
                            <span key={n} className="text-[10px] font-black bg-indigo-950/40 text-indigo-300 border border-indigo-500/20 px-2 py-1 rounded-md">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estimated Monthly Budget Tips</span>
                        <ul className="list-disc list-inside text-[10px] font-semibold text-slate-300 space-y-0.5">
                          {plannerResult.budgetTips?.map((bt: string, i: number) => (
                            <li key={i}>{bt}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 2. COST CALCULATOR */}
            {activeTab === "calculator" && (
              <motion.div
                key="calculator"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <Calculator className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Monthly Living Cost Calculator</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Calculates comprehensive expense matrix & chart analysis for Indian metros</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                  
                  {/* Sliders Input */}
                  <div className="md:col-span-6 space-y-4">
                    {/* Accommodation Sliders */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Monthly Room/PG Rent</label>
                        <span className="text-xs font-black text-indigo-400">₹{calcVals.rent.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="4000"
                        max="40000"
                        step="500"
                        value={calcVals.rent}
                        onChange={(e) => setCalcVals(prev => ({ ...prev, rent: parseInt(e.target.value) }))}
                        className="w-full accent-indigo-500 cursor-pointer"
                      />
                    </div>

                    {/* Food Setup selector to drive slider values */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Food & Dining Plan</label>
                      <select
                        value={calcSetup.foodType}
                        onChange={(e) => setCalcSetup(prev => ({ ...prev, foodType: e.target.value }))}
                        className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="tiffin">Tiffin Delivery subscription (₹3,500/mo)</option>
                        <option value="self">Cooking ourselves / Grocery (₹2,000/mo)</option>
                        <option value="cook">Hire Dedicated Cook (₹5,000/mo)</option>
                        <option value="restaurants">Eating out / Ordering online (₹8,500/mo)</option>
                      </select>
                    </div>

                    {/* Commute setup selector */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Daily Commute Mode</label>
                      <select
                        value={calcSetup.commuteType}
                        onChange={(e) => setCalcSetup(prev => ({ ...prev, commuteType: e.target.value }))}
                        className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="metro">Local Metro Travel (₹900 - ₹2,000/mo)</option>
                        <option value="bus">Local buses (₹500 - ₹900/mo)</option>
                        <option value="auto">Shared Auto / Two Wheeler (₹2,500 - ₹4,500/mo)</option>
                        <option value="cab">On-demand Cabs (₹8,000 - ₹12,000/mo)</option>
                      </select>
                    </div>

                    {/* AC Usage Slider */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">AC / Utility Consumption</label>
                      <select
                        value={calcSetup.acUsage}
                        onChange={(e) => setCalcSetup(prev => ({ ...prev, acUsage: e.target.value }))}
                        className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="moderate">Moderate (Standard Wi-Fi + Basic AC, ₹1,500/mo)</option>
                        <option value="high">Heavy (24/7 AC usage in summers, ₹3,500/mo)</option>
                        <option value="none">Eco / Non-AC (Only Wi-Fi + fan, ₹800/mo)</option>
                      </select>
                    </div>

                    {/* Lifestyle Expense Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-baseline">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Lifestyle & Entertainment</label>
                        <span className="text-xs font-black text-teal-400">₹{calcVals.lifestyle.toLocaleString()}</span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="15000"
                        step="500"
                        value={calcVals.lifestyle}
                        onChange={(e) => setCalcVals(prev => ({ ...prev, lifestyle: parseInt(e.target.value) }))}
                        className="w-full accent-teal-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Recharts Pie Chart Display & Totals */}
                  <div className="md:col-span-6 flex flex-col items-center justify-center p-4 rounded-xl border border-slate-100/10 bg-slate-900/30">
                    <ResponsiveContainer width="100%" height={210}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Grand Total display */}
                    <div className="text-center mt-3">
                      <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Grand Total Living Cost</p>
                      <h4 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                        ₹{totalCostCombined.toLocaleString()} <span className="text-xs font-bold text-slate-400">/ month</span>
                      </h4>
                      <p className="text-[9px] text-slate-500 font-semibold leading-none mt-1">
                        Average starting salary needed: ₹{(totalCostCombined * 2.5).toLocaleString()} /mo (in-hand)
                      </p>
                    </div>

                    {/* Legend block */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-4 text-[9px] font-extrabold w-full text-slate-300">
                      {pieData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className="h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                          <span className="truncate">{d.name}: ₹{d.value.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* 3. SMART AREA COMPARISON */}
            {activeTab === "compare" && (
              <motion.div
                key="compare"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <ArrowRightLeft className="h-5 w-5 text-purple-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Smart Area Comparison</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Compares Safety, Transit connectivity, and average PG rents side-by-side</p>
                  </div>
                </div>

                {/* Dropdowns to select localities */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locality A</label>
                    <select
                      value={compareAreas.area1}
                      onChange={(e) => setCompareAreas(prev => ({ ...prev, area1: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      {(LOCALITIES_DATA[currentCity] || LOCALITIES_DATA["Bengaluru"]).map(l => (
                        <option key={l.name} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locality B</label>
                    <select
                      value={compareAreas.area2}
                      onChange={(e) => setCompareAreas(prev => ({ ...prev, area2: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      {(LOCALITIES_DATA[currentCity] || LOCALITIES_DATA["Bengaluru"]).map(l => (
                        <option key={l.name} value={l.name} disabled={l.name === compareAreas.area1}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* side-by-side score metric cards */}
                {(() => {
                  const list = LOCALITIES_DATA[currentCity] || LOCALITIES_DATA["Bengaluru"];
                  const locA = list.find(l => l.name === compareAreas.area1) || list[0];
                  const locB = list.find(l => l.name === compareAreas.area2) || list[1];

                  if (!locA || !locB) return null;

                  return (
                    <div className="space-y-6 pt-2">
                      <div className="grid grid-cols-2 gap-6">
                        {/* Area A specifications */}
                        <div className={`p-4 rounded-xl border space-y-4 text-left ${
                          darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                        }`}>
                          <h4 className="text-sm font-black text-indigo-400">{locA.name}</h4>
                          <div className="space-y-2 text-xs">
                            {[
                              { label: "Safety Index", val: locA.safety },
                              { label: "Transit Network", val: locA.transit },
                              { label: "Food & Cafe Density", val: locA.food },
                              { label: "Affordable Rent Scale", val: locA.rent },
                              { label: "Social Vibe", val: locA.vibe }
                            ].map((s, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between font-bold text-[10px] text-slate-400">
                                  <span>{s.label}</span>
                                  <span>{s.val}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-500" style={{ width: `${s.val}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <div className="space-y-2 border-t border-slate-100/10 pt-3">
                            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Pros</span>
                            <ul className="list-disc list-inside text-[10px] font-bold text-slate-300 space-y-0.5">
                              {locA.pros.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                          <div className="space-y-2 border-t border-slate-100/10 pt-3">
                            <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider">Cons</span>
                            <ul className="list-disc list-inside text-[10px] font-bold text-slate-300 space-y-0.5">
                              {locA.cons.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        </div>

                        {/* Area B specifications */}
                        <div className={`p-4 rounded-xl border space-y-4 text-left ${
                          darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                        }`}>
                          <h4 className="text-sm font-black text-purple-400">{locB.name}</h4>
                          <div className="space-y-2 text-xs">
                            {[
                              { label: "Safety Index", val: locB.safety },
                              { label: "Transit Network", val: locB.transit },
                              { label: "Food & Cafe Density", val: locB.food },
                              { label: "Affordable Rent Scale", val: locB.rent },
                              { label: "Social Vibe", val: locB.vibe }
                            ].map((s, i) => (
                              <div key={i} className="space-y-1">
                                <div className="flex justify-between font-bold text-[10px] text-slate-400">
                                  <span>{s.label}</span>
                                  <span>{s.val}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500" style={{ width: `${s.val}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-2 border-t border-slate-100/10 pt-3">
                            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider">Pros</span>
                            <ul className="list-disc list-inside text-[10px] font-bold text-slate-300 space-y-0.5">
                              {locB.pros.map((p, i) => <li key={i}>{p}</li>)}
                            </ul>
                          </div>
                          <div className="space-y-2 border-t border-slate-100/10 pt-3">
                            <span className="text-[9px] font-black uppercase text-rose-400 tracking-wider">Cons</span>
                            <ul className="list-disc list-inside text-[10px] font-bold text-slate-300 space-y-0.5">
                              {locB.cons.map((c, i) => <li key={i}>{c}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Verdict panel */}
                      <div className="p-4 rounded-xl border border-teal-500/20 bg-teal-950/20 text-xs font-bold text-slate-300 text-left">
                        ⭐ <span className="text-teal-400">Verdict Recommendation:</span> Choose <span className="text-white font-black">{locA.safety > locB.safety ? locA.name : locB.name}</span> for superior safety standards and family-level security, but opt for <span className="text-white font-black">{locA.rent > locB.rent ? locA.name : locB.name}</span> if optimizing monthly rental budgets.
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* 4. COMMUTE ESTIMATOR */}
            {activeTab === "commute" && (
              <motion.div
                key="commute"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <Clock className="h-5 w-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Daily Commute Time Estimator</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Calculates peak rush-hour vs off-peak transit times & fare budgets</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">From Locality (Residence)</label>
                    <select
                      value={commuteSetup.fromLoc}
                      onChange={(e) => setCommuteSetup(prev => ({ ...prev, fromLoc: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      {(LOCALITIES_DATA[currentCity] || LOCALITIES_DATA["Bengaluru"]).map(l => (
                        <option key={l.name} value={l.name}>{l.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">To Locality (Office/College Hub)</label>
                    <select
                      value={commuteSetup.toLoc}
                      onChange={(e) => setCommuteSetup(prev => ({ ...prev, toLoc: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      {(LOCALITIES_DATA[currentCity] || LOCALITIES_DATA["Bengaluru"]).map(l => (
                        <option key={l.name} value={l.name} disabled={l.name === commuteSetup.fromLoc}>{l.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={commuteSetup.rushHour}
                      onChange={(e) => setCommuteSetup(prev => ({ ...prev, rushHour: e.target.checked }))}
                      className="h-4 w-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300"
                    />
                    <span className="text-xs font-bold">Incorporate Peak Office Rush Hour Traffic (9 AM / 6 PM)</span>
                  </label>

                  <button
                    onClick={calculateCommuteEstimator}
                    className="rounded-xl px-5 py-2.5 bg-teal-600 text-white text-xs font-black transition-all hover:bg-teal-500 hover:scale-105 active:scale-95 cursor-pointer"
                    id="calculate-commute-btn"
                  >
                    Estimate Commute Time
                  </button>
                </div>

                {commuteResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`p-4 rounded-xl border space-y-4 ${
                      darkMode ? "bg-slate-900/60 border-slate-800" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-slate-400 uppercase tracking-wider">Commute Overview</span>
                      <span className="text-teal-400">Direct Distance: {commuteResult.distance}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* Metro card */}
                      <div className="p-3 rounded-lg border border-teal-500/20 bg-teal-950/10 text-center">
                        <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest block">Local Metro</span>
                        <p className="text-xl font-black mt-1 text-white">{commuteResult.durationMetro}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Approx. Fare: {commuteResult.costMetro}</p>
                      </div>

                      {/* Cab card */}
                      <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-950/10 text-center">
                        <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest block">Sedan/Auto Cab</span>
                        <p className="text-xl font-black mt-1 text-white">{commuteResult.durationCab}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Approx. Fare: {commuteResult.costCab}</p>
                      </div>

                      {/* Bike taxi card */}
                      <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-950/10 text-center">
                        <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block">Bike-Taxi / Scooter</span>
                        <p className="text-xl font-black mt-1 text-white">{commuteResult.durationBike}</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-0.5">Approx. Fare: {commuteResult.costBike}</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800/40 text-[10px] text-slate-300 font-semibold leading-normal">
                      💡 <span className="text-teal-400 font-black">Pro Commuter advice:</span> {commuteResult.tip}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 5. VERIFIED OWNER TRUST SCORE */}
            {activeTab === "trust" && (
              <motion.div
                key="trust"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <UserCheck className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Verified Owner Trust Score Meter</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Vets and calculates trust indexes of co-living operators and flat owners</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                  <div className="sm:col-span-7 space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Owner / Landlord Name</label>
                      <input
                        type="text"
                        value={trustForm.ownerName}
                        onChange={(e) => setTrustForm(prev => ({ ...prev, ownerName: e.target.value }))}
                        className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    <div className="space-y-2 text-xs font-bold">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">Verify Trust Criteria</p>
                      
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trustForm.aadhaarVerified}
                          onChange={(e) => setTrustForm(prev => ({ ...prev, aadhaarVerified: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div>
                          <span>Government ID (Aadhaar/PAN) KYC verification</span>
                          <p className="text-[9px] text-slate-500 font-medium">Adds +40 points. Confirmed directly via Digilocker.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trustForm.utilityBillVerified}
                          onChange={(e) => setTrustForm(prev => ({ ...prev, utilityBillVerified: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div>
                          <span>Utility Bill / Land registry check</span>
                          <p className="text-[9px] text-slate-500 font-medium">Adds +20 points. Authenticates the owner actually owns the property.</p>
                        </div>
                      </label>

                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={trustForm.videoWalkthroughs}
                          onChange={(e) => setTrustForm(prev => ({ ...prev, videoWalkthroughs: e.target.checked }))}
                          className="mt-0.5 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div>
                          <span>Certified on-site video tour uploaded</span>
                          <p className="text-[9px] text-slate-500 font-medium">Adds +20 points. Protects against fake photo catalog listings.</p>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="sm:col-span-5 flex flex-col items-center justify-center p-6 rounded-xl border border-slate-100/10 bg-slate-900/30 text-center">
                    <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-indigo-500/20">
                      {/* Trust Index Number */}
                      <div className="text-center">
                        <span className="text-3xl font-black text-white">{calculateTrustScore()}/100</span>
                        <p className="text-[8px] font-black uppercase text-slate-400">Score Rating</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${
                        calculateTrustScore() >= 80
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30"
                          : calculateTrustScore() >= 50
                            ? "bg-amber-950/40 text-amber-400 border border-amber-500/30"
                            : "bg-rose-950/40 text-rose-400 border border-rose-500/30"
                      }`}>
                        <ShieldCheck className="h-3.5 w-3.5" />
                        {calculateTrustScore() >= 80 ? "Platinum Partner" : calculateTrustScore() >= 50 ? "Gold Certified" : "Basic Provider"}
                      </span>

                      <p className="text-[9px] text-slate-400 mt-2 font-medium leading-relaxed">
                        Owner: <span className="text-white font-bold">{trustForm.ownerName}</span><br />
                        {calculateTrustScore() >= 80 
                          ? "Recommended for direct deposits. Low scam probability." 
                          : "Requires additional physical checks. Only pay token money at flat."}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 6. SCAM SHIELD */}
            {activeTab === "scam" && (
              <motion.div
                key="scam"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <ShieldAlert className="h-5 w-5 text-rose-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">CityMate AI Scam Shield</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Scans chat transcripts, terms, or descriptions for rental fraud red flags</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paste WhatsApp Conversation, Listing copy, or terms:</label>
                  <textarea
                    value={scamText}
                    onChange={(e) => setScamText(e.target.value)}
                    placeholder="e.g. 'He says he is an army officer posted in Rajasthan. Wants me to pay a ₹5,000 gate pass fee over GPay to get the entry permit code to visit the flat...'"
                    className={`w-full h-24 rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-slate-500 font-medium">Analyzes Defense excuses, pre-visit fees, WhatsApp constraints, or lock pretexts.</span>
                    <button
                      onClick={handleAnalyzeScam}
                      disabled={isScamLoading || !scamText.trim()}
                      className="rounded-xl px-4 py-2 bg-rose-600 text-white text-xs font-black transition-all hover:bg-rose-500 cursor-pointer disabled:opacity-40"
                    >
                      {isScamLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Run Scam Shield Audit"}
                    </button>
                  </div>
                </div>

                {scamResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className={`p-4 rounded-xl border space-y-4 ${
                      scamResult.scamScore >= 60
                        ? "border-rose-500/30 bg-rose-950/10"
                        : "border-teal-500/30 bg-teal-950/10"
                    }`}
                  >
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-black uppercase tracking-wider text-slate-300">Fraud Score Assessment</span>
                      <span className={`text-sm font-black uppercase ${
                        scamResult.scamScore >= 60 ? "text-rose-400" : "text-teal-400"
                      }`}>
                        Scam Risk: {scamResult.scamScore}% ({scamResult.riskLevel})
                      </span>
                    </div>

                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${
                        scamResult.scamScore >= 60 ? "bg-rose-500" : "bg-teal-500"
                      }`} style={{ width: `${scamResult.scamScore}%` }} />
                    </div>

                    <p className="text-xs font-bold text-slate-200 leading-relaxed">
                      📢 <span className="font-black text-rose-400">Verdict:</span> {scamResult.verdict}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100/10 text-xs">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Identified Red Flags</span>
                        <ul className="list-disc list-inside text-[10px] font-bold text-rose-300 space-y-0.5">
                          {scamResult.indicators?.map((ind: string, i: number) => <li key={i}>{ind}</li>)}
                        </ul>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Safety Action Plan</span>
                        <ul className="list-disc list-inside text-[10px] font-bold text-teal-300 space-y-0.5">
                          {scamResult.advice?.map((adv: string, i: number) => <li key={i}>{adv}</li>)}
                        </ul>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 7. CHECKLIST */}
            {activeTab === "checklist" && (
              <motion.div
                key="checklist"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <ListTodo className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Relocation Checklist Tracker</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Track moving tasks & customized settling-in goals. Saved locally.</p>
                  </div>
                </div>

                {/* Progress bar */}
                {(() => {
                  const doneCount = checklist.filter(c => c.done).length;
                  const total = checklist.length;
                  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;
                  return (
                    <div className="space-y-1">
                      <div className="flex justify-between items-baseline text-[10px] font-black text-slate-400">
                        <span>Milestone Progress</span>
                        <span>{doneCount}/{total} Tasks Completed ({percent}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  );
                })()}

                {/* Checklist Categories: Pre-move, Move day, Settled */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {[
                    { cat: "pre", label: "Preparation Timeline (3 Weeks out)" },
                    { cat: "mid", label: "Moving Week & Arrival D-Day" },
                    { cat: "post", label: "Settling In (First 15 Days)" },
                    { cat: "custom", label: "Your Custom Goals" }
                  ].map((catObj) => {
                    const items = checklist.filter(i => i.category === catObj.cat);
                    if (items.length === 0) return null;
                    return (
                      <div key={catObj.cat} className="space-y-2">
                        <h4 className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">{catObj.label}</h4>
                        <div className="space-y-1.5">
                          {items.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => toggleChecklist(item.id)}
                              className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                                item.done
                                  ? "bg-indigo-950/20 border-indigo-900/30 text-slate-400 line-through"
                                  : darkMode
                                    ? "bg-slate-900/40 border-slate-800 hover:border-slate-700 text-slate-200"
                                    : "bg-white border-slate-200 hover:border-slate-300 text-slate-800"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={item.done}
                                  onChange={() => {}} // toggled on container click
                                  className="h-3.5 w-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="font-semibold">{item.task}</span>
                              </div>
                              {catObj.cat === "custom" && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    removeChecklistItem(item.id);
                                  }}
                                  className="text-xs text-rose-400 hover:text-rose-300 px-2 font-black"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Custom Task */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newChecklistItem}
                    onChange={(e) => setNewChecklistItem(e.target.value)}
                    placeholder="Add custom task (e.g. Buy Bengaluru metro card...)"
                    className={`flex-1 rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                      darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                    }`}
                  />
                  <button
                    onClick={addChecklistItem}
                    className="rounded-xl px-4 py-2 bg-indigo-600 text-white text-xs font-black hover:bg-indigo-500"
                  >
                    Add Task
                  </button>
                </div>
              </motion.div>
            )}

            {/* 8. PERSONALIZED RECOMMENDATIONS */}
            {activeTab === "recs" && (
              <motion.div
                key="recs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <ThumbsUp className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Personalized Relocation Recommendation Quiz</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Pins down optimal localities, commuting cards, and food subscriptions for you</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Profession & Setup</label>
                    <select
                      value={recsQuiz.profession}
                      onChange={(e) => setRecsQuiz(prev => ({ ...prev, profession: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="Software Engineer">Corporate Professional / IT Developer</option>
                      <option value="College Student">College Student / Aspirant</option>
                      <option value="Business Owner">Freelancer / Remote Nomad</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ideal Local Vibe</label>
                    <select
                      value={recsQuiz.socialVibe}
                      onChange={(e) => setRecsQuiz(prev => ({ ...prev, socialVibe: e.target.value }))}
                      className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    >
                      <option value="Active Nightlife & Cafes">Active Nightlife, Cafes & Gyms</option>
                      <option value="Quiet Residential Green">Quiet Green Residential, Parks & Libraries</option>
                      <option value="Budget Students Hub">Highly Budget-friendly & Student Density</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={runPersonalizedRecQuiz}
                  className="w-full rounded-xl py-3 bg-indigo-600 text-white text-xs font-black transition-all hover:bg-indigo-500 hover:scale-[1.01] active:scale-95 cursor-pointer"
                  id="run-recs-quiz-btn"
                >
                  Match Relocation Profiles
                </button>

                {recsResult && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Matched Localities in {currentCity}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {recsResult.slice(0, 2).map((match, idx) => (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border text-left space-y-2 relative overflow-hidden ${
                            darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                          }`}
                        >
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-black text-indigo-400">{match.name}</span>
                            <span className="text-[10px] font-black bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {match.score}% Match
                            </span>
                          </div>

                          <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                            Excellent choice matching your preference. Average double PG costs around ₹{match.rent >= 85 ? "11k - 14k" : "8k - 10k"}/mo.
                          </p>

                          <div className="text-[9px] font-bold text-slate-300">
                            💡 <span className="font-black text-brand-indigo">Transit Key:</span> Best matched with standard monthly metro / bus passes.
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* 9. LOCAL COMMUNITY FEED */}
            {activeTab === "feed" && (
              <motion.div
                key="feed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <MessageSquare className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">CityMate Local Community Wall</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Match with flatmates, certified cooks/maids, or trade second-hand furniture</p>
                  </div>
                </div>

                {/* Post creation form */}
                <form onSubmit={handleAddPost} className={`p-4 rounded-xl border space-y-3 ${
                  darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-200/60 shadow-sm"
                }`}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Channel Category</label>
                      <select
                        value={newPost.category}
                        onChange={(e) => setNewPost(prev => ({ ...prev, category: e.target.value }))}
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-[11px] focus:outline-none font-semibold ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="flatmates">Flatmate Vacancies</option>
                        <option value="cooks">Cooks, Maids & Maalik ratings</option>
                        <option value="buysell">Buy & Sell Move-out Furniture</option>
                        <option value="qna">Ask Locals (Area Q&A)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Post Title</label>
                      <input
                        type="text"
                        value={newPost.title}
                        onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Hiring vegetarian cook in HSR"
                        className={`w-full rounded-lg border px-2.5 py-1.5 text-[11px] focus:outline-none font-semibold ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="Write your post details..."
                      className={`w-full h-16 rounded-lg border px-2.5 py-1.5 text-[11px] focus:outline-none font-semibold ${
                        darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-white border-slate-200 text-slate-800"
                      }`}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl py-2 bg-indigo-600 text-white text-[11px] font-black transition-all hover:bg-indigo-500 cursor-pointer"
                  >
                    Publish to Community Feed
                  </button>
                </form>

                {/* Posts rendering */}
                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1">
                  {feedPosts.map((post) => (
                    <div
                      key={post.id}
                      className={`p-4 rounded-xl border text-xs text-left space-y-3 ${
                        darkMode ? "bg-slate-900/20 border-slate-800/80" : "bg-white border-slate-100 shadow-sm"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2.5">
                          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-black text-xs ${
                            darkMode ? "bg-purple-950/60 text-purple-400 border border-purple-900/40" : "bg-indigo-50 text-brand-indigo"
                          }`}>
                            {post.avatar}
                          </div>
                          <div>
                            <h5 className={`font-black ${darkMode ? "text-white" : "text-slate-900"}`}>{post.author}</h5>
                            <p className="text-[9px] text-slate-500 font-semibold">{post.role} • {post.timestamp}</p>
                          </div>
                        </div>

                        <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          post.category === "flatmates"
                            ? "bg-indigo-950 text-indigo-300 border border-indigo-500/20"
                            : post.category === "cooks"
                              ? "bg-purple-950 text-purple-300 border border-purple-500/20"
                              : "bg-teal-950 text-teal-300 border border-teal-500/20"
                        }`}>
                          {post.category}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className={`font-black text-sm ${darkMode ? "text-slate-200" : "text-slate-900"}`}>{post.title}</h4>
                        <p className={`text-slate-400 leading-normal font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                          {post.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-[10px] pt-2 border-t border-slate-100/10">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className={`flex items-center gap-1 font-black ${
                            post.liked ? "text-indigo-400" : "text-slate-500 hover:text-slate-400"
                          }`}
                        >
                          <span>👍 Like ({post.likes})</span>
                        </button>
                        <span className="text-slate-500 font-black">💬 Comments ({post.comments.length})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 10. CITY GUIDES */}
            {activeTab === "guide" && (
              <motion.div
                key="guide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <BookOpen className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">{currentCity} Relocation Survival Guide</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Explains security deposit customs, local norms, and registry paperwork</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs leading-relaxed">
                  
                  {/* Security Deposit Custom */}
                  <div className={`p-4 rounded-xl border text-left space-y-2 ${
                    darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}>
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">Security Deposit Customs</span>
                    <p className={`text-slate-300 font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {currentCity === "Bengaluru" ? (
                        "🚨 Bengaluru is famous for 6 to 10 months rent as a security deposit upfront! However, co-living operators and standard PGs on CityMate only charge 1 to 2 months. Make sure to negotiate!"
                      ) : currentCity === "Mumbai" ? (
                        "🚨 Mumbai deposits usually range from 3 to 6 months of rent. Beware of heavy societies that request high societies 'society transfer charges' from bachelors."
                      ) : (
                        "✓ You are lucky! Pune, Hyderabad, and Delhi NCR standard rental deposits are very customer friendly—usually strictly 2 to 3 months of rent maximum."
                      )}
                    </p>
                  </div>

                  {/* Maid & Cook setup guide */}
                  <div className={`p-4 rounded-xl border text-left space-y-2 ${
                    darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}>
                    <span className="text-[10px] font-black uppercase text-purple-400 tracking-wider">Hiring Cooks & domestic help</span>
                    <p className={`text-slate-300 font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      In {currentCity}, domestic maid sweep service costs ₹1,500 - ₹2,500/mo. Hiring a cook twice a day averages ₹3k - ₹4k/mo for a couple. You can find vetted maid contacts on our local community feed.
                    </p>
                  </div>

                  {/* Local Rent Agreements */}
                  <div className={`p-4 rounded-xl border text-left space-y-2 ${
                    darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}>
                    <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider">Rent Agreement & Police Verification</span>
                    <p className={`text-slate-300 font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      Rent agreements are traditionally signed for 11 months on stamp paper of ₹100 or ₹500. Owner police verification is highly recommended for safety and registry proof.
                    </p>
                  </div>

                  {/* Must try local escapes */}
                  <div className={`p-4 rounded-xl border text-left space-y-2 ${
                    darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}>
                    <span className="text-[10px] font-black uppercase text-indigo-400 tracking-wider">Local vocabulary / Survival glossary</span>
                    <p className={`text-slate-300 font-semibold ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                      {currentCity === "Bengaluru" ? (
                        "Namma Metro (My Metro), Swiggy/Zomato high-density lanes, 'Ayyo' (express disappointment), 'Kanha' (local food spot)."
                      ) : currentCity === "Mumbai" ? (
                        "Local trains (Slow vs Fast), Kaali Peeli (Black & Yellow cabs), 'Tapri' (tea Stall), 'Vada Pav' (staple snack)."
                      ) : (
                        "Oye (casual call), Metro card smart transit, Auto-wala sharing lanes, Tiffin delivery cycles."
                      )}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 11. EMERGENCY CONTACTS */}
            {activeTab === "contacts" && (
              <motion.div
                key="contacts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <PhoneCall className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">Unified Emergency Directory</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Instant local helpdesks & vetted CityMate voluntary guides</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* National Helplines */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}>
                    <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider">Standard National helplines</span>
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between border-b border-slate-100/5 pb-1">
                        <span>Emergency Command Node</span>
                        <span className="text-rose-400 font-black">112</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100/5 pb-1">
                        <span>Police Department</span>
                        <span className="text-rose-400 font-black">100</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100/5 pb-1">
                        <span>Women Safety Helpline</span>
                        <span className="text-rose-400 font-black">1091</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>Cyber Crime Investigation</span>
                        <span className="text-rose-400 font-black">1930</span>
                      </div>
                    </div>
                  </div>

                  {/* CityMate Buddy volunteers */}
                  <div className={`p-4 rounded-xl border space-y-3 ${
                    darkMode ? "bg-slate-900/30 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                  }`}>
                    <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider">CityMate Volunteer backups</span>
                    <p className="text-[9px] text-slate-400 font-medium leading-normal mb-1">
                      Our active local members who have volunteered to handle local relocation emergencies (medical / landlord issues) on-site.
                    </p>
                    <div className="space-y-2 text-xs font-semibold">
                      <div className="flex justify-between border-b border-slate-100/5 pb-1">
                        <span>Vikram (HSR Volunteer)</span>
                        <span className="text-teal-400 font-black">+91 98450 12044</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-100/5 pb-1">
                        <span>Sneha (Viman Nagar guide)</span>
                        <span className="text-teal-400 font-black">+91 73521 95402</span>
                      </div>
                      <div className="flex justify-between pb-1">
                        <span>Amit (Andheri backup buddy)</span>
                        <span className="text-teal-400 font-black">+91 91204 35912</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 12. ONE-CLICK RELOCATION PACKAGE */}
            {activeTab === "package" && (
              <motion.div
                key="package"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 text-left"
              >
                <div className="flex items-center gap-2 border-b border-slate-100/10 pb-3">
                  <Package className="h-5 w-5 text-indigo-400" />
                  <div>
                    <h3 className="text-sm font-black uppercase tracking-wider">1-Click Premium Relocation Packages</h3>
                    <p className="text-[10px] text-slate-400 font-semibold leading-none mt-0.5">Order on-demand moving, cleaning, high-speed Wi-Fi & cook setup in one subscription</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { title: "Solo Hacker Pack", price: 8999, desc: "Perfect for single bachelors/students", items: ["Packing + Delivery", "Room deep cleaning", "1-Month WiFi connection setup", "1-Week Tiffin package"] },
                    { title: "Tech Professional Pack", price: 15499, desc: "SDE / Corporate relocator standard", items: ["Premium bubble packing + transit", "House painting + deep sanitize", "Cook & Maid discovery matching", "Dedicated local guide buddy"] },
                    { title: "Family Sovereign Pack", price: 29999, desc: "Full white-glove family transition", items: ["Complete 3BHK packers & movers", "AC installation & gas cylinder setup", "Domestic helper background checks", "Kids school discovery help"] }
                  ].map((p, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border flex flex-col justify-between text-left space-y-4 ${
                        darkMode ? "bg-slate-900/40 border-slate-800" : "bg-white border-slate-100 shadow-sm"
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-black text-indigo-400">{p.title}</h4>
                        <p className="text-[9px] text-slate-500 font-semibold leading-none mt-1">{p.desc}</p>
                        <p className="text-xl font-black text-white mt-2">₹{p.price.toLocaleString()}</p>
                        
                        <ul className="list-disc list-inside text-[9px] font-bold text-slate-400 space-y-1 mt-3">
                          {p.items.map((item, idx) => <li key={idx}>{item}</li>)}
                        </ul>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedPackage(p);
                          setConciergeModalOpen(true);
                        }}
                        className="w-full rounded-lg py-2 bg-indigo-600 text-white text-[10px] font-black transition-all hover:bg-indigo-500 cursor-pointer text-center"
                      >
                        Book Concierge Pack
                      </button>
                    </div>
                  ))}
                </div>

                {orderInvoice && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/10 space-y-3"
                  >
                    <div className="flex justify-between items-baseline text-xs font-black">
                      <span className="text-emerald-400">Order Booking Success! Slot reserved.</span>
                      <span className="text-slate-400">Order ID: {orderInvoice.orderNo}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] font-bold text-slate-300">
                      <div>Package: <span className="text-white">{orderInvoice.packageName}</span></div>
                      <div>Amount Paid: <span className="text-white">₹{orderInvoice.price.toLocaleString()}</span></div>
                      <div>Transit Date: <span className="text-white">{orderInvoice.date}</span></div>
                      <div>Client: <span className="text-white">{orderInvoice.clientName}</span></div>
                      <div>Current Location: <span className="text-white">{orderInvoice.addressFrom}</span></div>
                      <div>Destination City: <span className="text-white">{currentCity}</span></div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* MODAL: One-Click Relocation Booking Concierge */}
      {conciergeModalOpen && selectedPackage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`w-full max-w-md rounded-2xl border p-6 text-left space-y-4 ${
              darkMode ? "bg-slate-900 border-slate-800 text-white" : "bg-white border-slate-100 text-slate-800 shadow-2xl"
            }`}
          >
            <div className="flex justify-between items-baseline border-b border-slate-100/10 pb-3">
              <h4 className="text-sm font-black text-indigo-400">Book {selectedPackage.title}</h4>
              <button
                onClick={() => setConciergeModalOpen(false)}
                className="text-slate-400 hover:text-white font-black"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookPackage} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Full Name *</label>
                <input
                  type="text"
                  required
                  value={bookingFormData.name}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">WhatsApp Contact Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91"
                  value={bookingFormData.phone}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Moving Out From (Current Address)</label>
                <input
                  type="text"
                  value={bookingFormData.addressFrom}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, addressFrom: e.target.value }))}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-slate-400">Move-in Target Date *</label>
                <input
                  type="date"
                  required
                  value={bookingFormData.date}
                  onChange={(e) => setBookingFormData(prev => ({ ...prev, date: e.target.value }))}
                  className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                    darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                  }`}
                />
              </div>

              <div className="p-3.5 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-[10px] text-slate-400 font-medium leading-relaxed">
                Slot reservation requires NO token payment on the app. Slot verification code will be sent over WhatsApp, and payment can be made securely post-move.
              </div>

              <button
                type="submit"
                className="w-full rounded-xl py-3 bg-indigo-600 text-white text-xs font-black hover:bg-indigo-500 cursor-pointer"
              >
                Book Package Slot (₹{selectedPackage.price.toLocaleString()})
              </button>
            </form>
          </motion.div>
        </div>
      )}

    </section>
  );
}
