async function test() {
  const token = process.env.GEMINI_API_KEY;
  try {
    const res = await globalThis.fetch("http://localhost:8000/", {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Body:", text.substring(0, 500));
  } catch (e) {
    console.error("Error:", e);
  }

  // Let's test standard Gemini API paths on localhost:8000!
  try {
    const res = await globalThis.fetch("http://localhost:8000/v1beta/models/gemini-3.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }]
      })
    });
    console.log("v1beta status:", res.status);
    const text = await res.text();
    console.log("v1beta body:", text.substring(0, 1000));
  } catch (e) {
    console.error("v1beta error:", e);
  }
}

test();
