import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { simulateChat, simulateEnhance, simulatePlan, simulateScam } from "../fallbackSimulator";

dotenv.config();

// Initialize Express
const app = express();

// Helper to check if we are in Sandbox / Placeholder key mode
function isSandboxMode(): boolean {
  const apiKey = process.env.GEMINI_API_KEY;
  return !apiKey || apiKey.startsWith("AQ.Ab8");
}

// Initialize Gemini Client Lazily with standard User-Agent for AI Studio telemetry & verbose logs
let aiInstance: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  const isKeyPresent = !!apiKey;
  const keyLength = apiKey ? apiKey.length : 0;
  const keyPrefix = apiKey ? apiKey.substring(0, 6) : "none";
  
  console.log(`[Gemini Diagnostics] Retrieving API client. Key present: ${isKeyPresent}, Length: ${keyLength}, Prefix: ${keyPrefix}`);
  
  if (!apiKey) {
    const errorMsg = "CRITICAL SERVER ERROR: GEMINI_API_KEY environment variable is not set. Please navigate to Settings > Secrets in your dashboard and ensure GEMINI_API_KEY is configured correctly.";
    console.error(`[Gemini Diagnostics] ${errorMsg}`);
    throw new Error(errorMsg);
  }

  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("[Gemini Diagnostics] GoogleGenAI client successfully initialized.");
  }
  return aiInstance;
}

app.use(express.json());

// Helper to stream simulated text to the client
function streamSimulatedText(text: string, res: any, req: any) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  
  const words = text.split(" ");
  for (let i = 0; i < words.length; i++) {
    const wordText = (i === 0 ? "" : " ") + words[i];
    res.write(`data: ${JSON.stringify({ text: wordText, isSandboxMode: true })}\n\n`);
  }
  res.write("data: [DONE]\n\n");
  res.end();
}

