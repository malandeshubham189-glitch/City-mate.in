const { GoogleGenAI } = require("@google/genai");

async function run() {
  console.log("Initializing GoogleGenAI client with scopes...");
  delete process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    googleAuthOptions: {
      scopes: [
        "https://www.googleapis.com/auth/cloud-platform",
        "https://www.googleapis.com/auth/generative-language"
      ]
    }
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
