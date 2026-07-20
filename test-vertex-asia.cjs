async function test() {
  const token = process.env.GEMINI_API_KEY;
  console.log("Token starts with:", token ? token.substring(0, 10) : "undefined");

  try {
    const res = await globalThis.fetch("https://asia-southeast1-aiplatform.googleapis.com/v1beta1/projects/625647765792/locations/asia-southeast1/publishers/google/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi, say 'authentication successful' and nothing else." }] }]
      })
    });
    const json = await res.json();
    console.log("Vertex AI asia-southeast1 status:", res.status, JSON.stringify(json).substring(0, 1000));
  } catch (e) {
    console.error("Vertex AI error:", e);
  }
}

test();
