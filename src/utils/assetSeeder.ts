import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

// High-resolution Unsplash assets for cities to secure premium visual layouts
export const PREMIUM_CITY_ASSETS: Record<string, { coverImage: string; name: string; tagline: string }> = {
  pune: {
    coverImage: "https://images.unsplash.com/photo-1601919051950-bb9f3ffb3fee?auto=format&fit=crop&w=800&q=80",
    name: "Pune",
    tagline: "Oxford of the East & Academic-IT Convergence Hub"
  },
  mumbai: {
    coverImage: "https://images.unsplash.com/photo-1566552881560-0be862a7c445?auto=format&fit=crop&w=800&q=80",
    name: "Mumbai",
    tagline: "The Financial Epicenter & Maximum City Matrix"
  },
  jaipur: {
    coverImage: "https://images.unsplash.com/photo-1477584305353-813839efcca0?auto=format&fit=crop&w=800&q=80",
    name: "Jaipur",
    tagline: "The Historic Pink City & Royal Rajasthani Gateway"
  },
  nashik: {
    coverImage: "https://images.unsplash.com/photo-1590001155093-a3c66ab0c3ff?auto=format&fit=crop&w=800&q=80",
    name: "Nashik",
    tagline: "Grape Capital of India & Holy Pilgrimage Hub"
  },
  aurangabad: {
    coverImage: "https://images.unsplash.com/photo-1600100397608-f010e42fa087?auto=format&fit=crop&w=800&q=80",
    name: "Aurangabad (Chhatrapati Sambhajinagar)",
    tagline: "Tourism Capital & City of Gates"
  },
  kolhapur: {
    coverImage: "https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=800&q=80",
    name: "Kolhapur",
    tagline: "Historic Capital & Culinary Heritage"
  },
  latur: {
    coverImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
    name: "Latur",
    tagline: "Educational Hub of Marathwada & Academic Excellence Center"
  },
  nanded: {
    coverImage: "https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80",
    name: "Nanded",
    tagline: "Sacred Pilgrim Center & Historic Gurudwara Site"
  },
  amravati: {
    coverImage: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    name: "Amravati",
    tagline: "Cultural Capital & Major Educational Center"
  },
  solapur: {
    coverImage: "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
    name: "Solapur",
    tagline: "Textile Hub & Gated Fort History"
  },
  jalgaon: {
    coverImage: "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80",
    name: "Jalgaon",
    tagline: "Banana City of India & Golden Hub"
  },
  akola: {
    coverImage: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=800&q=80",
    name: "Akola",
    tagline: "Cotton Capital & Educational Infrastructure"
  },
  ahmednagar: {
    coverImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    name: "Ahmednagar",
    tagline: "Historic Ahmednagar Fort & Sugar Industry Hub"
  },
  satara: {
    coverImage: "https://images.unsplash.com/photo-1477584305353-813839efcca0?auto=format&fit=crop&w=800&q=80",
    name: "Satara",
    tagline: "Valley of Flowers Gateway & Historic Maratha Seat"
  },
  dhule: {
    coverImage: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80",
    name: "Dhule",
    tagline: "Clean, Green & Advanced Transit Corridor"
  }
};

/**
 * Sweeps the firestore dynamic 'cities' collection on app load. If pune, mumbai, or jaipur documents
 * are missing or have broken coverImage values, this automatically repairs them to prevent visual rendering drop.
 */
export async function patchCityAssets(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    for (const [cityId, details] of Object.entries(PREMIUM_CITY_ASSETS)) {
      const cityRef = doc(db, "cities", cityId);
      const snap = await getDoc(cityRef);

      if (!snap.exists()) {
        console.log(`[Asset Seeder] Creating missing city guide for ${cityId}...`);
        const defaultGuide = {
          id: cityId,
          name: details.name,
          state: cityId === "jaipur" ? "Rajasthan" : "Maharashtra",
          tagline: details.tagline,
          coverImage: details.coverImage,
          rentBands: {
            bachelorRoom: cityId === "jaipur" ? "₹4,500 - ₹8,000" : "₹10,000 - ₹18,000",
            flat2BHK: cityId === "jaipur" ? "₹12,000 - ₹20,000" : "₹25,000 - ₹45,000",
            luxuryApartment: cityId === "jaipur" ? "₹25,000 - ₹45,000" : "₹60,000 - ₹1,20,000"
          },
          transport: {
            metroAvailability: cityId === "jaipur" ? "Jaipur Metro Line 1 fully operational from Mansarovar." : "Active transit networks with extensive metro loops.",
            busNetwork: "Local bus transport loops connect prime residential lanes.",
            averageCommuteCost: "₹30 - ₹80 per day",
            keyTips: [
              "Choose Metro for congestion-free travel during business hours.",
              "Download city transit maps for local auto-rickshaw fair reference grids."
            ]
          },
          colleges: [
            { name: cityId === "jaipur" ? "MNIT Jaipur" : "Symbiosis University", type: "Technical / Academic", rating: "4.7/5" }
          ],
          proximityHubs: [
            cityId === "jaipur" ? "Mahindra World City SEZ" : "Rajiv Gandhi Infotech Corridor"
          ],
          safetyScore: 90,
          safetyDetails: "Strong community support, active policing corridors, and safe well-lit residential zones.",
          seoTitle: `Relocation Guide to ${details.name} | CityMate`,
          seoDescription: `Explore rental costs, academic institutions, tech hubs, and security indices in ${details.name}.`,
          seoKeywords: `${details.name} relocation, rent in ${details.name}, PG in ${details.name}`
        };
        await setDoc(cityRef, defaultGuide);
      } else {
        const data = snap.data();
        const hasBrokenImage = !data.coverImage || 
          data.coverImage === "" || 
          data.coverImage.includes("placeholder") || 
          !data.coverImage.startsWith("http");

        if (hasBrokenImage) {
          console.log(`[Asset Seeder] Correcting broken background image url for ${cityId} doc...`);
          await updateDoc(cityRef, {
            coverImage: details.coverImage
          });
        }
      }
    }
    console.log("[Asset Seeder] Unified relocation assets patch scan COMPLETED.");
  } catch (err) {
    console.warn("Asset Seeder bypassed: Network offline or Firestore is constrained.", err);
  }
}
