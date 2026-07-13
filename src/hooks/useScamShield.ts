import { useMemo } from "react";
import { Listing } from "../types";

export interface ScamShieldReport {
  safetyRating: "safe" | "warning" | "critical";
  reasons: string[];
  pricingAssessment: string;
  isFlagged: boolean;
  trustIndex: number; // 0 to 100
}

// Median monthly prices for common localities and categories to calculate deviation ratio
const LOCALITY_MEDIAN_PRICES: Record<string, Record<string, number>> = {
  "viman nagar": { pg: 9000, flats: 26000, hostels: 8000, rooms: 12000 },
  "hinjawadi": { pg: 6500, flats: 18000, hostels: 5500, rooms: 8000 },
  "hsr layout": { pg: 10000, flats: 30000, hostels: 8500, rooms: 13000 },
  "indiranagar": { pg: 12000, flats: 38000, hostels: 10000, rooms: 15000 },
  "whitefield": { pg: 8000, flats: 24000, hostels: 7000, rooms: 10000 },
  "koregaon park": { pg: 11000, flats: 35000, hostels: 9500, rooms: 14000 },
};

/**
 * Scans a listing's metadata to detect rental scams, low-price baits, or unverified contact data.
 */
export function useScamShield(listing: Listing | null | undefined): ScamShieldReport {
  return useMemo(() => {
    if (!listing) {
      return {
        safetyRating: "safe",
        reasons: [],
        pricingAssessment: "No data loaded.",
        isFlagged: false,
        trustIndex: 100,
      };
    }

    const reasons: string[] = [];
    let trustIndex = 100;
    const cleanLocality = listing.locality.toLowerCase().trim();
    const cleanCategory = listing.category.toLowerCase().trim();

    // 1. Pricing Deviation Check (Too good to be true bait-and-switch)
    const categoryMedianMap = LOCALITY_MEDIAN_PRICES[cleanLocality] || LOCALITY_MEDIAN_PRICES["viman nagar"];
    const medianPrice = categoryMedianMap[cleanCategory] || 10000;
    
    let pricingAssessment = "Pricing matches average standards for this locality.";

    // Compare actual price against standard median
    if (listing.price < medianPrice * 0.45) {
      reasons.push(
        `Critical: Extremely low price (${Math.round((listing.price / medianPrice) * 100)}% of typical local rate). Possible advance-fee fraud bait.`
      );
      trustIndex -= 45;
      pricingAssessment = "Suspiciously Low (possible bait pricing).";
    } else if (listing.price < medianPrice * 0.65) {
      reasons.push(
        `Warning: Price is about ${Math.round((listing.price / medianPrice) * 100)}% of average market price. Proceed with caution.`
      );
      trustIndex -= 20;
      pricingAssessment = "Below Market Average.";
    } else if (listing.price > medianPrice * 1.8) {
      pricingAssessment = "Premium Pricing (Higher than standard local indexes).";
    }

    // 2. Verified status check
    if (!listing.isVerified) {
      reasons.push("Unverified Listing: Property has not gone through administrative on-site document check.");
      trustIndex -= 15;
    }

    // 3. Contact Pattern Checks
    const phone = listing.contactNumber || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");

    // Generic mock phone numbers or sequential patterns (e.g., "1234567890", duplicate chains)
    if (cleanPhone === "1234567890" || cleanPhone === "9876543210") {
      reasons.push("Critical Indicator: Developer default dummy phone number found.");
      trustIndex -= 30;
    } else if (/^(\d)\1{7,}$/.test(cleanPhone)) {
      // repeating numbers like 9999999999
      reasons.push("Critical Indicator: Invalid contact number format detected (repeated single-digit sequences).");
      trustIndex -= 25;
    } else if (cleanPhone.length > 0 && cleanPhone.length < 10) {
      reasons.push("Warning: Provided contact number is shorter than required local standard.");
      trustIndex -= 15;
    }

    // Email address domain check (Suspicious domains or dummy accounts)
    const email = (listing.email || "").toLowerCase();
    if (email.includes("test@") || email.includes("dummy") || email.includes("example.com")) {
      reasons.push("Critical Indicator: Placeholder email contact details found.");
      trustIndex -= 20;
    }

    // 4. Determine safety tier
    let safetyRating: "safe" | "warning" | "critical" = "safe";
    if (trustIndex <= 45) {
      safetyRating = "critical";
    } else if (trustIndex <= 80) {
      safetyRating = "warning";
    }

    return {
      safetyRating,
      reasons,
      pricingAssessment,
      isFlagged: safetyRating !== "safe",
      trustIndex: Math.max(0, trustIndex),
    };
  }, [listing]);
}
