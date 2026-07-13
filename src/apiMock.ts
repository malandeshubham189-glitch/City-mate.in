/**
 * CityMate India - Client-Side API Mock Interceptor
 * Intercepts calls to /api/* and handles them locally with high-fidelity simulations.
 * This enables the app to run 100% frontend-only and deploy flawlessly on free Vercel.
 */

const SIMULATED_RESPONSES = [
  "Welcome to CityMate India! Moving to a new city can be overwhelming, but I'm here to help. For major hubs like Bengaluru, average PG rents range from ₹8,000 to ₹15,000/month in areas like HSR Layout, Koramangala, and Whitefield. What city are you exploring today?",
  "To find the best local services and Tiffin/Mess options in Pune, we recommend looking around Viman Nagar, Hinjewadi, and Kothrud. Tiffin plans usually range from ₹2,500 to ₹4,000 per month for home-cooked meals.",
  "In Mumbai, space is premium! Shared rooms or PG flats in Andheri, Malad, or Thane are highly sought after. Local trains and Metro lines are your best bet for the daily commute.",
  "For tuition classes and competitive exam preparation, cities like Noida, Delhi (Mukherjee Nagar, Kalu Sarai), and Kota are top education nodes. Check our 'Colleges' or 'Tuition' listings for authenticated providers.",
  "If you are seeking Job openings, Bengaluru and Hyderabad have massive IT/Startup listings, while Gurugram specializes in corporate, consulting, and sales opportunities."
];

const COMMISSION_RATES: Record<string, number> = {
  premium_booking: 0.05,
  property_deposit: 0.02,
  affiliate_referral: 0.08
};