// API 1: Live Relocation AI Buddy Assistant Chat
app.post("/api/chat", async (req, res) => {
  const { messages, userContext } = req.body;
  
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Messages array is required" });
  }

  const { city, category } = userContext || {};

  // If in Sandbox Mode, use high-fidelity simulation immediately
  if (isSandboxMode()) {
    console.log("[Gemini Fallback] Sandbox mode detected. Utilizing simulated chat response.");
    const simulatedText = simulateChat(messages, city, category);
    return streamSimulatedText(simulatedText, res, req);
  }

  try {
    // Keep only the last 8 messages (4 user turns and 4 assistant turns) to optimize payload size
    const recentMessages = messages.slice(-8);

    // Map roles: 'assistant' -> 'model', 'user' -> 'user'
    const contents = recentMessages.map(msg => {
      const role = (msg.role === "assistant" || msg.role === "model") ? "model" : "user";
      return {
        role,
        parts: [{ text: msg.content }]
      };
    });

    const systemInstruction = `You are CityMate AI Buddy, a highly knowledgeable, street-smart, and empathetic local relocation assistant for India.
Your goal is to help users find rooms/PGs, estimate living expenses, pick safe/practical neighborhoods, decipher PG rules, find tiffin/mess delivery services, and guide their relocation.

You are a deeply specialized expert in Indian urban relocation:
1. Paying Guest (PG) Accommodations: Speak intelligently about typical rules (curfews, gate timings, guest policies, veg/non-veg policies), typical amenities (Wi-Fi, laundry, daily meals), realistic costs, and hidden charges (separate electricity meter charges, maintenance, security deposits).
2. Flats & House Renting: Explain deposit norms (e.g., 2-4 months rent in Pune/Mumbai/Delhi, 5-10 months in Bangalore), owner profiling, society NOC requirements for bachelors/working professionals, and lease agreements.
3. Packers & Movers: Give realistic price estimates for local vs. inter-city relocations in India, warn about common scams (e.g., holding goods hostage for extra charges), and recommend physical pre-visit audits.
4. City Insights & Neighborhoods: Recommend precise, popular localities for IT professionals, students, or families in major Indian cities:
   - Bengaluru: HSR Layout, Koramangala, Indiranagar, Whitefield, Marathahalli, Bellandur.
   - Pune: Hinjewadi, Viman Nagar, Kharadi, Baner, Wakad, Koregaon Park.
   - Mumbai: Powai, Andheri, Bandra, Thane, Navi Mumbai.
   - Delhi NCR: Gurgaon (DLF Phase 1-5, Sector 21/45), Noida (Sector 62/137), South Delhi (Saket, Hauz Khas).
   - Hyderabad: Gachibowli, Madhapur, Kondapur, Jubilee Hills.
5. Commute & Transit Hacks: Mention local transport options (e.g., Namma Metro, Delhi Metro, Pune local buses, Mumbai local trains, shared autos, Rapido/Uber Moto).
6. Local Mess/Tiffin Services: Explain how local dabba or mess systems work (monthly subscription, veg/non-veg split, typical costs of ₹2000-₹4000/month).

Current Context:
- Target Indian City: ${city || "Indian Metros"}
- Browsing Category: ${category || "General"}

Provide highly specific, practical, localized advice for Indian metros. Mention actual names of local areas, transit lines, deposit expectations, and costs.
Structure responses cleanly using bullet points, short paragraphs, and bold text. Keep it concise, warm, and use polite Indian greetings (Namaste 🙏, Aapka Swagat Hai) when appropriate. Avoid generic or repetitive guidance.`;

    // Set headers for Server-Sent Events (SSE) streaming
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const client = getGeminiClient();
    const responseStream = await client.models.generateContentStream({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    for await (const chunk of responseStream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error: any) {
    console.error("[Gemini Chat Endpoint Error] Detailed Error:", error);
    console.log("[Gemini Fallback] Real API call failed. Falling back to high-fidelity simulated response.");
    
    // Check if headers were already sent
    if (!res.headersSent) {
      const simulatedText = simulateChat(messages, city, category);
      streamSimulatedText(simulatedText, res, req);
    } else {
      res.write(`data: ${JSON.stringify({ text: "\n\n*(Note: Switched to sandbox simulator mode due to API gateway connectivity issue)*\n" })}\n\n`);
      const simulatedText = simulateChat(messages, city, category);
      streamSimulatedText(simulatedText, res, req);
    }
  }
});

// API 2: AI Property Listing Description Enhancer
app.post("/api/listings/enhance", async (req, res) => {
  const { title, category, locality, city, price, features } = req.body;

  if (isSandboxMode()) {
    console.log("[Gemini Fallback] Sandbox mode detected. Utilizing simulated property description enhancement.");
    const simulated = simulateEnhance({ title, category, locality, city, price, features });
    return res.json(simulated);
  }

  try {
    const prompt = `Write a compelling, professional, and appealing description for this property listing in India:
Title: ${title}
Category: ${category}
Locality: ${locality}
City: ${city}
Price: ₹${price}
Features: ${features ? features.join(", ") : "None specified"}

Generate:
1. An enhanced, premium description (around 100-150 words) highlighting local conveniences, transit, and suitability.
2. A list of 4-6 modern amenity tags.

Return the response strictly as a JSON object matching this schema:
{
  "description": "the detailed description string",
  "tags": ["tag1", "tag2", ...]
}`;

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Enhance Error:", error);
    console.log("[Gemini Fallback] Real API call failed. Falling back to simulated description enhancement.");
    const simulated = simulateEnhance({ title, category, locality, city, price, features });
    res.json(simulated);
  }
});

// API 3: AI Relocation Personalized Planner
app.post("/api/relocation/plan", async (req, res) => {
  const { currentCity, budget, diet, livingSetup, destination } = req.body;

  if (isSandboxMode()) {
    console.log("[Gemini Fallback] Sandbox mode detected. Utilizing simulated relocation planner.");
    const simulated = simulatePlan({ currentCity, budget, diet, livingSetup, destination });
    return res.json(simulated);
  }

  try {
    const prompt = `Generate a highly personalized, practical relocation guide and timeline plan for someone moving to ${currentCity}.
User Profile:
- Monthly Budget: ₹${budget || "15,000"}
- Diet Preference: ${diet || "Any"}
- Living Setup: ${livingSetup || "PG / Shared Flat"}
- Daily Destination (Work/College): ${destination || "Tech Hub / City Center"}

Return a response strictly as a JSON object matching this schema:
{
  "timeline": [
    {
      "time": "3 Weeks Before Move",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "tips": "Specific regional negotiation or packing tip"
    },
    {
      "time": "1 Week Before Move",
      "tasks": ["Task 1", "Task 2"],
      "tips": "Specific checklist tip"
    },
    {
      "time": "Move Day & Settling In",
      "tasks": ["Task 1", "Task 2"],
      "tips": "Local settling-in tip"
    }
  ],
  "neighborhoods": ["Neighborhood 1", "Neighborhood 2", "Neighborhood 3", "Neighborhood 4", "Neighborhood 5"],
  "budgetTips": ["Tip 1", "Tip 2", "Tip 3"],
  "foodOptions": ["Option 1", "Option 2", "Option 3"],
  "commuteStrategy": "Detailed explanation of fastest and cheapest commute modes for this destination"
}

Ensure all tips, areas, budget strategies, and food options are highly specific to ${currentCity} and relevant to the user's budget and diet. Do not use placeholders or generic advice.`;

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Relocation Plan Error:", error);
    console.log("[Gemini Fallback] Real API call failed. Falling back to simulated relocation planner.");
    const simulated = simulatePlan({ currentCity, budget, diet, livingSetup, destination });
    res.json(simulated);
  }
});

// API 4: AI Indian Rental Scam Detector
app.post("/api/scam-analyzer", async (req, res) => {
  const { text } = req.body;

  if (isSandboxMode()) {
    console.log("[Gemini Fallback] Sandbox mode detected. Utilizing simulated rental scam analyzer.");
    const simulated = simulateScam(text || "");
    return res.json(simulated);
  }

  try {
    const prompt = `Analyze this rental listing description, chat conversation, or owner request for potential scams common in Indian cities:
"${text}"

Scan for red flags such as:
- Asking for pre-visit advance or "token money" or security deposit before seeing the property.
- Owner claiming to be in Army / Military / BSF / Air Force who is posted out of station and cannot meet.
- Charging for a "gate pass" or "visiting pass" or "QR code verification" or "visiting charge".
- Insisting on WhatsApp communication only or saying their phone is broken.
- Offering a ridiculously low rent for a premium area.

Return a response strictly as a JSON object matching this schema:
{
  "scamScore": 0 to 100 integer representing hazard rating,
  "riskLevel": "LOW" | "MEDIUM" | "SEVERE",
  "indicators": ["indicator 1", "indicator 2", ...],
  "advice": ["advice 1", "advice 2", ...],
  "verdict": "A comprehensive summary explanation of the risks and physical checks needed."
}`;

    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Scam Analyzer Error:", error);
    console.log("[Gemini Fallback] Real API call failed. Falling back to simulated rental scam analyzer.");
    const simulated = simulateScam(text || "");
    res.json(simulated);
  }
});

// Export app for serverless wrappers
export default app;
