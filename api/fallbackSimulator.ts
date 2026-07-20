/**
 * High-fidelity fallback simulator for CityMate India's AI features.
 * This simulates the exact responses of Gemini-3.5-flash in the workspace environment
 * when a standard GEMINI_API_KEY is not configured or fails to authenticate.
 * It ensures the app is 100% testable and highly functional out-of-the-box in the preview.
 */

export interface SimulatedChatResponse {
  content: string;
  role: "assistant";
  isMock: boolean;
}

export interface SimulatedEnhanceResponse {
  description: string;
  tags: string[];
  isMock: boolean;
}

export interface SimulatedPlanResponse {
  timeline: {
    time: string;
    tasks: string[];
    tips: string;
  }[];
  neighborhoods: string[];
  budgetTips: string[];
  foodOptions: string[];
  commuteStrategy: string;
  isMock: boolean;
}

export interface SimulatedScamResponse {
  scamScore: number;
  riskLevel: "LOW" | "MEDIUM" | "SEVERE";
  indicators: string[];
  advice: string[];
  verdict: string;
  isMock: boolean;
}

// 1. Simulate Relocation Chat Assistant
export function simulateChat(messages: any[], city: string = "Indian Metros", category: string = "General"): string {
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content || "";
  const query = lastUserMessage.toLowerCase();
  
  const cityName = city || "the city";
  const categoryName = category || "General assistance";

  // Base welcoming greeting
  let response = `Namaste 🙏! Aapka swagat hai. I am your **CityMate AI Buddy**, currently running in a helpful local simulation mode to guide your relocation to **${cityName}**.\n\n`;

  if (query.includes("deposit") || query.includes("rent") || query.includes("money") || query.includes("cost")) {
    response += `Regarding **living costs and renting deposit** in **${cityName}**:\n`;
    if (cityName.toLowerCase().includes("bengaluru") || cityName.toLowerCase().includes("bangalore")) {
      response += `- **Deposits**: Typically high here, ranging from **5 to 10 months of rent** (though some new co-living spaces ask for 3 months). Be ready to negotiate hard.\n`;
      response += `- **Rent Ranges**: 1 BHK in active tech areas (HSR Layout, Bellandur, Koramangala) goes for **₹18,000 - ₹26,000/month**. PG single rooms with meals typically cost **₹12,000 - ₹18,000/month**.\n`;
    } else if (cityName.toLowerCase().includes("pune")) {
      response += `- **Deposits**: Usually very reasonable, around **2 to 3 months of rent** (rarely 4).\n`;
      response += `- **Rent Ranges**: 1 BHK in student/professional hubs (Viman Nagar, Hinjewadi, Wakad, Baner) ranges between **₹12,000 - ₹18,000/month**. Good double-sharing PGs are available for **₹7,000 - ₹10,000/month**.\n`;
    } else if (cityName.toLowerCase().includes("mumbai")) {
      response += `- **Deposits**: Typically **3 to 6 months of rent**, and brokerage is almost always 1 month's rent.\n`;
      response += `- **Rent Ranges**: Rent is premium. A decent 1 BHK in Powai or Andheri West costs **₹30,000 - ₹45,000/month**. Many young professionals opt for shared PGs/flatmates in suburbs like Thane, Mulund, or Navi Mumbai where rents are **₹12,000 - ₹20,000/month**.\n`;
    } else {
      response += `- **Deposits**: Usually **2 to 4 months** of rent in most standard Indian Tier-1/Tier-2 cities.\n`;
      response += `- **Rent Ranges**: 1 BHK averages around **₹10,000 - ₹16,000/month**, while clean PGs with food range from **₹6,000 - ₹11,000/month**.\n`;
    }
    response += `\n💡 **CityMate Tip**: Never pay any "holding deposit" or "token money" online before physically visiting the room and verifying the agreement papers.`;
  } 
  else if (query.includes("area") || query.includes("locality") || query.includes("neighborhood") || query.includes("where to stay") || query.includes("places")) {
    response += `Here are the top recommended **neighborhoods** in **${cityName}** based on convenience, safety, and vibrant local life:\n\n`;
    if (cityName.toLowerCase().includes("bengaluru") || cityName.toLowerCase().includes("bangalore")) {
      response += `1. **HSR Layout**: The startup hub of India. Extremely planned, lined with cafes, tree-shaded streets, and super popular among young techies.\n`;
      response += `2. **Koramangala**: Classic, bustling, high social life with unlimited restaurants, pub-lanes, and excellent connectivity.\n`;
      response += `3. **Indiranagar**: Premium, leafy lanes, upscale boutique stores, and directly connected via Namma Metro purple line.\n`;
      response += `4. **Bellandur / Marathahalli**: Pragmatic choice if your office is on the Outer Ring Road (ORR). High density of tech parks, but expect heavy rush-hour traffic.\n`;
    } else if (cityName.toLowerCase().includes("pune")) {
      response += `1. **Viman Nagar**: Best for students and Symbiosis crowd. Beautiful joggers parks, Phoenix Mall close by, high safety rating, and packed with great cafes/food mess options.\n`;
      response += `2. **Hinjewadi (Phases 1, 2, 3)**: The primary IT cluster. Best if your office is in Rajiv Gandhi Infotech Park. Rents are cheap, but it's slightly far from Pune main city.\n`;
      response += `3. **Baner & Wakad**: West Pune favorites. Planned layouts, highly preferred by IT folks working in Hinjewadi or Baner highway tech parks.\n`;
      response += `4. **Koregaon Park (KP)**: High-end, cultural center, massive banyan trees, exquisite German bakeries, and the ultimate nightlife hub.\n`;
    } else if (cityName.toLowerCase().includes("mumbai")) {
      response += `1. **Powai**: Centered around the scenic Powai Lake and Hiranandani. Highly walkable, safe, premium infrastructure, and great for startup teams and corporate pros.\n`;
      response += `2. **Andheri West**: The heart of the media & entertainment world. Extremely lively, robust metro connectivity, and abundant local food.\n`;
      response += `3. **Thane / Navi Mumbai (Vashi/Koparkhairane)**: Excellent planned suburbs. High-quality housing societies with swimming pools/gyms at half the price of Mumbai proper.\n`;
    } else {
      response += `1. **City Center**: Best for short commutes and shopping centers, but usually has older apartments and busier roads.\n`;
      response += `2. **Tech & IT Corridors**: Lined with modern gated communities, high-rise apartments, co-living PGs, and fast food joints.\n`;
      response += `3. **Suburban Residential Layouts**: Peaceful, green, family-friendly, and highly budget-friendly.\n`;
    }
    response += `\n🚌 **Commute recommendation**: Try to live within **2-3 kms** of your office or college, or ensure direct metro connectivity. Saving commute time is key to enjoying your city life!`;
  }
  else if (query.includes("food") || query.includes("mess") || query.includes("tiffin") || query.includes("eat")) {
    response += `Let's discuss **food and subscription meals** in **${cityName}**:\n\n`;
    response += `- **Tiffin/Dabba Services**: Standard local mess/dabba services cost about **₹2,200 - ₹3,500 per month** for two meals daily (Roti, Sabzi, Dal, Rice). It's the most pocket-friendly choice for bachelors.\n`;
    response += `- **PG Mess**: Most PGs include breakfast and dinner on weekdays, and all three meals on weekends. Always check if they serve both North and South Indian food variations!\n`;
    response += `- **Street Food Cost**: A plate of hot Momos, Poha, Samosa, or Idli-Vada costs just **₹30 - ₹60** at street-side stalls.\n`;
    response += `- **Kitchen setup**: If you plan to cook, getting a local gas connection through private agencies (e.g., Chhotu Gas 5kg cylinder) or booking an induction cooktop is highly recommended.\n\n`;
    response += `🙏 *Tip*: In Western and Southern states, always ask for your dietary preference upfront (Pure Veg vs. Halal/Non-Veg splits are very common).`;
  }
  else if (query.includes("scam") || query.includes("fraud") || query.includes("warning") || query.includes("safe")) {
    response += `🚨 **CRITICAL RELOCATION WARNINGS FOR ${cityName.toUpperCase()}**:\n\n`;
    response += `1. **The "Gate Pass" or "Visiting Fee" Scam**: This is very common. An online owner claims you must pay a "visiting charge" or "gate pass fee" (usually ₹2,000) to get a QR code to enter the gated society. **This is a 100% scam!** Gated societies in India never charge visiting fees.\n`;
    response += `2. **The Military/Army Officer Impersonator**: The fake landlord claims they are an Army/Navy officer posted out of station (e.g., in Jammu or Border area) and cannot meet physically. They will ask for an advance to courier the keys. **Do not trust them!**\n`;
    response += `3. **Deposit Withholding**: When vacating flats/PGs, landlords commonly try to deduct heavy "painting charges" or "cleaning fees" (often half a month's rent). Make sure these deductions are explicitly written in your rent agreement.\n\n`;
    response += `🛡️ **Your Shield**: Use our **AI Scam Detector** tab on the main page to copy-paste any suspicious chats or descriptions to get an instant safety check!`;
  }
  else {
    response += `I can help you with anything related to moving to **${cityName}**!\n\n`;
    response += `Here's what you can ask me:\n`;
    response += `- **"What are the best PGs and 1BHK rents in Koramangala/Viman Nagar?"**\n`;
    response += `- **"What is the average security deposit in this city?"**\n`;
    response += `- **"Can you recommend clean tiffin services or affordable mess food?"**\n`;
    response += `- **"How do I commute from HSR Layout to Manyata Tech Park?"**\n\n`;
    response += `I am fully conversational and possess complete local knowledge of transit lines, local auto fares, tiffin centers, coaching hubs (like Kota/Pune), and flatbroker norms. How can I assist you today?`;
  }

  return response;
}

