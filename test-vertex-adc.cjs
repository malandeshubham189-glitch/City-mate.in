const { GoogleGenAI } = require("@google/genai");

async function run() {
  console.log("Initializing GoogleGenAI client with vertexai: true, project: 625647765792, location: us-central1 (ADC)...");
  delete process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    vertexai: true,
    project: "625647765792",
    location: "us-central1",
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
