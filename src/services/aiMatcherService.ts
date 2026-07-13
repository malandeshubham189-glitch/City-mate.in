import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Listing } from "../types";

export interface RelocationPreferences {
  maxBudget: number;
  workspaceLocality?: string; // e.g. "Viman Nagar" or "Hinjawadi"
  preferredCategory?: string; // e.g. "pg" or "flats"
  importanceWeights?: {
    budget: number;       // 0 to 1
    proximity: number;    // 0 to 1
    safety: number;       // 0 to 1
    quality: number;      // 0 to 1
  };
}

export interface MatchedListing extends Listing {
  matchPercentage: number;
  matchFactors: {
    budgetScore: number;
    proximityScore: number;
    safetyScore: number;
    qualityScore: number;
  };
}

// Local area matrices representing safety scores and standard metrics for popular localities
export const LOCALITY_METRICS: Record<string, { safetyScore: number; transportConnectivity: number }> = {
  "Viman Nagar": { safetyScore: 95, transportConnectivity: 90 },
  "Hinjawadi": { safetyScore: 88, transportConnectivity: 80 },
  "Koregaon Park": { safetyScore: 92, transportConnectivity: 85 },
  "Kalyani Nagar": { safetyScore: 94, transportConnectivity: 88 },
  "Kothrud": { safetyScore: 96, transportConnectivity: 92 },
  "Baner": { safetyScore: 91, transportConnectivity: 84 },
  "HSR Layout": { safetyScore: 93, transportConnectivity: 89 },
  "Indiranagar": { safetyScore: 90, transportConnectivity: 92 },
  "Whitefield": { safetyScore: 87, transportConnectivity: 78 },
  "Koramanagala": { safetyScore: 89, transportConnectivity: 85 },
};

/**
 * Calculates a match percentage (0 to 100) for a listing based on the user's relocation preferences.
 */
export function calculateMatchPercentage(
  listing: Listing,
  prefs: RelocationPreferences
): {
  matchPercentage: number;
  matchFactors: {
    budgetScore: number;
    proximityScore: number;
    safetyScore: number;
    qualityScore: number;
  };
} {
  const weights = prefs.importanceWeights || {
    budget: 0.4,
    proximity: 0.3,
    safety: 0.15,
    quality: 0.15,
  };

  // Normalize weights so they sum to 1
  const totalWeight = weights.budget + weights.proximity + weights.safety + weights.quality;
  const normWeights = {
    budget: weights.budget / totalWeight,
    proximity: weights.proximity / totalWeight,
    safety: weights.safety / totalWeight,
    quality: weights.quality / totalWeight,
  };

  // 1. Budget Score (0 to 100)
  // Ideal is listing price <= maxBudget. If higher, apply a soft budget penalty up to 50% over budget.
  let budgetScore = 100;
  if (listing.price > prefs.maxBudget) {
    const diffRatio = (listing.price - prefs.maxBudget) / prefs.maxBudget;
    budgetScore = Math.max(0, 100 - (diffRatio * 150)); // Fast drop-off for higher budget
  } else {
    // Under budget is rewarded, cheaper is slightly better but maxes at 100
    const savingsRatio = (prefs.maxBudget - listing.price) / prefs.maxBudget;
    budgetScore = 90 + (savingsRatio * 10);
  }

  // 2. Proximity Score (0 to 100)
  // If user specified workspace locality, score higher if in same locality, otherwise simulate distance
  let proximityScore = 50; // default medium score
  if (prefs.workspaceLocality) {
    if (listing.locality.toLowerCase().trim() === prefs.workspaceLocality.toLowerCase().trim()) {
      proximityScore = 100;
    } else {
      // Adjacent/nearby simulated scores
      const sharedKeywords = ["nagar", "layout", "park"];
      const hasSharedType = sharedKeywords.some(
        (kw) => listing.locality.toLowerCase().includes(kw) && prefs.workspaceLocality!.toLowerCase().includes(kw)
      );
      proximityScore = hasSharedType ? 70 : 40;
    }
  }

  // 3. Safety Score (0 to 100)
  // Retrieve from LOCALITY_METRICS database, fallback to 80
  const areaData = LOCALITY_METRICS[listing.locality] || { safetyScore: 82 };
  const safetyScore = areaData.safetyScore;

  // 4. Quality Score (0 to 100)
  // Based on listing rating, verification status, and isFeatured
  let qualityScore = (listing.rating || 4.0) * 20; // Scale 5-star to 100
  if (listing.isVerified) {
    qualityScore = Math.min(100, qualityScore + 10); // +10 points premium for verified
  }
  if (listing.isFeatured) {
    qualityScore = Math.min(100, qualityScore + 5);
  }

  // Weighted sum
  const finalScore = Math.round(
    budgetScore * normWeights.budget +
    proximityScore * normWeights.proximity +
    safetyScore * normWeights.safety +
    qualityScore * normWeights.quality
  );

  return {
    matchPercentage: Math.min(100, Math.max(0, finalScore)),
    matchFactors: {
      budgetScore: Math.round(budgetScore),
      proximityScore: Math.round(proximityScore),
      safetyScore: Math.round(safetyScore),
      qualityScore: Math.round(qualityScore),
    },
  };
}

/**
 * Custom query builders to query active listings from Firestore and rank them by match percentage.
 */
export async function fetchAIRecommendedListings(
  prefs: RelocationPreferences,
  limitCount = 6
): Promise<MatchedListing[]> {
  try {
    const listingsColRef = collection(db, "listings");
    // Get all active listings to rank (or query by preferred category first)
    let q = query(listingsColRef, where("status", "==", "active"), limit(40));
    
    if (prefs.preferredCategory && prefs.preferredCategory !== "all") {
      q = query(
        listingsColRef,
        where("status", "==", "active"),
        where("category", "==", prefs.preferredCategory),
        limit(30)
      );
    }

    const querySnapshot = await getDocs(q);
    const matchedListings: MatchedListing[] = [];

    querySnapshot.forEach((docSnap) => {
      const listing = { id: docSnap.id, ...docSnap.data() } as Listing;
      const { matchPercentage, matchFactors } = calculateMatchPercentage(listing, prefs);
      matchedListings.push({
        ...listing,
        matchPercentage,
        matchFactors,
      });
    });

    // Sort descending by match percentage
    matchedListings.sort((a, b) => b.matchPercentage - a.matchPercentage);

    return matchedListings.slice(0, limitCount);
  } catch (err) {
    console.error("fetchAIRecommendedListings error:", err);
    return [];
  }
}