if (typeof window !== "undefined") {
  const originalFetch = window.fetch;

  const customFetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    let url = "";
    if (typeof input === "string") {
      url = input;
    } else if (input instanceof URL) {
      url = input.href;
    } else if (input && typeof input === "object" && "url" in input) {
      url = (input as any).url;
    }

    // Intercept only local relative /api/ calls
    if (url.startsWith("/api/") || url.includes(window.location.origin + "/api/")) {
      const parsedUrl = new URL(url, window.location.origin);
      const pathname = parsedUrl.pathname;
      const method = init?.method?.toUpperCase() || "GET";
      let bodyData: any = {};

      if (init?.body) {
        try {
          if (typeof init.body === "string") {
            bodyData = JSON.parse(init.body);
          }
        } catch (e) {
          console.warn("Failed to parse request body in mock fetch", e);
        }
      }

      console.log(`[Mock API Fetch Interceptor] ${method} ${pathname}`, bodyData);

      // Helper to generate Response objects
      const createResponse = (json: any, status = 200) => {
        return new Response(JSON.stringify(json), {
          status,
          headers: { "Content-Type": "application/json" }
        });
      };

      // 1. /api/chat
      if (pathname === "/api/chat") {
        const messages = bodyData.messages || [];
        const lastMsg = messages.length > 0 ? messages[messages.length - 1].content.toLowerCase() : "";
        let reply = SIMULATED_RESPONSES[0];

        if (lastMsg.includes("pune") || lastMsg.includes("tiffin") || lastMsg.includes("mess")) {
          reply = SIMULATED_RESPONSES[1];
        } else if (lastMsg.includes("mumbai") || lastMsg.includes("rent") || lastMsg.includes("flat")) {
          reply = SIMULATED_RESPONSES[2];
        } else if (lastMsg.includes("tuition") || lastMsg.includes("college") || lastMsg.includes("delhi") || lastMsg.includes("kota")) {
          reply = SIMULATED_RESPONSES[3];
        } else if (lastMsg.includes("job") || lastMsg.includes("bengaluru") || lastMsg.includes("gurugram")) {
          reply = SIMULATED_RESPONSES[4];
        }

        return createResponse({
          content: reply + " (Note: Running in offline/demo AI mode. Intercepted client-side for serverless deployment.)",
          role: "assistant"
        });
      }

      // 2. /api/listings/enhance
      if (pathname === "/api/listings/enhance") {
        const { title, category, locality, city, price, features } = bodyData;
        const featureList = features && features.length > 0 ? features.join(", ") : "Premium amenities";
        const enhancedDescription = `Welcome to this premium ${category || "property"} located in the heart of ${locality || "Koramangala"}, ${city || "Bengaluru"}. Offering exceptional value at ₹${price || "Reasonable"}, this property is perfect for professionals, students, and families seeking a convenient lifestyle. Complemented by high-quality fittings and essential amenities, it provides easy access to nearby transit nodes, markets, and restaurants. Features included: ${featureList}.`;
        const suggestedFeatures = [...(features || []), "24/7 Security", "High-speed Wi-Fi", "Daily Cleaning"];

        return createResponse({
          description: enhancedDescription + " (Enhanced in client-side demo mode)",
          tags: suggestedFeatures
        });
      }

      // 3. /api/relocation/plan
      if (pathname === "/api/relocation/plan") {
        const { currentCity, budget, diet, livingSetup, destination } = bodyData;
        const targetCity = currentCity || "Bengaluru";
        const plan = {
          timeline: [
            {
              time: "3 Weeks Before Move",
              tasks: [
                `Research accommodation options in ${targetCity} near ${destination || "your target hub"}.`,
                "Get quotes from vetted Packers & Movers (estimated ₹4,500 - ₹9,500 depending on distance).",
                "Declutter and list unwanted items for sale."
              ],
              tips: "Tip: Bengaluru security deposits are usually 6-10 months, but you can negotiate down to 4-5 months if paying rent in advance."
            },
            {
              time: "1 Week Before Move",
              tasks: [
                "Confirm transportation and packing slot.",
                "Shortlist PGs or Flats for visiting on the first 2 days.",
                "Look up tiffin service partners around your neighborhood."
              ],
              tips: "Never pay any 'token money' or 'visiting charges' over WhatsApp without inspecting the flat in person!"
            },
            {
              time: "Move Day & Settling In",
              tasks: [
                "Check in to your temporary stay or new co-living house.",
                "Submit Aadhaar or Passport KYC documents to the owner to get your trust score verified.",
                "Set up a local metro travel card for seamless commute."
              ],
              tips: `Download the local transit app and map out your daily path to ${destination || "work/college"}.`
            }
          ],
          neighborhoods: targetCity === "Bengaluru" 
            ? ["Koramangala", "HSR Layout", "Indiranagar", "BTM Layout", "Marathahalli"]
            : targetCity === "Pune"
              ? ["Viman Nagar", "Hinjewadi Phase 1", "Kothrud", "Baner", "Kharadi"]
              : targetCity === "Mumbai"
                ? ["Andheri West", "Malad East", "Powai", "Thane West", "Bandra"]
                : ["Noida Sector 62", "Gurugram Phase 3", "Saket", "Karol Bagh", "Dwarka"],
          budgetTips: [
            `For ₹${budget || "10,000"} budget, sharing a double-occupancy premium PG is highly recommended.`,
            "Opting for direct-from-owner listings on CityMate avoids hefty brokerage fees.",
            "Use shared autos or local buses for short distance transit."
          ],
          foodOptions: [
            "Local Tiffin Delivery: Traditional regional lunches at ₹2,500 - ₹3,500/month.",
            "Mess/Canteen subscriptions: ₹100 per unlimited meal.",
            "Hire a shared home-cook: ₹2,000/month shared with roommates."
          ],
          commuteStrategy: `Since your destination is ${destination || "work/college"}, standard commute will take 20-35 minutes during peak hours. Metros or shared bike-taxis are the fastest and most pocket-friendly modes of travel.`
        };

        return createResponse({
          ...plan,
          isDemo: true,
          note: "Running in client-side simulation mode. Intercepted for Vercel deployment compatibility."
        });
      }

      // 4. /api/scam-analyzer
      if (pathname === "/api/scam-analyzer") {
        const text = bodyData.text || "";
        const lowerText = text.toLowerCase();
        let scamScore = 5;
        const indicators: string[] = [];
        const advice: string[] = [];
        let riskLevel = "LOW";
        let verdict = "This listing looks highly genuine. The details match standard rental procedures in Indian metros.";

        if (lowerText.includes("token") || lowerText.includes("advance") || lowerText.includes("booking money")) {
          scamScore += 25;
          indicators.push("Requesting pre-visit advance or token payment.");
          advice.push("Never pay any token money, deposit, or registration fee before visiting the house and verifying the original agreement.");
        }
        if (lowerText.includes("army") || lowerText.includes("military") || lowerText.includes("soldier") || lowerText.includes("officer") || lowerText.includes("bsf")) {
          scamScore += 35;
          indicators.push("Landlord claiming to be in Army / Defense force (Common Indian rental scam pretext).");
          advice.push("Scammers frequently pose as highly respectable defense personnel claiming they are posted out-of-station and cannot meet in person.");
        }
        if (lowerText.includes("visiting charge") || lowerText.includes("gate pass") || lowerText.includes("qr code") || lowerText.includes("scanner")) {
          scamScore += 30;
          indicators.push("Wants payment for 'Gate Pass', 'Visiting Slip', or asks to scan a QR code.");
          advice.push("No genuine owner charges money for a visit or asks you to scan a QR code to 'receive' money.");
        }
        if (lowerText.includes("whatsapp only") || lowerText.includes("unable to call") || lowerText.includes("network issue")) {
          scamScore += 15;
          indicators.push("Insists on communication over WhatsApp only or refuses standard phone calls.");
          advice.push("Always verify via voice call or video call. Scam numbers are often registered under fake names.");
        }
        if (lowerText.includes("outside india") || lowerText.includes("out of town") || lowerText.includes("abroad") || lowerText.includes("locked")) {
          scamScore += 20;
          indicators.push("Claiming the owner is out of town and keys are with security or will be couriered.");
          advice.push("Insist on meeting a local authorized representative or caretaker before committing to any lease.");
        }

        if (scamScore >= 70) {
          riskLevel = "SEVERE";
          verdict = "WARNING: HIGH PROBABILITY OF FRAUD. This conversation/listing demonstrates classic red flags of Indian rental scams (e.g. Defense personnel pretenses, advance visiting fees, or locked keys). Extreme caution advised.";
        } else if (scamScore >= 35) {
          riskLevel = "MEDIUM";
          verdict = "CAUTION ADVISED: Moderate risk indicators detected. We recommend arranging an in-person physical tour and checking property documents before transfer.";
        }

        return createResponse({
          scamScore,
          riskLevel,
          indicators: indicators.length > 0 ? indicators : ["No immediate verbal red flags detected."],
          advice: advice.length > 0 ? advice : ["Verify landlord identity.", "Perform a physical visit.", "Never scan any QR code."],
          verdict,
          isDemo: true
        });
      }

      // 5. /api/payments/create-order
      if (pathname === "/api/payments/create-order") {
        const { bookingId, amount, purpose } = bodyData;
        const rate = COMMISSION_RATES[purpose] || 0.05;
        const platformCut = Number((amount * rate).toFixed(2));
        const vendorPayout = Number((amount - platformCut).toFixed(2));
        const orderId = `order_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
        const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        return createResponse({
          success: true,
          orderId,
          transactionId,
          amount,
          purpose,
          platformCut,
          vendorPayout,
          commissionRate: rate,
          isMock: true
        });
      }

      // 6. /api/payments/verify-signature
      if (pathname === "/api/payments/verify-signature") {
        const { transactionId } = bodyData;
        return createResponse({
          success: true,
          message: "Razorpay payment signature verified successfully in client-side simulation.",
          transactionId,
          state: "captured"
        });
      }

      // 7. /api/payments/refund
      if (pathname === "/api/payments/refund") {
        const { transactionId } = bodyData;
        return createResponse({
          success: true,
          message: "Refund captured and ledgers reversed successfully in client-side simulation.",
          transactionId,
          state: "refunded"
        });
      }

      return createResponse({ error: "Endpoint mock not implemented" }, 404);
    }

    return originalFetch.apply(this, arguments as any);
  };

  Object.defineProperty(window, "fetch", {
    value: customFetch,
    writable: true,
    configurable: true
  });
}
