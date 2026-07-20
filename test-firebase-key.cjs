const { GoogleGenAI } = require("@google/genai");

async function run() {
  const apiKey = "AIzaSyCrff-WLE7vaW56gAotTMWQugaDa8BJo74";
  console.log("Initializing GoogleGenAI client with Firebase API Key...");
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
