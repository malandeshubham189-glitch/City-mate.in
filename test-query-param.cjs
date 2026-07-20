async function test() {
  const token = process.env.GEMINI_API_KEY;
  console.log("Token starts with:", token ? token.substring(0, 10) : "undefined");

  try {
    const res = await globalThis.fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${token}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi, say 'authentication successful' and nothing else." }] }]
      })
    });
    const json = await res.json();
    console.log("Gemini query param status:", res.status, JSON.stringify(json).substring(0, 1000));
  } catch (e) {
    console.error("Gemini query param error:", e);
  }
}

test();
