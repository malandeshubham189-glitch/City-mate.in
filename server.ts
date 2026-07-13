import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize Express
const app = express();
const PORT = 3000;

// Initialize Gemini Client with standard User-Agent for AI Studio telemetry
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

app.use(express.json());

// API 1: Live Relocation AI Buddy Assistant Chat
app.post("/api/chat", async (req, res) => {
  try {
    const { messages, userContext } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Messages array is required" });
    }

    const { city, category } = userContext || {};

    // Map roles: 'assistant' -> 'model', 'user' -> 'user'
    const contents = messages.map(msg => {
      const role = (msg.role === "assistant" || msg.role === "model") ? "model" : "user";
      return {
        role,
        parts: [{ text: msg.content }]
      };
    });

    const systemInstruction = `You are CityMate AI Buddy, a highly knowledgeable, street-smart, and empathetic local relocation assistant for India.
Your goal is to help users find rooms/PGs, estimate living expenses, pick safe/practical neighborhoods, decipher PG rules, find tiffin/mess delivery services, and guide their relocation.

Current Context:
- Target Indian City: ${city || "Indian Metros"}
- Browsing Category: ${category || "General"}

Provide highly specific, practical, localized advice for Indian metros (e.g. Bengaluru, Pune, Mumbai, Delhi NCR, Kota). Mention specific local transit modes (e.g. Metro lines, shared autos, local trains), popular student/professional hubs (e.g. HSR Layout, Koramangala, Hinjewadi, Viman Nagar, Powai, Saket), realistic deposit averages (e.g. 2-5 months in most cities, 6-10 in Bengaluru), and street food/canteen costs.
Structure responses cleanly using bullet points, short paragraphs, and bold text. Keep it concise, warm, and use polite Indian greetings (Namaste 🙏) when appropriate. Avoid generic or repetitive guidance.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      content: response.text || "I'm sorry, I couldn't generate a response.",
      role: "assistant"
    });
  } catch (error: any) {
    console.error("Gemini API Chat Error:", error);
    res.status(500).json({ error: "Failed to connect to AI Assistant. " + (error?.message || error) });
  }
});

// API 2: AI Property Listing Description Enhancer
app.post("/api/listings/enhance", async (req, res) => {
  try {
    const { title, category, locality, city, price, features } = req.body;
    
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

    const response = await ai.models.generateContent({
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
    res.status(500).json({ error: error?.message || "Enhancement failed" });
  }
});

// API 3: AI Relocation Personalized Planner
app.post("/api/relocation/plan", async (req, res) => {
  try {
    const { currentCity, budget, diet, livingSetup, destination } = req.body;
    
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

    const response = await ai.models.generateContent({
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
    res.status(500).json({ error: error?.message || "Plan generation failed" });
  }
});

// API 4: AI Indian Rental Scam Detector
app.post("/api/scam-analyzer", async (req, res) => {
  try {
    const { text } = req.body;
    
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

    const response = await ai.models.generateContent({
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
    res.status(500).json({ error: error?.message || "Analysis failed" });
  }
});

// Integrate Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CityMate Live App] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

// Export app for serverless wrappers (like Vercel index handler)
export default app;
