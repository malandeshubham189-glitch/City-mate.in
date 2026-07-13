import React, { useState, useEffect } from "react";
import { Listing, ListingCategory, UserProfile, Enquiry, CMSBanner, CMSTestimonial, CMSStat, CMSBlogPost, CMSSeo } from "./types";
import { INDIAN_CITIES, CATEGORY_LABELS, SEED_LISTINGS } from "./data/seedData";
import { db, auth, handleFirestoreError, OperationType } from "./lib/firebase";
import { collection, getDocs, query, where, addDoc, doc, updateDoc, deleteDoc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { listenAllListings } from "./services/firestoreService";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { motion, AnimatePresence } from "motion/react";

// Imported Components
import { useNotificationHub } from "./hooks/useNotificationHub";
import Header from "./components/Header";
import CityMateBuddy from "./components/CityMateBuddy";
import ListingCard from "./components/ListingCard";

// Launch Integrity & Resilient Fallbacks
import { validateProductionLaunch } from "./utils/launchValidator";
import { auditAndInitializeDatabase } from "./services/maintenanceService";
import { runProductionSanityChecks } from "./utils/prodSanityCheck";
import { useNetworkTelescope } from "./hooks/useNetworkTelescope";
import { patchCityAssets } from "./utils/assetSeeder";
import { forceAssetSyncNow } from "./utils/forceAssetSync";

const ListingDetailModal = React.lazy(() => import("./components/ListingDetailModal"));
const MockAuthModal = React.lazy(() => import("./components/MockAuthModal"));
const OwnerAddListingModal = React.lazy(() => import("./components/OwnerAddListingModal"));
const EnquiryListModal = React.lazy(() => import("./components/EnquiryListModal"));
const ProfileModal = React.lazy(() => import("./components/ProfileModal"));
const AdminPanelModal = React.lazy(() => import("./components/AdminPanelModal"));
const UserDashboardModal = React.lazy(() => import("./components/UserDashboardModal"));
const AIRelocationSuite = React.lazy(() => import("./components/AIRelocationSuite"));

// Icons
import {
  Search,
  Plus,
  Compass,
  Building,
  Heart,
  MessageSquare,
  Shield,
  Star,
  Users,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Utensils,
  BookOpen,
  Wrench,
  Sparkles,
  Bed,
  Home,
  Users as UsersIcon,
  Briefcase,
  GraduationCap,
  School,
  TrendingUp,
  MapPin,
  ChevronRight,
  ChevronLeft,
  QrCode,
  ShieldCheck,
  Check,
  Sun,
  Moon,
  Info,
  User,
  X,
  Wifi
} from "lucide-react";

// Curated Trending Cities Info
const TRENDING_CITIES_INFO = [
  {
    name: "Bengaluru",
    slogan: "Silicon Valley of India",
    image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80",
    relocations: "4.8k relocations"
  },
  {
    name: "Pune",
    slogan: "Oxford of the East",
    image: "https://images.unsplash.com/photo-1601931139422-0d12e4f0ce0f?auto=format&fit=crop&w=600&q=80",
    relocations: "3.2k relocations"
  },
  {
    name: "Mumbai",
    slogan: "The City of Dreams",
    image: "https://images.unsplash.com/photo-1570168007244-23704139443d?auto=format&fit=crop&w=600&q=80",
    relocations: "5.5k relocations"
  },
  {
    name: "Delhi",
    slogan: "Heart of the Nation",
    image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80",
    relocations: "4.1k relocations"
  },
  {
    name: "Hyderabad",
    slogan: "The Pearl & IT Hub",
    image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80",
    relocations: "3.9k relocations"
  },
  {
    name: "Jaipur",
    slogan: "The Historic Pink City",
    image: "https://images.unsplash.com/photo-1477584305353-813839efcca0?auto=format&fit=crop&w=600&q=80",
    relocations: "1.5k relocations"
  }
];

// Testimonials Data
const TESTIMONIALS = [
  {
    quote: "CityMate is a absolute lifesaver! I relocated from Patna to Bengaluru for my tech job and booked a verified luxury PG and a local tiffin subscription in under 2 hours.",
    author: "Priya Sharma",
    role: "SDE-1 at Amazon",
    city: "Bengaluru",
    avatar: "P"
  },
  {
    quote: "Finding student hostels near Viman Nagar was incredibly stressful. CityMate's interactive hubs allowed me to explore verified school/tuition options and mess halls instantly.",
    author: "Rohan Deshmukh",
    role: "Student at Symbiosis",
    city: "Pune",
    avatar: "R"
  },
  {
    quote: "The interactive AI Buddy guided me on Packers & Movers rate estimation and pinpointed safe localities in Gachibowli. Absolute gold standard startup experience.",
    author: "Anoop Verma",
    role: "Product Lead at Nykaa",
    city: "Hyderabad",
    avatar: "A"
  }
];

export default function App() {
  // Dark mode state - default to true for the stunning futuristic tech look!
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("citymate_theme");
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Authentication & Profile state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Live Notification Hub
  const { 
    notifications, 
    unreadCount, 
    toasts, 
    dismissToast, 
    markAllAsRead,
    addNotification 
  } = useNotificationHub(currentUser?.uid);

  // Network health telescope monitoring (Phase 11)
  const { networkHealth, toastMessage: telescopeToast, dismissToast: dismissTelescope } = useNetworkTelescope();

  // Core App states
  const [listings, setListings] = useState<Listing[]>([]);
  const [favourites, setFavourites] = useState<string[]>([]); // Array of listingIds favorited
  const [selectedCity, setSelectedCity] = useState("Bengaluru");
  const [selectedCategory, setSelectedCategory] = useState<ListingCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Advanced search states (Phase 6)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filterLocality, setFilterLocality] = useState("");
  const [filterMinBudget, setFilterMinBudget] = useState("");
  const [filterMaxBudget, setFilterMaxBudget] = useState("");
  const [filterGender, setFilterGender] = useState("all"); // "all" | "male" | "female" | "unisex"
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);

  // Modals state
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [showEnquiriesModal, setShowEnquiriesModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingListing, setEditingListing] = useState<Listing | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showUserDashboard, setShowUserDashboard] = useState(false);

  // Filters toggles for Dashboards
  const [viewOnlyOwnListings, setViewOnlyOwnListings] = useState(false);
  const [viewFavouritesOnly, setViewFavouritesOnly] = useState(false);
  const [viewPendingOnly, setViewPendingOnly] = useState(false); // Admin filter

  // Loading indicator
  const [isListingsLoading, setIsListingsLoading] = useState(true);

  // CMS live states
  const [cmsBanners, setCmsBanners] = useState<CMSBanner[]>([]);
  const [cmsTestimonials, setCmsTestimonials] = useState<CMSTestimonial[]>([]);
  const [cmsStats, setCMSStats] = useState<CMSStat[]>([]);
  const [cmsPartners, setCmsPartners] = useState<string[]>([]);
  const [cmsBlogs, setCmsBlogs] = useState<CMSBlogPost[]>([]);
  const [cmsSeo, setCmsSeo] = useState<CMSSeo | null>(null);
  const [selectedBlog, setSelectedBlog] = useState<CMSBlogPost | null>(null);

  // Listen to CMS live collections in real-time
  useEffect(() => {
    const cmsCol = collection(db, "cms");
    const unsubscribe = onSnapshot(cmsCol, (snapshot) => {
      let foundSeo = false;
      let foundBanners = false;
      let foundTestimonials = false;
      let foundStats = false;
      let foundPartners = false;
      let foundBlogs = false;

      snapshot.forEach((docSnap) => {
        const id = docSnap.id;
        const data = docSnap.data();
        if (id === "seo") {
          setCmsSeo(data as CMSSeo);
          foundSeo = true;
        } else if (id === "banners") {
          setCmsBanners(data.list || []);
          foundBanners = true;
        } else if (id === "testimonials") {
          setCmsTestimonials(data.list || []);
          foundTestimonials = true;
        } else if (id === "stats") {
          setCMSStats(data.list || []);
          foundStats = true;
        } else if (id === "partners") {
          setCmsPartners(data.list || []);
          foundPartners = true;
        } else if (id === "blogs") {
          setCmsBlogs(data.list || []);
          foundBlogs = true;
        }
      });

      // Apply defaults for any missing documents in the Firestore database
      if (!foundSeo) {
        setCmsSeo({
          title: "CityMate India | India's First AI-Powered Relocation Platform Suite",
          description: "CityMate India is India's first AI-powered relocation platform. Discover verified rooms, PGs, flats, mess food subscriptions, job postings, and college details.",
          keywords: "CityMate India, relocation India, PG in Bengaluru, rooms in Pune, flats in Mumbai"
        });
      }
      if (!foundBanners) {
        setCmsBanners([
          { name: "Bengaluru", slogan: "Silicon Valley of India", image: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=600&q=80", relocations: "4.8k relocations" },
          { name: "Pune", slogan: "Oxford of the East", image: "https://images.unsplash.com/photo-1601931139422-0d12e4f0ce0f?auto=format&fit=crop&w=600&q=80", relocations: "3.2k relocations" },
          { name: "Mumbai", slogan: "The City of Dreams", image: "https://images.unsplash.com/photo-1570168007244-23704139443d?auto=format&fit=crop&w=600&q=80", relocations: "5.5k relocations" },
          { name: "Delhi", slogan: "Heart of the Nation", image: "https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=600&q=80", relocations: "4.1k relocations" },
          { name: "Hyderabad", slogan: "The Pearl & IT Hub", image: "https://images.unsplash.com/photo-1605379399642-870262d3d051?auto=format&fit=crop&w=600&q=80", relocations: "3.9k relocations" },
          { name: "Jaipur", slogan: "The Historic Pink City", image: "https://images.unsplash.com/photo-1477584305353-813839efcca0?auto=format&fit=crop&w=600&q=80", relocations: "1.5k relocations" }
        ]);
      }
      if (!foundTestimonials) {
        setCmsTestimonials([
          { quote: "CityMate is a absolute lifesaver! I relocated from Patna to Bengaluru for my tech job and booked a verified luxury PG and a local tiffin subscription in under 2 hours.", author: "Priya Sharma", role: "SDE-1 at Amazon", city: "Bengaluru", avatar: "P" },
          { quote: "Finding student hostels near Viman Nagar was incredibly stressful. CityMate's interactive hubs allowed me to explore verified school/tuition options and mess halls instantly.", author: "Rohan Deshmukh", role: "Student at Symbiosis", city: "Pune", avatar: "R" },
          { quote: "The interactive AI Buddy guided me on Packers & Movers rate estimation and pinpointed safe localities in Gachibowli. Absolute gold standard startup experience.", author: "Anoop Verma", role: "Product Lead at Nykaa", city: "Hyderabad", avatar: "A" }
        ]);
      }
      if (!foundStats) {
        setCMSStats([
          { label: "Trusted Relocations", val: "15,400+", desc: "Across 8 metro areas" },
          { label: "Vetted PG Rating", val: "4.92 ★", desc: "Based on 3k+ audits" },
          { label: "Average Response Time", val: "1.8 Min", desc: "Instant AI Buddy consultation" },
          { label: "Verified Providers", val: "100%", desc: "Checked directly on-site" }
        ]);
      }
      if (!foundPartners) {
        setCmsPartners(["Stanza Living", "NoBroker", "Nestaway", "MagicBricks", "Housing.com"]);
      }
      if (!foundBlogs) {
        setCmsBlogs([
          {
            id: "1",
            title: "How to Avoid Rental Scams in Bengaluru",
            excerpt: "Relocating to the Silicon Valley can be daunting. Learn how to verify owner identity, check deposit norms, and use CityMate Scam Shield.",
            content: "Rental scams are on the rise in India's top metropolitan areas. Scammers often post fake listings with stolen photos and ask for a booking fee or deposit before you even visit the property. To protect yourself:\n\n1. Never transfer money without seeing the property in person.\n2. Verify the owner's legal documents or use CityMate's vetted verification services.\n3. Be wary of rent prices that are significantly lower than market value.\n4. Always use platforms that offer direct owner verification with KYC checks.\n\nAt CityMate, we verify each listing on-site to ensure you have a safe and secure relocation experience.",
            date: "July 8, 2026",
            author: "Team CityMate",
            image: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=600&q=80"
          },
          {
            id: "2",
            title: "Top 5 Student Localities in Pune: A Complete Relocation Guide",
            excerpt: "Moving to Pune for colleges like Symbiosis or Fergusson? We break down the top areas, cost of living, mess rates, and commute tips.",
            content: "Pune, the Oxford of the East, is home to hundreds of thousands of students. Choosing the right locality is crucial for budget and commute:\n\n1. Viman Nagar: Highly premium, close to Symbiosis, vibrant student life.\n2. Kothrud: Culturally rich, close to MIT, wide range of budget PG accommodations.\n3. Hinjawadi: Excellent for engineering and tech students, slightly further but modern infrastructure.\n4. FC Road / Shivajinagar: Right in the heart of the city, bustling student hub.\n5. Katraj: Great budget rooms and student-friendly organic mess tables.\n\nUse CityMate's interactive catalog filters to find the best PG accommodation matching your college and budget in under 15 minutes.",
            date: "June 25, 2026",
            author: "Rohan Deshmukh",
            image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=600&q=80"
          }
        ]);
      }
    }, (err) => {
      console.warn("CMS real-time sync subscription error, using local defaults:", err);
    });

    return () => unsubscribe();
  }, []);

  // Sync theme selection to localStorage
  useEffect(() => {
    localStorage.setItem("citymate_theme", JSON.stringify(darkMode));
  }, [darkMode]);

  // Production Launch & Resilient Path Diagnostics
  useEffect(() => {
    // 1. Run live launch diagnostics checks
    validateProductionLaunch();

    // 2. Perform database self-healing checks
    auditAndInitializeDatabase()
      .then((report) => {
        console.log("Database audit complete. Status:", report.firestoreConnected ? "Online" : "Offline/Fallback");
        // Trigger hot-fix asset patch scan
        patchCityAssets().then(() => {
          forceAssetSyncNow();
        });
      })
      .catch((err) => {
        console.error("Critical error in database initialization sweep:", err);
      });

    // 3. Execute pre-flight pre-production sanity validation
    runProductionSanityChecks()
      .then((report) => {
        console.log(`Pre-flight pre-production sanity check: ${report.verdict}`);
      })
      .catch((err) => {
        console.error("Sanity pre-flight check execution failed:", err);
      });
  }, []);

  // Update dynamic SEO based on live values
  useEffect(() => {
    if (cmsSeo) {
      document.title = cmsSeo.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute("content", cmsSeo.description);
      }
      const metaKeywords = document.querySelector('meta[name="keywords"]');
      if (metaKeywords) {
        metaKeywords.setAttribute("content", cmsSeo.keywords);
      }
    }
  }, [cmsSeo]);

  // Synchronize listings in real-time from Firestore
  useEffect(() => {
    setIsListingsLoading(true);
    const unsubscribe = listenAllListings(
      (list) => {
        if (list.length === 0) {
          console.log("No listings found in Firestore. Using local seed fallback.");
          setListings(SEED_LISTINGS);
        } else {
          setListings(list);
        }
        setIsListingsLoading(false);
      },
      (err) => {
        console.error("Error listening to listings, using fallback:", err);
        setListings(SEED_LISTINGS);
        setIsListingsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Listen to Firebase Auth state to sync profile
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const userDoc = await getDocs(query(collection(db, "users"), where("uid", "==", fbUser.uid)));
          if (!userDoc.empty) {
            const first = userDoc.docs[0].data() as UserProfile;
            setCurrentUser(first);
            loadUserFavourites(first.uid);
          } else {
            const fallbackProfile: UserProfile = {
              uid: fbUser.uid,
              name: fbUser.displayName || "CityMate User",
              email: fbUser.email || "",
              role: "user",
              createdAt: new Date().toISOString(),
            };
            setCurrentUser(fallbackProfile);
            loadUserFavourites(fbUser.uid);
          }

          // Check and automatically seed listings if empty
          try {
            const listingsCol = collection(db, "listings");
            const snap = await getDocs(listingsCol);
            if (snap.empty) {
              console.log("Database is empty. Migrating seed listings to Firestore...");
              for (const item of SEED_LISTINGS) {
                await addDoc(listingsCol, item);
              }
            }
          } catch (seedErr) {
            console.warn("Automated listings seeding bypassed or failed:", seedErr);
          }
        } catch (e) {
          console.error("Error loading profile details:", e);
          handleFirestoreError(e, OperationType.GET, "users");
        }
      } else {
        setCurrentUser(null);
        setFavourites([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load favorites for logged-in user
  const loadUserFavourites = async (uid: string) => {
    try {
      const favsCol = collection(db, "favourites");
      const q = query(favsCol, where("userId", "==", uid));
      const snap = await getDocs(q);
      const favIds: string[] = [];
      snap.forEach((docSnap) => {
        favIds.push(docSnap.data().listingId);
      });
      setFavourites(favIds);
    } catch (e) {
      console.error("Error loading favourites:", e);
      handleFirestoreError(e, OperationType.GET, "favourites");
    }
  };

  const handleToggleFavourite = async (listingId: string, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();

    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const isFav = favourites.includes(listingId);
    const compositeId = `${currentUser.uid}_${listingId}`;

    try {
      if (isFav) {
        const q = query(
          collection(db, "favourites"),
          where("userId", "==", currentUser.uid),
          where("listingId", "==", listingId)
        );
        const snap = await getDocs(q);
        snap.forEach(async (docSnap) => {
          await deleteDoc(doc(db, "favourites", docSnap.id));
        });

        setFavourites((prev) => prev.filter((id) => id !== listingId));
      } else {
        await addDoc(collection(db, "favourites"), {
          id: compositeId,
          userId: currentUser.uid,
          listingId: listingId,
          createdAt: new Date().toISOString(),
        });

        setFavourites((prev) => [...prev, listingId]);
      }
    } catch (e) {
      console.error("Error toggling favorite:", e);
      handleFirestoreError(e, OperationType.WRITE, "favourites");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setFavourites([]);
    setViewFavouritesOnly(false);
    setViewOnlyOwnListings(false);
    setViewPendingOnly(false);
    alert("Logged out successfully!");
  };

  const handleLoginSuccess = (profile: UserProfile) => {
    setCurrentUser(profile);
    loadUserFavourites(profile.uid);
    alert(`Welcome back, ${profile.name}!`);
    if (profile.role === "admin") {
      setShowAdminPanel(true);
    } else {
      setShowUserDashboard(true);
    }
  };

  const handleContactClick = (listing: Listing, type: "call" | "whatsapp", event?: React.MouseEvent) => {
    if (event) event.stopPropagation();

    if (type === "whatsapp") {
      const message = encodeURIComponent(
        `Hi ${listing.ownerName}, I found your listing "${listing.title}" on CityMate India. Is it still available?`
      );
      window.open(`https://wa.me/${listing.contactNumber.replace(/[^0-9+]/g, "")}?text=${message}`, "_blank");
    } else {
      window.open(`tel:${listing.contactNumber}`, "_self");
    }
  };

  const handleAddListingSuccess = (updatedListing: Listing) => {
    setListings((prev) => {
      const exists = prev.some((l) => l.id === updatedListing.id);
      if (exists) {
        return prev.map((l) => (l.id === updatedListing.id ? updatedListing : l));
      } else {
        return [updatedListing, ...prev];
      }
    });
    setEditingListing(null);
    alert("Your listing has been saved and submitted successfully!");
  };

  const handleAdminApproveListing = async (listing: Listing, approved: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const q = query(collection(db, "listings"), where("id", "==", listing.id));
      const snap = await getDocs(q);

      if (!snap.empty) {
        const docRef = doc(db, "listings", snap.docs[0].id);
        const status = approved ? "active" : "rejected";
        await updateDoc(docRef, { status });

        setListings((prev) =>
          prev.map((l) => (l.id === listing.id ? { ...l, status } : l))
        );
        alert(`Listing successfully ${approved ? "approved" : "rejected"}.`);
      }
    } catch (e) {
      console.error(e);
      handleFirestoreError(e, OperationType.UPDATE, `listings/${listing.id}`);
    }
  };

  const handleAdminDeleteListing = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this listing permanently?")) return;

    try {
      const q = query(collection(db, "listings"), where("id", "==", listingId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        await deleteDoc(doc(db, "listings", snap.docs[0].id));
        setListings((prev) => prev.filter((l) => l.id !== listingId));
        alert("Listing permanently deleted.");
      }
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `listings/${listingId}`);
    }
  };

  const handleOwnerDeleteListing = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete your listing permanently?")) return;

    try {
      const q = query(collection(db, "listings"), where("id", "==", listingId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        await deleteDoc(doc(db, "listings", snap.docs[0].id));
        setListings((prev) => prev.filter((l) => l.id !== listingId));
        alert("Your listing has been permanently deleted.");
      }
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, `listings/${listingId}`);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "rooms": return <Bed className="h-4.5 w-4.5" />;
      case "pg": return <Home className="h-4.5 w-4.5" />;
      case "hostels": return <UsersIcon className="h-4.5 w-4.5" />;
      case "flats": return <Building className="h-4.5 w-4.5" />;
      case "mess": return <Utensils className="h-4.5 w-4.5" />;
      case "tiffin": return <Utensils className="h-4.5 w-4.5" />;
      case "jobs": return <Briefcase className="h-4.5 w-4.5" />;
      case "tuition": return <BookOpen className="h-4.5 w-4.5" />;
      case "colleges": return <GraduationCap className="h-4.5 w-4.5" />;
      case "schools": return <School className="h-4.5 w-4.5" />;
      case "local_services": return <Wrench className="h-4.5 w-4.5" />;
      default: return <Compass className="h-4.5 w-4.5" />;
    }
  };

  // Filter listings
  const filteredListings = listings.filter((listing) => {
    if (listing.city !== selectedCity) return false;
    if (selectedCategory !== "all" && listing.category !== selectedCategory) return false;

    if (searchQuery.trim() !== "") {
      const queryText = searchQuery.toLowerCase();
      const matchTitle = listing.title.toLowerCase().includes(queryText);
      const matchLocality = listing.locality.toLowerCase().includes(queryText);
      const matchDesc = listing.description.toLowerCase().includes(queryText);
      if (!matchTitle && !matchLocality && !matchDesc) return false;
    }

    // Apply Advanced Filters (Phase 6)
    if (filterLocality.trim() !== "") {
      if (!listing.locality.toLowerCase().includes(filterLocality.toLowerCase())) return false;
    }

    if (filterMinBudget !== "") {
      const min = parseFloat(filterMinBudget);
      if (!isNaN(min) && listing.price < min) return false;
    }

    if (filterMaxBudget !== "") {
      const max = parseFloat(filterMaxBudget);
      if (!isNaN(max) && listing.price > max) return false;
    }

    if (filterGender !== "all") {
      const genderMatch = (listing.title + " " + listing.description + " " + listing.features.join(" ")).toLowerCase();
      if (filterGender === "male" && !genderMatch.includes("male") && !genderMatch.includes("boy") && !genderMatch.includes("gents")) return false;
      if (filterGender === "female" && !genderMatch.includes("female") && !genderMatch.includes("girl") && !genderMatch.includes("lady") && !genderMatch.includes("ladies")) return false;
      if (filterGender === "unisex" && !genderMatch.includes("unisex") && !genderMatch.includes("co-ed")) return false;
    }

    if (filterVerifiedOnly) {
      if (listing.rating < 4.5) return false;
    }

    if (currentUser) {
      if (viewFavouritesOnly && !favourites.includes(listing.id)) return false;
      if (currentUser.role === "owner" && viewOnlyOwnListings && listing.ownerId !== currentUser.uid) return false;

      if (currentUser.role === "admin") {
        if (viewPendingOnly && listing.status !== "pending") return false;
      } else {
        const isMyOwnListing = listing.ownerId === currentUser.uid;
        if (listing.status !== "active" && !isMyOwnListing) return false;
      }
    } else {
      if (listing.status !== "active") return false;
    }

    return true;
  });

  // Pick top 3 featured spots dynamically
  const featuredListings = listings
    .filter((l) => l.city === selectedCity && l.status === "active" && l.rating >= 4.7)
    .slice(0, 3);

  // Counts
  const totalCount = listings.length;
  const activeCount = listings.filter((l) => l.status === "active").length;
  const pendingCount = listings.filter((l) => l.status === "pending").length;

  return (
    <div className={`min-h-screen transition-all duration-500 flex flex-col font-sans antialiased ${
      darkMode 
        ? "bg-slate-950 text-slate-100 bg-mesh-glow-dark animate-gradient-flow" 
        : "bg-slate-50/50 text-slate-900 bg-mesh-glow"
    }`}>
      
      {/* Premium Header */}
      <Header
        currentUser={currentUser}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
        selectedCity={selectedCity}
        onCityChange={(city) => {
          setSelectedCity(city);
          setViewOnlyOwnListings(false);
          setViewFavouritesOnly(false);
          setViewPendingOnly(false);
        }}
        cities={INDIAN_CITIES}
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        unreadNotificationsCount={unreadCount}
        notificationsList={notifications}
        onMarkNotificationsAsRead={markAllAsRead}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-20">
        
        {/* Full-Screen Glass Hero Section */}
        <section className="relative overflow-hidden rounded-3xl min-h-[500px] flex flex-col justify-center px-6 py-16 text-left shadow-2xl border transition-all duration-500 sm:px-12 md:py-24 md:px-16 ${
          darkMode 
            ? 'bg-slate-950/40 border-slate-800/80 shadow-black/40 neon-border-glow-indigo' 
            : 'bg-white/40 border-slate-200/80 shadow-slate-100/40 glass-premium-light'
        }">
          {/* Neon Glow blobs behind glass */}
          <div className="absolute top-0 right-0 h-72 w-72 rounded-full bg-brand-indigo/10 blur-3xl animate-pulse-slow" />
          <div className="absolute -bottom-20 left-10 h-64 w-64 rounded-full bg-brand-violet/15 blur-3xl" />
          
          {/* Animated Skyline Background representation */}
          <div className="absolute bottom-0 left-0 right-0 h-40 opacity-20 pointer-events-none select-none overflow-hidden">
            <div className="absolute bottom-0 left-0 flex w-[200%] h-full animate-skyline-flow">
              <svg className="w-1/2 h-full" viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 120 V80 H40 V120 M50 120 V50 H90 V120 M100 120 V90 H130 V120 M140 120 V30 H180 V120 M195 120 V70 H220 V120 M230 120 V10 H280 V120 M290 120 V60 H330 V120 M345 120 V85 H370 V120 M380 120 V25 H430 V120 M445 120 V75 H470 V120 M480 120 V45 H520 V120 M535 120 V95 H560 V120 M570 120 V15 H620 V120 M635 120 V80 H665 V120 M675 120 V40 H715 V120 M725 120 V65 H755 V120 M765 120 V30 H795 V120" 
                  stroke={darkMode ? "#6366f1" : "#4f46e5"} strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
              </svg>
              <svg className="w-1/2 h-full" viewBox="0 0 800 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 120 V80 H40 V120 M50 120 V50 H90 V120 M100 120 V90 H130 V120 M140 120 V30 H180 V120 M195 120 V70 H220 V120 M230 120 V10 H280 V120 M290 120 V60 H330 V120 M345 120 V85 H370 V120 M380 120 V25 H430 V120 M445 120 V75 H470 V120 M480 120 V45 H520 V120 M535 120 V95 H560 V120 M570 120 V15 H620 V120 M635 120 V80 H665 V120 M675 120 V40 H715 V120 M725 120 V65 H755 V120 M765 120 V30 H795 V120" 
                  stroke={darkMode ? "#6366f1" : "#4f46e5"} strokeWidth="1.5" strokeDasharray="4 4" fill="none"/>
              </svg>
            </div>
          </div>

          <div className="relative z-10 max-w-3xl space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${
                darkMode 
                  ? "bg-purple-950/40 text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                  : "bg-indigo-50 text-brand-indigo border-indigo-100 shadow-sm"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 animate-pulse" /> India's Elite Relocation Network
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] text-balance"
            >
              Relocate to <span className={`text-transparent bg-clip-text bg-gradient-to-r ${
                darkMode ? "from-purple-400 via-indigo-400 to-pink-400" : "from-brand-blue via-brand-indigo to-purple-600"
              }`}>{selectedCity}</span> with absolute luxury.
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`text-sm sm:text-base leading-relaxed max-w-xl ${
                darkMode ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Discover elite serviced PGs, organic mess tables, micro tuition professors, vetted local movers, and verified corporate vacancies. No brokerages. No stress.
            </motion.p>

            {/* Premium Floating Search box */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className={`flex flex-col sm:flex-row gap-2.5 max-w-2xl p-2 rounded-2xl border transition-all duration-300 ${
                darkMode
                  ? "bg-slate-900/60 border-slate-800/80 focus-within:border-purple-500/50 focus-within:shadow-[0_0_25px_rgba(124,58,237,0.15)]"
                  : "bg-white/80 border-slate-200/80 shadow-xl shadow-slate-100/50 focus-within:border-brand-indigo/50 focus-within:shadow-[0_0_20px_rgba(79,70,229,0.1)]"
              } backdrop-blur-xl`}
            >
              <div className="relative flex-1 flex items-center pl-3">
                <Search className={`h-4.5 w-4.5 shrink-0 ${darkMode ? "text-slate-500" : "text-slate-400"}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Locality, flatmate preference, AC or services (e.g. Wi-Fi)..."
                  className={`w-full bg-transparent border-0 py-3.5 px-3.5 text-xs focus:outline-none placeholder-slate-500 ${
                    darkMode ? "text-white" : "text-slate-950"
                  }`}
                  id="search-input-box"
                />
              </div>
              <button
                onClick={() => setSearchQuery("")}
                disabled={!searchQuery}
                className={`rounded-xl px-6 py-3.5 text-xs font-black transition-all cursor-pointer select-none active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${
                  darkMode
                    ? "bg-gradient-to-r from-brand-indigo to-brand-violet text-white hover:from-indigo-500 hover:to-purple-500"
                    : "bg-slate-950 text-white hover:bg-slate-900"
                }`}
                id="search-clear-btn"
              >
                Clear Search
              </button>
            </motion.div>

            {/* Advanced Filters Trigger (Phase 6) */}
            <div className="flex justify-start max-w-2xl px-1">
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
                  darkMode ? "text-purple-400 hover:text-purple-300" : "text-brand-indigo hover:text-indigo-700"
                }`}
                id="advanced-filters-trigger"
              >
                <span>{showAdvancedFilters ? "Hide Advanced Search" : "Show Advanced Search (Area, Budget, Gender)"}</span>
              </button>
            </div>

            {/* Advanced Filters Panel */}
            <AnimatePresence>
              {showAdvancedFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`rounded-2xl border p-5 max-w-2xl transition-all duration-300 overflow-hidden ${
                    darkMode
                      ? "bg-slate-900/40 border-slate-800/80 text-white"
                      : "bg-white/80 border-slate-200/80 text-slate-800 shadow-xl"
                  }`}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Locality */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Locality / Area</label>
                      <input
                        type="text"
                        value={filterLocality}
                        onChange={(e) => setFilterLocality(e.target.value)}
                        placeholder="e.g. Koramangala, Viman Nagar"
                        className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      />
                    </div>

                    {/* Gender Preference */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gender Accomodation</label>
                      <select
                        value={filterGender}
                        onChange={(e) => setFilterGender(e.target.value)}
                        className={`w-full rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                          darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                        }`}
                      >
                        <option value="all" className="font-semibold">All Genders</option>
                        <option value="male" className="font-semibold">Male Only / Boys PG</option>
                        <option value="female" className="font-semibold">Female Only / Girls PG</option>
                        <option value="unisex" className="font-semibold">Co-ed / Unisex</option>
                      </select>
                    </div>

                    {/* Budget min/max */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Budget Limit (INR)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={filterMinBudget}
                          onChange={(e) => setFilterMinBudget(e.target.value)}
                          placeholder="Min (e.g. 5000)"
                          className={`w-1/2 rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                            darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                        <input
                          type="number"
                          value={filterMaxBudget}
                          onChange={(e) => setFilterMaxBudget(e.target.value)}
                          placeholder="Max (e.g. 20000)"
                          className={`w-1/2 rounded-xl border px-3 py-2 text-xs focus:outline-none font-semibold ${
                            darkMode ? "bg-slate-950 border-slate-800 text-white" : "bg-slate-50 border-slate-200 text-slate-800"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Verification and Reset */}
                    <div className="flex flex-col justify-end gap-3">
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={filterVerifiedOnly}
                          onChange={(e) => setFilterVerifiedOnly(e.target.checked)}
                          className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <span className="text-xs font-bold">Only Show Top Verified (Rating 4.5+)</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFilterLocality("");
                          setFilterMinBudget("");
                          setFilterMaxBudget("");
                          setFilterGender("all");
                          setFilterVerifiedOnly(false);
                        }}
                        className={`text-xs font-bold text-left self-start underline ${
                          darkMode ? "text-slate-400 hover:text-white" : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Reset All Advanced Filters
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* Dashboard Panels (Admin / Owner / Seeker) */}
        {currentUser && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl border p-5 shadow-lg transition-all duration-500 ${
              darkMode
                ? "border-slate-800 bg-slate-900/30 text-white shadow-black/20"
                : "border-slate-100 bg-white text-slate-800"
            }`}
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              
              <div className="flex items-center gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                  darkMode ? "bg-purple-950/50 text-purple-400 border border-purple-900/30" : "bg-indigo-50 text-brand-indigo"
                }`}>
                  {currentUser.role === "admin" ? (
                    <Shield className="h-5.5 w-5.5" />
                  ) : currentUser.role === "owner" ? (
                    <Building className="h-5.5 w-5.5" />
                  ) : (
                    <Heart className="h-5.5 w-5.5" />
                  )}
                </div>
                <div>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${darkMode ? "text-purple-400" : "text-brand-indigo"}`}>
                    {currentUser.role === "admin" ? "Admin Command Core" : currentUser.role === "owner" ? "Owner Hub Workspace" : "Seeker Dashboard"}
                  </h3>
                  <p className={`text-xs font-semibold mt-0.5 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                    Logged in as <span className="font-bold">{currentUser.name}</span> ({currentUser.email})
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                {currentUser.role === "user" && (
                  <>
                    <button
                      onClick={() => setShowUserDashboard(true)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black text-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer bg-gradient-to-r from-brand-indigo to-brand-violet`}
                      id="launch-seeker-console"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Launch Seeker Console</span>
                    </button>

                    <button
                      onClick={() => setViewFavouritesOnly(!viewFavouritesOnly)}
                      className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-black cursor-pointer transition-all active:scale-95 ${
                        viewFavouritesOnly
                          ? darkMode 
                            ? "border-purple-500/50 bg-purple-950/40 text-purple-400" 
                            : "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : darkMode 
                            ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800" 
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      id="seeker-favs-toggle"
                    >
                      <Heart className="h-4 w-4 fill-current" />
                      <span>My Bookmarks ({favourites.length})</span>
                    </button>

                    <button
                      onClick={() => setShowEnquiriesModal(true)}
                      className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-black transition-all cursor-pointer active:scale-95 ${
                        darkMode 
                          ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800" 
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      id="seeker-enq-modal-trigger"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>My Sent Enquiries</span>
                    </button>
                  </>
                )}

                {currentUser.role === "owner" && (
                  <>
                    <button
                      onClick={() => setShowUserDashboard(true)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black text-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600`}
                      id="launch-owner-console"
                    >
                      <Building className="h-4 w-4 animate-pulse" />
                      <span>Launch Owner Hub Console</span>
                    </button>

                    <button
                      onClick={() => setViewOnlyOwnListings(!viewOnlyOwnListings)}
                      className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-black cursor-pointer transition-all active:scale-95 ${
                        viewOnlyOwnListings
                          ? darkMode 
                            ? "border-purple-500/50 bg-purple-950/40 text-purple-400" 
                            : "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : darkMode 
                            ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800" 
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      id="owner-own-listings-toggle"
                    >
                      <Building className="h-4 w-4" />
                      <span>My Spaces Only</span>
                    </button>

                    <button
                      onClick={() => setShowEnquiriesModal(true)}
                      className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-black transition-all cursor-pointer active:scale-95 ${
                        darkMode 
                          ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800" 
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                      id="owner-enquiries-trigger"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Received Enquiries</span>
                    </button>

                    <button
                      onClick={() => setShowAddListingModal(true)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black text-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer ${
                        darkMode 
                          ? "bg-gradient-to-r from-brand-indigo to-brand-violet shadow-purple-950/30" 
                          : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-100"
                      }`}
                      id="owner-add-listing-trigger"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Post New Listing</span>
                    </button>
                  </>
                )}

                {currentUser.role === "admin" && (
                  <>
                    <div className={`hidden sm:flex gap-4 text-xs font-bold mr-4 ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
                      <div>Total: <span className={darkMode ? "text-white" : "text-slate-900"}>{totalCount}</span></div>
                      <div>Active: <span className="text-emerald-500">{activeCount}</span></div>
                      <div>Pending: <span className="text-amber-500">{pendingCount}</span></div>
                    </div>

                    <button
                      onClick={() => setShowAdminPanel(true)}
                      className={`flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-black text-white hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer bg-gradient-to-r from-purple-600 to-indigo-600`}
                      id="launch-admin-console"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Launch Admin Console</span>
                    </button>

                    <button
                      onClick={() => setViewPendingOnly(!viewPendingOnly)}
                      className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-black cursor-pointer transition-all active:scale-95 ${
                        viewPendingOnly
                          ? "border-amber-500 bg-amber-500/10 text-amber-500"
                          : darkMode 
                            ? "border-slate-800 bg-slate-900/60 text-slate-300" 
                            : "border-slate-200 bg-slate-50 text-slate-700"
                      }`}
                      id="admin-pending-toggle"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Approvals Pending ({pendingCount})</span>
                    </button>
                  </>
                )}

                {/* Common Profile Action */}
                <button
                  onClick={() => setShowProfileModal(true)}
                  className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-black transition-all cursor-pointer active:scale-95 ${
                    darkMode 
                      ? "border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-800" 
                      : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                  id="seeker-profile-trigger"
                >
                  <User className="h-4 w-4" />
                  <span>My Profile</span>
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* CURATED: Trending Indian Cities (Clickable tags with thumbnails) */}
        <section className="space-y-6">
          <div className="flex flex-col space-y-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-purple-400" : "text-brand-indigo"}`}>
              Curated Destinations
            </span>
            <h2 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
              Trending Relocation Cities
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {(cmsBanners.length > 0 ? cmsBanners : TRENDING_CITIES_INFO).map((city) => {
              const isSelected = selectedCity === city.name;
              return (
                <motion.div
                  key={city.name}
                  whileHover={{ y: -5 }}
                  onClick={() => {
                    setSelectedCity(city.name);
                    setViewOnlyOwnListings(false);
                    setViewFavouritesOnly(false);
                    setViewPendingOnly(false);
                  }}
                  className={`group relative overflow-hidden rounded-2xl h-36 border transition-all duration-300 cursor-pointer ${
                    isSelected
                      ? darkMode
                        ? "border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                        : "border-brand-indigo shadow-[0_10px_20px_rgba(79,70,229,0.15)]"
                      : darkMode
                        ? "border-slate-800/80 bg-slate-900/20"
                        : "border-slate-100 bg-white"
                  }`}
                >
                  {/* Curated thumbnail background */}
                  <img
                    src={city.image}
                    alt={city.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-85 group-hover:scale-105 transition-transform duration-500"
                  />
                  {/* Glass tint & gradient shroud */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-slate-950/20" />

                  {/* Curated City Details */}
                  <div className="absolute inset-x-0 bottom-0 p-3 flex flex-col justify-end text-white">
                    <span className="text-xs font-black tracking-tight leading-none flex items-center gap-1">
                      {city.name}
                      {isSelected && (
                        <span className={`h-1.5 w-1.5 rounded-full ${darkMode ? "bg-purple-400" : "bg-cyan-400"}`} />
                      )}
                    </span>
                    <span className="text-[8px] text-slate-300 font-medium line-clamp-1 mt-1 leading-none">
                      {city.slogan}
                    </span>
                    <span className={`text-[8px] font-bold uppercase tracking-wider mt-2 px-1.5 py-0.5 rounded-md self-start ${
                      isSelected 
                        ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                        : "bg-white/10 text-white"
                    }`}>
                      {city.relocations}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* India's First AI Relocation Platform Suite */}
        <React.Suspense fallback={
          <div className="p-12 text-center rounded-3xl border border-dashed border-slate-800 bg-slate-900/10 backdrop-blur-sm">
            <RefreshCw className="h-6 w-6 text-indigo-400 animate-spin mx-auto mb-2" />
            <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Loading AI Relocation Suite...</p>
          </div>
        }>
          <AIRelocationSuite currentCity={selectedCity} darkMode={darkMode} />
        </React.Suspense>

        {/* Featured Listings Carousel / Slider section */}
        {featuredListings.length > 0 && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col space-y-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-purple-400" : "text-brand-indigo"}`}>
                  Hand-Picked
                </span>
                <h2 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                  Elite Relocation Spots in {selectedCity}
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredListings.map((listing) => (
                <div key={listing.id} className="relative">
                  {/* Glowing Featured Border */}
                  <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-indigo via-brand-violet to-pink-500 opacity-20 blur-sm pointer-events-none" />
                  <ListingCard
                    listing={listing}
                    isFavourite={favourites.includes(listing.id)}
                    onToggleFavourite={(id, e) => handleToggleFavourite(id, e)}
                    onSelect={(l) => setSelectedListing(l)}
                    onContactClick={(l, type, e) => handleContactClick(l, type, e)}
                    darkMode={darkMode}
                  />
                  <div className="absolute top-4 right-14 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg px-2 py-1 text-[8px] font-black uppercase tracking-widest shadow-md flex items-center gap-0.5 pointer-events-none">
                    <Star className="h-2.5 w-2.5 fill-current text-white" />
                    <span>Featured</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Premium Categories Cards Grid */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex flex-col space-y-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-purple-400" : "text-brand-indigo"}`}>
                Unified Services
              </span>
              <h2 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-900"}`}>
                Relocation Hubs & Catalog
              </h2>
            </div>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className={`text-xs font-bold transition-colors ${darkMode ? "text-purple-400 hover:text-purple-300" : "text-brand-indigo hover:text-indigo-700"}`}
                id="reset-category-btn"
              >
                Reset to All Hubs
              </button>
            )}
          </div>

          {/* Premium cards mapping categories */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* All card */}
            <motion.div
              whileHover={{ y: -4 }}
              onClick={() => setSelectedCategory("all")}
              className={`flex flex-col p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                selectedCategory === "all"
                  ? darkMode
                    ? "border-purple-500 bg-purple-950/20 shadow-[0_10px_25px_-5px_rgba(168,85,247,0.25)]"
                    : "border-brand-indigo bg-indigo-50/50 shadow-[0_10px_20px_rgba(79,70,229,0.06)]"
                  : darkMode
                    ? "border-slate-800/80 bg-slate-900/40 hover:border-slate-700"
                    : "border-slate-100 bg-white hover:border-slate-200"
              }`}
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-black ${
                selectedCategory === "all"
                  ? "bg-gradient-to-tr from-brand-indigo to-brand-violet text-white"
                  : darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
              }`}>
                <Compass className="h-5 w-5" />
              </div>
              <h4 className={`text-xs font-black tracking-tight mt-4 ${darkMode ? "text-white" : "text-slate-900"}`}>
                All Catalogs
              </h4>
              <p className={`text-[10px] mt-1 line-clamp-2 ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Show all available relocation utilities in city.
              </p>
            </motion.div>

            {Object.keys(CATEGORY_LABELS).map((catKey) => {
              const info = CATEGORY_LABELS[catKey];
              const isSel = selectedCategory === catKey;
              return (
                <motion.div
                  key={catKey}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedCategory(catKey as ListingCategory)}
                  className={`flex flex-col p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                    isSel
                      ? darkMode
                        ? "border-purple-500 bg-purple-950/20 shadow-[0_10px_25px_-5px_rgba(168,85,247,0.25)]"
                        : "border-brand-indigo bg-indigo-50/50 shadow-[0_10px_20px_rgba(79,70,229,0.06)]"
                      : darkMode
                        ? "border-slate-800/80 bg-slate-900/40 hover:border-slate-700"
                        : "border-slate-100 bg-white hover:border-slate-200"
                  }`}
                >
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    isSel
                      ? "bg-gradient-to-tr from-brand-indigo to-brand-violet text-white"
                      : darkMode ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700"
                  }`}>
                    {getCategoryIcon(catKey)}
                  </div>
                  <h4 className={`text-xs font-black tracking-tight mt-4 leading-tight truncate ${darkMode ? "text-white" : "text-slate-900"}`}>
                    {info.label}
                  </h4>
                  <p className={`text-[9px] mt-1 leading-snug line-clamp-2 font-medium ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                    {info.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Dynamic Listings Feed Title, Filters, and Grid */}
        <section className="space-y-6 pt-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4 transition-all ${
            darkMode ? 'border-slate-800/80' : 'border-slate-100'
          }">
            <div className="flex items-baseline gap-2.5">
              <h2 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
                {selectedCategory === "all" ? "Available Relocation Listings" : CATEGORY_LABELS[selectedCategory]?.label}
              </h2>
              <span className={`text-xs font-extrabold ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                ({filteredListings.length} verified item{filteredListings.length === 1 ? "" : "s"} found)
              </span>
            </div>

            {/* Clear filters utility */}
            {(searchQuery || selectedCategory !== "all" || viewFavouritesOnly || viewOnlyOwnListings || viewPendingOnly) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setViewFavouritesOnly(false);
                  setViewOnlyOwnListings(false);
                  setViewPendingOnly(false);
                }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-black border transition-all cursor-pointer ${
                  darkMode
                    ? "border-slate-800 bg-slate-900/40 text-slate-300 hover:text-white"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                }`}
                id="reset-all-filters"
              >
                Clear Active Filters
              </button>
            )}
          </div>

          {/* Listings Feed Grid */}
          {isListingsLoading ? (
            <div className={`flex flex-col items-center justify-center py-20 rounded-3xl border ${
              darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <RefreshCw className={`h-8 w-8 animate-spin mb-2 ${darkMode ? "text-purple-400" : "text-brand-indigo"}`} />
              <p className={`text-xs font-bold ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                Querying CityMate cloud nodes...
              </p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className={`text-center py-20 rounded-3xl border px-6 ${
              darkMode ? "bg-slate-900/20 border-slate-800" : "bg-white border-slate-100"
            }`}>
              <Compass className={`mx-auto h-12 w-12 mb-3 ${darkMode ? "text-slate-700" : "text-slate-300"}`} />
              <h3 className={`text-sm font-black ${darkMode ? "text-white" : "text-slate-800"}`}>
                No Co-Living Spaces / Providers Found
              </h3>
              <p className={`text-xs mt-1.5 max-w-sm mx-auto leading-normal ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                We couldn't locate matching listings in {selectedCity} under this category. Try switching the category hub above or clear filters to see more.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("all");
                  setViewFavouritesOnly(false);
                  setViewOnlyOwnListings(false);
                  setViewPendingOnly(false);
                }}
                className={`mt-5 rounded-xl px-5 py-2.5 text-xs font-black text-white hover:scale-105 transition-all cursor-pointer ${
                  darkMode ? "bg-gradient-to-r from-brand-indigo to-brand-violet" : "bg-slate-950"
                }`}
              >
                Show All Listings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div key={listing.id} className="relative flex flex-col">
                  <ListingCard
                    listing={listing}
                    isFavourite={favourites.includes(listing.id)}
                    onToggleFavourite={(id, e) => handleToggleFavourite(id, e)}
                    onSelect={(l) => setSelectedListing(l)}
                    onContactClick={(l, type, e) => handleContactClick(l, type, e)}
                    darkMode={darkMode}
                  />

                   {/* Admin inline moderation panel */}
                  {currentUser && currentUser.role === "admin" && (
                    <div className={`mt-2 rounded-xl p-2.5 flex items-center justify-between border shadow-sm ${
                      darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                    }`}>
                      <span className={`text-[9px] font-black uppercase tracking-widest pl-1 ${
                        darkMode ? "text-slate-500" : "text-slate-400"
                      }`}>
                        Admin: {listing.status}
                      </span>
                      <div className="flex gap-1.5">
                        {listing.status === "pending" && (
                          <>
                            <button
                              onClick={(e) => handleAdminApproveListing(listing, true, e)}
                              className="rounded-lg bg-emerald-600 px-2.5 py-1 text-[9px] font-extrabold uppercase text-white hover:bg-emerald-500 cursor-pointer"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => handleAdminApproveListing(listing, false, e)}
                              className="rounded-lg bg-amber-600 px-2.5 py-1 text-[9px] font-extrabold uppercase text-white hover:bg-amber-500 cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        <button
                          onClick={(e) => handleAdminDeleteListing(listing.id, e)}
                          className="rounded-lg bg-red-600 px-2.5 py-1 text-[9px] font-extrabold uppercase text-white hover:bg-red-500 cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Owner inline management panel */}
                  {currentUser && currentUser.role === "owner" && listing.ownerId === currentUser.uid && (
                    <div className={`mt-2 rounded-xl p-2.5 flex items-center justify-between border shadow-sm ${
                      darkMode ? "bg-slate-950 border-slate-800" : "bg-slate-100 border-slate-200"
                    }`}>
                      <div className="flex flex-col">
                        <span className={`text-[9px] font-black uppercase tracking-widest pl-1 ${
                          darkMode ? "text-slate-500" : "text-slate-400"
                        }`}>
                          Status: {listing.status}
                        </span>
                        {listing.status === "pending" && (
                          <span className="text-[8px] text-amber-500 font-bold pl-1 mt-0.5">Awaiting Review</span>
                        )}
                        {listing.status === "active" && (
                          <span className="text-[8px] text-emerald-500 font-bold pl-1 mt-0.5">Live on Feed</span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingListing(listing);
                            setShowAddListingModal(true);
                          }}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-[9px] font-extrabold uppercase text-white hover:bg-indigo-500 cursor-pointer transition-all active:scale-95"
                        >
                          Edit
                        </button>
                        <button
                          onClick={(e) => handleOwnerDeleteListing(listing.id, e)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-[9px] font-extrabold uppercase text-white hover:bg-red-500 cursor-pointer transition-all active:scale-95"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Futuristic Statistics Dashboard */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-purple-400" : "text-brand-indigo"}`}>
              Verified Telemetry
            </span>
            <h2 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
              Relocation Metrics & Validation
            </h2>
            <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
              Built on transparent performance criteria to guarantee absolute security.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {(cmsStats.length > 0 ? cmsStats : [
              { label: "Trusted Relocations", val: "15,400+", desc: "Across 8 metro areas" },
              { label: "Vetted PG Rating", val: "4.92 ★", desc: "Based on 3k+ audits" },
              { label: "Average Response Time", val: "1.8 Min", desc: "Instant AI Buddy consultation" },
              { label: "Verified Providers", val: "100%", desc: "Checked directly on-site" }
            ]).map((stat, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border text-center relative overflow-hidden transition-all duration-300 ${
                  darkMode
                    ? "border-slate-800 bg-slate-900/30 hover:border-purple-500/30"
                    : "border-slate-100 bg-white shadow-sm hover:border-brand-indigo/30"
                }`}
              >
                <div className="absolute top-0 left-0 h-10 w-10 rounded-full bg-brand-indigo/5 blur-lg" />
                <p className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                  {stat.label}
                </p>
                <p className={`text-3xl font-black tracking-tight mt-2 text-transparent bg-clip-text bg-gradient-to-r ${
                  darkMode ? "from-purple-400 to-pink-400" : "from-brand-blue to-brand-indigo"
                }`}>
                  {stat.val}
                </p>
                <p className={`text-[10px] font-bold mt-1 ${darkMode ? "text-slate-600" : "text-slate-400"}`}>
                  {stat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Showcase */}
        <section className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-purple-400" : "text-brand-indigo"}`}>
              Relocator Stories
            </span>
            <h2 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
              Trusted by 10,000+ Professionals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(cmsTestimonials.length > 0 ? cmsTestimonials : TESTIMONIALS).map((test, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border flex flex-col justify-between relative overflow-hidden transition-all duration-300 ${
                  darkMode
                    ? "border-slate-800 bg-slate-900/30"
                    : "border-slate-100 bg-white shadow-sm"
                }`}
              >
                <span className={`absolute top-2 right-4 text-6xl font-serif select-none pointer-events-none opacity-10 ${
                  darkMode ? "text-purple-500" : "text-slate-400"
                }`}>
                  “
                </span>
                <p className={`text-xs italic leading-relaxed z-10 ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  "{test.quote}"
                </p>

                <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100/10 z-10">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center font-black text-sm ${
                    darkMode ? "bg-purple-950/60 text-purple-400 border border-purple-900/40" : "bg-indigo-50 text-brand-indigo"
                  }`}>
                    {test.avatar}
                  </div>
                  <div>
                    <h5 className={`text-xs font-extrabold ${darkMode ? "text-white" : "text-slate-900"}`}>
                      {test.author}
                    </h5>
                    <p className={`text-[10px] ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                      {test.role} • <span className="font-bold">{test.city}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Partner Logos Grayscale Showcase */}
        <section className={`py-6 border-y text-center space-y-4 ${
          darkMode ? "border-slate-800/80" : "border-slate-100"
        }`}>
          <p className={`text-[9px] font-black uppercase tracking-widest ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
            Elite Ecosystem Integrations & Providers
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-4 opacity-55 saturate-0 hover:saturate-100 transition-all duration-300">
            {(cmsPartners.length > 0 ? cmsPartners : ["Stanza Living", "NoBroker", "Nestaway", "MagicBricks", "Housing.com"]).map((partner) => (
              <span
                key={partner}
                className={`text-sm sm:text-base font-black tracking-tight leading-none ${
                  darkMode ? "text-white" : "text-slate-900"
                }`}
              >
                {partner}
              </span>
            ))}
          </div>
        </section>

        {/* Dynamic CMS Blog Posts Section */}
        {cmsBlogs.length > 0 && (
          <section className="space-y-8">
            <div className="flex flex-col space-y-1 text-center max-w-xl mx-auto">
              <span className={`text-[10px] font-black uppercase tracking-widest ${darkMode ? "text-purple-400" : "text-brand-indigo"}`}>
                Knowledge Hub
              </span>
              <h2 className={`text-2xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
                Expert Relocation Insights & Guides
              </h2>
              <p className={`text-xs ${darkMode ? "text-slate-500" : "text-slate-400"}`}>
                Handy advice, safety guidelines, and neighborhood deep dives to make your transition seamless.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {cmsBlogs.map((blog) => (
                <div
                  key={blog.id}
                  className={`p-5 rounded-3xl border flex flex-col md:flex-row gap-5 transition-all duration-300 ${
                    darkMode
                      ? "border-slate-800 bg-slate-900/20 hover:border-purple-500/30"
                      : "border-slate-100 bg-white shadow-sm hover:border-brand-indigo/30"
                  }`}
                >
                  <div className="h-36 w-full md:w-44 rounded-2xl overflow-hidden shrink-0 border border-slate-100/10">
                    <img
                      src={blog.image || "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=300&q=80"}
                      alt={blog.title}
                      className="h-full w-full object-cover hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex flex-col justify-between py-1">
                    <div>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 mb-2">
                        <span>{blog.date}</span>
                        <span>•</span>
                        <span>By {blog.author}</span>
                      </div>
                      <h4 className={`text-base font-black tracking-tight leading-snug line-clamp-2 ${darkMode ? "text-white" : "text-slate-950"}`}>
                        {blog.title}
                      </h4>
                      <p className={`text-xs mt-1.5 leading-relaxed line-clamp-2 ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
                        {blog.excerpt}
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedBlog(blog)}
                      className={`text-xs font-black underline text-left mt-3 self-start ${
                        darkMode ? "text-purple-400 hover:text-purple-300" : "text-brand-indigo hover:text-indigo-700"
                      }`}
                    >
                      Read Complete Article &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Download App Sleek Glassmorphic Section */}
        <section className={`relative overflow-hidden rounded-3xl border p-6 sm:p-12 md:p-16 flex flex-col lg:flex-row items-center justify-between gap-10 ${
          darkMode
            ? "border-slate-800 bg-slate-900/40 shadow-black/40"
            : "bg-white border-slate-100 shadow-xl shadow-slate-100/40"
        }`}>
          <div className="absolute top-0 right-0 h-64 w-64 rounded-full bg-brand-violet/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-blue/5 blur-3xl" />

          <div className="space-y-6 max-w-lg relative z-10 text-left">
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[9px] font-black uppercase tracking-widest border ${
              darkMode ? "bg-purple-950/40 text-purple-400 border-purple-500/30" : "bg-indigo-50 text-brand-indigo border-indigo-100"
            }`}>
              <Sparkles className="h-3 w-3" /> Relocate on the Go
            </span>
            <h2 className={`text-3xl font-black tracking-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
              Download CityMate Mobile
            </h2>
            <p className={`text-xs leading-relaxed ${darkMode ? "text-slate-400" : "text-slate-600"}`}>
              Unlock real-time push alerts for budget PG vacancies, track Packers & Movers trucks via map satellite, and consult our AI Buddy instantly with native audio support.
            </p>

            <ul className="space-y-2.5 text-xs font-semibold">
              {[
                "Direct WhatsApp integration in 1 tap",
                "Instant alerts for verified rooms matching budget",
                "Completely brokerage free Indian listings catalog"
              ].map((b, i) => (
                <li key={i} className="flex items-center gap-2.5">
                  <div className={`h-5 w-5 rounded-md flex items-center justify-center ${
                    darkMode ? "bg-purple-950/60 text-purple-400" : "bg-indigo-50 text-brand-indigo"
                  }`}>
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <span className={darkMode ? "text-slate-300" : "text-slate-700"}>{b}</span>
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap gap-3.5 pt-4">
              <button className={`px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                darkMode ? "bg-white text-slate-950" : "bg-slate-950 text-white hover:bg-slate-900"
              }`}>
                App Store Download
              </button>
              <button className={`px-5 py-3 rounded-xl text-xs font-black transition-all cursor-pointer hover:scale-105 active:scale-95 border ${
                darkMode ? "border-slate-800 text-white hover:bg-slate-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
              }`}>
                Google Play Store
              </button>
            </div>
          </div>

          {/* Interactive QR Mockup */}
          <div className={`p-6 rounded-3xl border flex flex-col items-center justify-center text-center max-w-[240px] shrink-0 relative z-10 ${
            darkMode ? "border-slate-800 bg-slate-950" : "border-slate-100 bg-slate-50"
          }`}>
            <QrCode className={`h-36 w-36 ${darkMode ? "text-white" : "text-slate-800"}`} />
            <p className={`text-[10px] font-black uppercase tracking-widest mt-4 ${
              darkMode ? "text-purple-400" : "text-brand-indigo"
            }`}>
              Scan to Download
            </p>
            <p className="text-[9px] text-slate-400 mt-1 leading-snug">
              Compatible with iOS 15.0+ and Android 9.0+
            </p>
          </div>
        </section>

      </main>

      {/* Floating AI Chat Assistant */}
      <CityMateBuddy currentCity={selectedCity} currentCategory={selectedCategory} darkMode={darkMode} />

      {/* MODAL SYSTEM (Suspended Lazy Bundles) */}
      <React.Suspense fallback={null}>
        {/* MODAL: Auth Screen */}
        {showAuthModal && (
          <MockAuthModal
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={handleLoginSuccess}
          />
        )}

        {/* MODAL: Detailed Listing Specs */}
        {selectedListing && (
          <ListingDetailModal
            listing={selectedListing}
            onClose={() => setSelectedListing(null)}
            currentUser={currentUser}
            isFavourite={favourites.includes(selectedListing.id)}
            onToggleFavourite={(id) => handleToggleFavourite(id)}
            onContactClick={(l, type) => handleContactClick(l, type)}
          />
        )}

        {/* MODAL: Owner Add Listing */}
        {showAddListingModal && currentUser && (
          <OwnerAddListingModal
            currentUser={currentUser}
            editingListing={editingListing || undefined}
            onClose={() => {
              setShowAddListingModal(false);
              setEditingListing(null);
            }}
            onSuccess={handleAddListingSuccess}
          />
        )}

        {/* MODAL: Profile Settings (Phase 4) */}
        {showProfileModal && currentUser && (
          <ProfileModal
            currentUser={currentUser}
            onClose={() => setShowProfileModal(false)}
            onUpdate={(updatedProfile) => {
              setCurrentUser(updatedProfile);
            }}
            darkMode={darkMode}
          />
        )}

        {/* MODAL: Sent / Received Enquiries List */}
        {showEnquiriesModal && currentUser && (
          <EnquiryListModal
            currentUser={currentUser}
            onClose={() => setShowEnquiriesModal(false)}
          />
        )}

        {/* MODAL: Unified Seeker / Owner Dashboard Hub */}
        {showUserDashboard && currentUser && (
          <UserDashboardModal
            currentUser={currentUser}
            onClose={() => setShowUserDashboard(false)}
            onUpdateProfile={(updatedProfile) => {
              setCurrentUser(updatedProfile);
            }}
            onViewListingDetail={(listing) => {
              setSelectedListing(listing);
            }}
            onAddListingClick={() => {
              setShowUserDashboard(false);
              setShowAddListingModal(true);
            }}
            onEditListingClick={(listing) => {
              setShowUserDashboard(false);
              setEditingListing(listing);
              setShowAddListingModal(true);
            }}
            darkMode={darkMode}
          />
        )}

        {/* MODAL: Complete Admin Moderation Panel */}
        {showAdminPanel && currentUser && (
          <AdminPanelModal
            currentUser={currentUser}
            onClose={() => setShowAdminPanel(false)}
            darkMode={darkMode}
            onRefreshListings={() => {}}
            onRefreshCMS={() => {}}
          />
        )}
      </React.Suspense>

      {/* MODAL: Full Blog Post Reader */}
      {selectedBlog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 border flex flex-col max-h-[85vh] transition-all duration-300 animate-in fade-in zoom-in-95 duration-200 ${
            darkMode
              ? "bg-slate-950 border-slate-800 text-white shadow-2xl shadow-black/60"
              : "bg-white border-slate-100 text-slate-800 shadow-2xl"
          }`}>
            <button
              onClick={() => setSelectedBlog(null)}
              className={`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full border shadow-sm cursor-pointer transition-transform active:scale-90 ${
                darkMode
                  ? "border-slate-800 bg-slate-900 text-slate-400 hover:text-white"
                  : "border-slate-200 bg-white text-slate-400 hover:text-slate-600"
              }`}
            >
              <X className="h-4 w-4" />
            </button>

            <div className="overflow-y-auto pr-1 space-y-5">
              <div className="h-48 md:h-64 w-full rounded-2xl overflow-hidden border border-slate-100/10">
                <img
                  src={selectedBlog.image}
                  alt={selectedBlog.title}
                  className="h-full w-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                  <span>{selectedBlog.date}</span>
                  <span>•</span>
                  <span>By {selectedBlog.author}</span>
                </div>
                <h3 className={`text-xl sm:text-2xl font-black tracking-tight leading-tight ${darkMode ? "text-white" : "text-slate-950"}`}>
                  {selectedBlog.title}
                </h3>
              </div>

              <p className={`text-xs leading-relaxed whitespace-pre-wrap font-medium ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                {selectedBlog.content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modern High-End Footer */}
      <footer className={`border-t py-16 mt-20 transition-all ${
        darkMode ? "border-slate-800 bg-slate-950/60" : "border-slate-200 bg-white"
      }`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center text-slate-400 space-y-6">
          <div className="flex justify-center items-center gap-1.5 font-extrabold text-lg">
            <div className={`h-8 w-8 rounded-xl font-black text-white flex items-center justify-center text-xs ${
              darkMode 
                ? "bg-gradient-to-tr from-brand-indigo via-brand-violet to-purple-500 shadow-[0_0_15px_rgba(124,58,237,0.3)]" 
                : "bg-brand-indigo text-white"
            }`}>
              CM
            </div>
            <span className={darkMode ? "text-white" : "text-slate-800"}>CityMate India</span>
          </div>
          <p className="text-xs max-w-lg mx-auto leading-relaxed">
            CityMate India is a premium zero-brokerage relocation utility helping professionals and students smoothly transition to major Indian metropolises.
          </p>
          
          <div className={`flex flex-wrap justify-center gap-x-6 gap-y-2.5 text-xs font-black pt-4 ${
            darkMode ? "text-slate-400" : "text-slate-600"
          }`}>
            {INDIAN_CITIES.map((c) => (
              <span
                key={c}
                onClick={() => {
                  setSelectedCity(c);
                  setViewOnlyOwnListings(false);
                  setViewFavouritesOnly(false);
                  setViewPendingOnly(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={`cursor-pointer hover:underline transition-all ${
                  selectedCity === c 
                    ? darkMode ? "text-purple-400" : "text-brand-indigo" 
                    : "opacity-60 hover:opacity-100"
                }`}
              >
                {c}
              </span>
            ))}
          </div>

          <p className="text-[10px] text-slate-500 pt-6 border-t border-slate-100/10 max-w-sm mx-auto">
            © 2026 CityMate.in. All rights reserved. Crafted as a high-performance, single-page cloud application.
          </p>
        </div>
      </footer>

      {/* Real-time Toast Notifications Portal */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`p-4 rounded-2xl border shadow-2xl pointer-events-auto flex items-start gap-3 backdrop-blur-xl transition-all duration-300 ${
                darkMode 
                  ? "bg-slate-900/90 border-slate-800 text-white shadow-black/60" 
                  : "bg-white/95 border-slate-100 text-slate-800 shadow-slate-200/50"
              }`}
            >
              <div className={`mt-0.5 rounded-lg p-1.5 shrink-0 ${
                t.type === "success" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                  : t.type === "alert" 
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : t.type === "message"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
              }`}>
                {t.type === "success" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : t.type === "alert" ? (
                  <AlertCircle className="h-4 w-4" />
                ) : t.type === "message" ? (
                  <MessageSquare className="h-4 w-4" />
                ) : (
                  <Info className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-wider">{t.title}</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed">{t.message}</p>
              </div>
              <button 
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/15 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          ))}
          {telescopeToast && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className={`p-4 rounded-2xl border shadow-2xl pointer-events-auto flex items-start gap-3 backdrop-blur-xl transition-all duration-300 ${
                darkMode 
                  ? "bg-slate-900/95 border-purple-500/30 text-white shadow-black/60 shadow-[0_0_15px_rgba(168,85,247,0.15)]" 
                  : "bg-white/95 border-indigo-100 text-slate-800 shadow-slate-200/50"
              }`}
            >
              <div className="mt-0.5 rounded-lg p-1.5 shrink-0 bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Wifi className="h-4 w-4 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase tracking-wider text-purple-400">Telescope Alert</p>
                <p className="text-[11px] font-bold text-slate-400 mt-1 leading-relaxed">{telescopeToast}</p>
              </div>
              <button 
                onClick={dismissTelescope}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800/15 transition-colors cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
