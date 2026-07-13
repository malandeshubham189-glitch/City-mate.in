import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { CityGuide } from "../types";

export interface SiteConfiguration {
  maintenanceMode: boolean;
  allowedDomains: string[];
  minAppVersion: string;
  systemStatus: "healthy" | "degraded" | "maintenance";
  contactSupportEmail: string;
  apiEndpoints: {
    metroMap: string;
    weatherService: string;
    taxCalculator: string;
  };
}

// Resilient default configuration for site operations
const DEFAULT_SITE_CONFIG: SiteConfiguration = {
  maintenanceMode: false,
  allowedDomains: ["*"],
  minAppVersion: "1.0.0",
  systemStatus: "healthy",
  contactSupportEmail: "support@citymate.in",
  apiEndpoints: {
    metroMap: "https://api.citymate.in/v1/metro",
    weatherService: "https://api.citymate.in/v1/weather",
    taxCalculator: "https://api.citymate.in/v1/tax"
  }
};

// Premium local mock data fallback for cities if connection is lost
const FALLBACK_CITIES: CityGuide[] = [
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
      metroAvailability: "Namma Metro Purple & Green lines fully operational.",
      busNetwork: "BMTC Air-conditioned Volvo buses connect major nodes.",
      averageCommuteCost: "₹40 - ₹120 per day",
      keyTips: [
        "Avoid road transit during 9 AM and 6 PM peak slots.",
        "Secure a smart card to avail 5% discount on Metro."
      ]
    },
    colleges: [
      { name: "IISc Bengaluru", type: "Research & Science", rating: "4.9/5" },
      { name: "RV College of Engineering (RVCE)", type: "Engineering", rating: "4.7/5" }
    ],
    proximityHubs: [
      "Manyata Tech Park (Hebbal)",
      "EcoSpace (Outer Ring Road)",
      "Bagmane Tech Park (C.V. Raman Nagar)"
    ],
    safetyScore: 4.7,
    safetyDetails: "Highly safe and actively patrolled by local security and police units. Safe for night transit.",
    seoTitle: "Relocate to Bengaluru | CityMate Premium Relocation",
    seoDescription: "Seamlessly relocate to Bengaluru with CityMate, finding verified rooms, student PGs, and local meals.",
    seoKeywords: "Bengaluru relocation, PG in Bengaluru, Bangalore flat rental"
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    tagline: "The Financial Epicenter & Island of Dreams",
    coverImage: "https://images.unsplash.com/photo-1570168007204-dfb528c6958f?auto=format&fit=crop&w=800&q=80",
    rentBands: {
      bachelorRoom: "₹18,000 - ₹28,000",
      flat2BHK: "₹45,000 - ₹75,000",
      luxuryApartment: "₹90,000 - ₹1,80,000"
    },
    transport: {
      metroAvailability: "Expanding network, Suburban Locals form the spine.",
      busNetwork: "BEST buses offer clean feeder routes.",
      averageCommuteCost: "₹30 - ₹90 per day",
      keyTips: [
        "Utilize fast local trains rather than slow road lanes.",
        "Avoid rush hours between 8:30-10:30 AM and 5:30-8:30 PM."
      ]
    },
    colleges: [
      { name: "IIT Bombay", type: "Technology & Research", rating: "4.9/5" },
      { name: "St. Xavier's College", type: "Arts & Science", rating: "4.6/5" }
    ],
    proximityHubs: [
      "Bandra-Kurla Complex (BKC)",
      "Nirlon Knowledge Park (Goregaon)",
      "Nariman Point"
    ],
    safetyScore: 4.9,
    safetyDetails: "Extremely safe night culture and 24/7 active surveillance across public transport structures.",
    seoTitle: "Relocate to Mumbai | CityMate Premium Relocation",
    seoDescription: "Find premium accommodation and verified rental rooms in Mumbai, backed by safe legal contracts.",
    seoKeywords: "Mumbai rooms, PG in Bandra, Mumbai rentals"
  }
];

export interface DiagnosticReport {
  timestamp: string;
  firestoreConnected: boolean;
  pathsChecked: {
    citiesExist: boolean;
    siteConfigExists: boolean;
  };
  repairedSiteConfig: boolean;
  repairedCities: boolean;
  error?: string;
}

/**
 * Validates Firestore reference pathways and guarantees safe configuration fallback options.
 */
export async function auditAndInitializeDatabase(): Promise<DiagnosticReport> {
  const report: DiagnosticReport = {
    timestamp: new Date().toISOString(),
    firestoreConnected: false,
    pathsChecked: {
      citiesExist: false,
      siteConfigExists: false
    },
    repairedSiteConfig: false,
    repairedCities: false
  };

  try {
    // 1. Audit /site_configurations/main
    const configDocRef = doc(db, "site_configurations", "main");
    let configSnap;
    try {
      configSnap = await getDoc(configDocRef);
      report.firestoreConnected = true;
    } catch (e) {
      console.warn("Firestore connectivity warning in check. Using resilient mock layer.");
      report.error = e instanceof Error ? e.message : String(e);
      return report;
    }

    if (configSnap.exists()) {
      report.pathsChecked.siteConfigExists = true;
    } else {
      console.log("Creating default site_configurations on initialization...");
      await setDoc(configDocRef, DEFAULT_SITE_CONFIG);
      report.pathsChecked.siteConfigExists = true;
      report.repairedSiteConfig = true;
    }

    // 2. Audit /cities
    const citiesRef = collection(db, "cities");
    const citiesSnap = await getDocs(citiesRef);
    if (!citiesSnap.empty) {
      report.pathsChecked.citiesExist = true;
    } else {
      console.log("Seeding backup cities into Firestore for index queries...");
      for (const city of FALLBACK_CITIES) {
        await setDoc(doc(db, "cities", city.id), city);
      }
      report.pathsChecked.citiesExist = true;
      report.repairedCities = true;
    }

    return report;
  } catch (error) {
    console.error("Critical database auditing exception:", error);
    report.error = error instanceof Error ? error.message : String(error);
    return report;
  }
}

/**
 * Resilient API to fetch site configurations. Instantly catches errors and returns DEFAULT_SITE_CONFIG.
 */
export async function getSiteConfigurationSafe(): Promise<SiteConfiguration> {
  try {
    const configDocRef = doc(db, "site_configurations", "main");
    const snap = await getDoc(configDocRef);
    if (snap.exists()) {
      return snap.data() as SiteConfiguration;
    }
  } catch (e) {
    console.warn("Could not load database configurations safely. Injecting fallback parameters.", e);
  }
  return DEFAULT_SITE_CONFIG;
}

/**
 * Resilient API to fetch cities list. Never throws, returns high quality FALLBACK_CITIES if database is offline.
 */
export async function getCitiesResilient(): Promise<CityGuide[]> {
  try {
    const citiesRef = collection(db, "cities");
    const snap = await getDocs(citiesRef);
    if (!snap.empty) {
      const list: CityGuide[] = [];
      snap.forEach((d) => list.push({ ...d.data(), id: d.id } as CityGuide));
      return list;
    }
  } catch (e) {
    console.warn("Could not query cities collection safely. Serving premium fallback vector.", e);
  }
  return FALLBACK_CITIES;
}