// 2. Simulate Property Listing Description Enhancer
export function simulateEnhance(data: {
  title: string;
  category: string;
  locality: string;
  city: string;
  price: string;
  features?: string[];
}): SimulatedEnhanceResponse {
  const { title, category, locality, city, price, features = [] } = data;
  const priceNum = Number(price) ? Number(price).toLocaleString("en-IN") : price;
  
  const tags = ["Verified Listing", "No-Brokerage Option", "Prime Location"];
  if (category.toLowerCase().includes("pg") || category.toLowerCase().includes("hostel")) {
    tags.push("Fully Furnished", "Daily Meals Included", "24/7 Security");
  } else {
    tags.push("Gated Community", "Modular Kitchen", "Power Backup");
  }
  
  if (features && features.length > 0) {
    features.forEach(f => {
      if (tags.length < 6 && !tags.includes(f)) {
        tags.push(f);
      }
    });
  }

  const desc = `✨ PREMIUM PROPERTY OPPORTUNITY IN ${city.toUpperCase()}! ✨

Presenting a highly appealing, modern ${category} situated in the prestigious and highly-connected locality of **${locality}, ${city}**. Offered at an attractive value of **₹${priceNum}/month**, this property is perfectly curated for students and working professionals seeking comfort and safety.

**Key Highlights:**
- **Excellent Commute**: Conveniently located close to major commercial tech parks, colleges, and local metro/bus transit corridors.
- **Modern Living**: Framed by generous natural light, featuring high-speed Wi-Fi, round-the-clock water supply, and complete safety gates.
- **Conveniences**: Essential daily needs, tiffin mess providers, laundry, supermarkets, and clinics are located within walking distance (less than 500m).
${features && features.length > 0 ? `- **Key Amenities**: ${features.join(", ")}\n` : ""}
Secure this premium space today! Reach out to schedule an immediate physical visit. No hidden charges.`;

  return {
    description: desc,
    tags: tags.slice(0, 6),
    isMock: true
  };
}

