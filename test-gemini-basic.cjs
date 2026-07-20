const { GoogleGenAI } = require("@google/genai");

async function run() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Initializing GoogleGenAI client with key:", apiKey ? apiKey.substring(0, 15) + "..." : "undefined");
  const ai = new GoogleGenAI({
    apiKey,
  });

  try {
    console.log("Calling generateContent on gemini-2.5-flash...");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hi, say 'authentication successful' and nothing else.",
    });
    console.log("Success! Response text:", response.text);
  } catch (error) {
    console.error("Failed with error:", error);
  }
}

run();