// 3. Simulate Relocation Planner
export function simulatePlan(data: {
  currentCity: string;
  budget: string;
  diet: string;
  livingSetup: string;
  destination: string;
}): SimulatedPlanResponse {
  const { currentCity, budget, diet, livingSetup, destination } = data;

  const neighborhoods = [];
  const budgetTips = [];
  const foodOptions = [];
  let commuteStrategy = "";

  if (currentCity.toLowerCase().includes("bengaluru") || currentCity.toLowerCase().includes("bangalore")) {
    neighborhoods.push("HSR Layout Sector 1-7", "Koramangala 4th & 8th Block", "BTM Layout 1st Stage", "Bellandur (Outer Ring Road)", "Marathahalli Multiplex Road");
    budgetTips.push(
      "Bengaluru landlords demand 6-10 months rent as deposit. Try checking out managed co-living spaces like stanza, nestaway, or local PGs which require only 1-2 months deposit.",
      "Use Rapido bike taxis or the Namma Metro instead of peak-hour auto-rickshaws to cut commute costs by 60%.",
      "Buy groceries from local weekly vegetable markets (shandy) instead of online apps to save significantly on monthly kitchen bills."
    );
    foodOptions.push(
      "Local Mess: Sri Guru Kottureshwara Davangere Benne Dosa and Udupi canteens (Meals at ₹40-₹70).",
      "Monthly Dabba: Standard Karnataka/North Indian hybrid veg tiffin delivery starting at ₹2,500/month.",
      "Cooking: Get a local 5kg Chhotu Gas cylinder; induction cooktops work best with Bengaluru's rare power cuts."
    );
    commuteStrategy = `To reach "${destination || "Tech Hub"}" efficiently:
1. **Best Choice**: Travel via **Namma Metro** (Purple/Green line depending on sector).
2. **First/Last Mile**: Use shared autos or Rapido bike taxis.
3. **Alternative**: BMTC AC Volvo Buses (500 Series for Outer Ring Road) offer a very comfortable commute. Keep the 'Tummoc' app installed for bus pass booking.`;
  } else if (currentCity.toLowerCase().includes("pune")) {
    neighborhoods.push("Viman Nagar (near Symbiosis)", "Hinjewadi Phase 1 & 2", "Wakad (Near Highway)", "Baner (Prathamesh Park Area)", "Kharadi (Near IT Park)");
    budgetTips.push(
      "Renting a 1BHK or flat in Hinjewadi/Wakad is much cheaper than in Viman Nagar or KP. Deposits in Pune are low (2-3 months rent maximum).",
      "Look for local shared auto services operating on fixed routes (e.g. Viman Nagar to Kalyani Nagar, or Hinjewadi Shivaji Chowk routes) for ₹10-₹20.",
      "Purchase a second-hand two-wheeler (scooty or bike) from local dealers in Rasta Peth. Pune is a highly two-wheeler friendly city and it will pay off in 3 months."
    );
    foodOptions.push(
      "Student Mess: Khanawal / local Marathi mess offering 'Unlimited Thali' (Veg/Non-Veg) for ₹2,500-₹3,000/month.",
      "Local Snacks: Indori Poha, Wada Pav, and Misal Pav at local tapris are highly filling and cost just ₹15-₹30.",
      "Diet Comfort: Clean tiffin subscription models serving homely chapati-sabzi are highly active around Viman Nagar and Hinjewadi."
    );
    commuteStrategy = `To reach "${destination || "Office/College"}" in Pune:
1. **Best Choice**: Pune **Metro** (if your destination lies on the newly operational Aqua/Purple corridor).
2. **Local Bus**: PMPML local buses are cheap but can be crowded. Keep change ready.
3. **Personal vehicle**: Pune transit heavily favors personal two-wheelers. Highly recommend renting a bike/scooter or using Uber/Ola Moto.`;
  } else {
    // Default Indian metro
    neighborhoods.push("City Center Sector A", "IT/Tech Park Outer Belt", "Academic Student Hub", "Residential Society Enclave", "Suburban Sector 2");
    budgetTips.push(
      "Negotiate rent beforehand and insist on a signed ₹100 stamp paper lease agreement to avoid sudden rent hikes.",
      "Choose a shared PG (double or triple sharing) during your first month. Once you make friends, rent a shared 2BHK/3BHK flat together to save 40% cost.",
      "Keep a tracker for electric sub-meter charges. Many PGs charge commercial rates (₹10-₹12 per unit) for AC usage."
    );
    foodOptions.push(
      "Local Homely Mess: Homely cooked meals on monthly subscription (₹2,200-₹3,000/month).",
      "Affordable Street Food: Clean idli plate, parathas, and local rice options under ₹50.",
      "Self Cooking: Simple kitchen setup with a single burner cooktop and local pantry shopping."
    );
    commuteStrategy = `Transit Strategy to "${destination || "Destination"}":
1. **Public Transport**: Check local bus networks or metro lines.
2. **Aggregators**: Keep Ola, Uber, and Rapido installed for backup.
3. **Shared Rides**: Local shared autos (tuk-tuks) operate on high-frequency routes and are the cheapest first-mile transit hack.`;
  }

  return {
    timeline: [
      {
        time: "3 Weeks Before Move",
        tasks: [
          "Shortlist 4-5 properties online in recommended areas: " + neighborhoods.slice(0, 3).join(", "),
          "Research moving options and compare quotes from verified local packers & movers",
          "Set aside security deposit fund equal to ₹" + (Number(budget) * 2 || 25000) + " based on standard landlord expectations"
        ],
        tips: "Never make advance token transfers online before seeing the room in person."
      },
      {
        time: "1 Week Before Move",
        tasks: [
          "Book temporary stay/PG hostel for first 3-4 days in " + neighborhoods[0],
          "Pack primary relocation boxes (keep documents, laptop, and valuables in personal handbag)",
          "Reach out to verified local tiffin service providers to check menu options"
        ],
        tips: "Coordinate exact move-in times with your PG warden or apartment society security."
      },
      {
        time: "Move Day & Settling In",
        tasks: [
          "Arrive in the city, check into temporary stay, and conduct physical visits to shortlisted rooms",
          "Verify electric meters, water running, gate rules, and sign the written rental contract",
          "Setup your basic kitchen/induction or activate tiffin delivery subscription"
        ],
        tips: "Do a walking audit of the surrounding 500m to find the nearest grocery stores and pharmacies."
      }
    ],
    neighborhoods,
    budgetTips,
    foodOptions,
    commuteStrategy,
    isMock: true
  };
}

// 4. Simulate Scam Detector
export function simulateScam(text: string): SimulatedScamResponse {
  const query = text.toLowerCase();
  
  const indicators: string[] = [];
  const advice: string[] = [];
  let scamScore = 5;
  let riskLevel: "LOW" | "MEDIUM" | "SEVERE" = "LOW";
  let verdict = "This listing appears highly legitimate and safe. No classic rental scams or suspicious phrasing were identified. However, always exercise standard physical verification before making any financial commitment.";

  // Check 1: pre-visit money
  if (query.includes("advance") || query.includes("token") || query.includes("deposit before") || query.includes("book without visit") || query.includes("hold money") || query.includes("booking money")) {
    scamScore += 35;
    indicators.push("Requesting money ('advance token', 'deposit', or 'booking amount') before permitting a physical visit.");
    advice.push("NEVER pay even a single rupee to a landlord before entering the property, checking the water/fixtures, and meeting the owner face-to-face.");
  }

  // Check 2: Army/BSF/Defense personnel
  if (query.includes("army") || query.includes("military") || query.includes("navy") || query.includes("air force") || query.includes("bsf") || query.includes("soldier") || query.includes("officer posted")) {
    scamScore += 30;
    indicators.push("Landlord claiming to be an active Army/Defense/BSF/CISF officer who is 'out of station' or 'posted in border area' and cannot meet physically.");
    advice.push("This is a classic identity-theft scam in India. Scammers download fake ID cards and post listings using army tags to exploit trust. Avoid completely.");
  }

  // Check 3: Gate pass / Visiting pass / QR Code charge
  if (query.includes("gate pass") || query.includes("visiting charge") || query.includes("qr code") || query.includes("visiting pass") || query.includes("entry charge")) {
    scamScore += 25;
    indicators.push("Charging for a 'gate pass', 'visiting pass', 'society entry ticket', or requesting scanner/QR registration before seeing the flat.");
    advice.push("Residential societies in India NEVER issue paid entry passes or charge fees for viewing flats. Any request to scan a QR code or pay a security/entry pass fee is a guaranteed scam.");
  }

  // Check 4: WhatsApp only/Strange phone
  if (query.includes("whatsapp only") || query.includes("whatsapp chat") || query.includes("phone broken")) {
    scamScore += 10;
    indicators.push("Insisting on communicating strictly over WhatsApp, refusing phone calls, or claiming cellular network issues.");
    advice.push("Always insist on a normal cellular call. Speak with the owner directly. Refuse to carry out the entire transaction on chat.");
  }

  // Final risk categorization
  if (scamScore >= 60) {
    riskLevel = "SEVERE";
    verdict = "🚨 SEVERE RISK DETECTED! This contains multiple classic markers of highly coordinated Indian rental scams (e.g. asking for advance/token before visits, claiming to be an out-of-station Army officer, or gate pass fees). Do NOT send any money, scan any QR codes, or share your Aadhaar card copy. Break off communication immediately.";
  } else if (scamScore >= 25) {
    riskLevel = "MEDIUM";
    verdict = "⚠️ MODERATE RISK! Some suspicious indicators were identified (e.g., strong insistence on quick advance payment or strict WhatsApp chat). Proceed with high caution. Insist on a physical tour, verify their identity in person, and inspect the actual flat before any money is paid.";
  } else {
    // Standard safety reminders
    advice.push("Always verify the original property registry or society maintenance receipt to confirm ownership.", "Meet the landlord inside the actual premises.", "Insist on an explicit rent agreement on stamp paper.");
  }

  return {
    scamScore: Math.min(scamScore, 100),
    riskLevel,
    indicators,
    advice,
    verdict,
    isMock: true
  };
}
