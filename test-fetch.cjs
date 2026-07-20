async function testFetch() {
  const token = process.env.GEMINI_API_KEY;
  console.log("Token:", token ? token.substring(0, 15) + "..." : "undefined");

  // Test 1: generativelanguage.googleapis.com with x-goog-api-key
  try {
    const res = await globalThis.fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": token
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }]
      })
    });
    const json = await res.json();
    console.log("Test 1 (generativelanguage with x-goog-api-key): Status", res.status, JSON.stringify(json).substring(0, 500));
  } catch (e) {
    console.error("Test 1 error:", e);
  }

  // Test 2: generativelanguage.googleapis.com with Authorization: Bearer
  try {
    const res = await globalThis.fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }]
      })
    });
    const json = await res.json();
    console.log("Test 2 (generativelanguage with Bearer): Status", res.status, JSON.stringify(json).substring(0, 500));
  } catch (e) {
    console.error("Test 2 error:", e);
  }

  // Test 3: Vertex AI with Authorization: Bearer and standard model path
  try {
    const res = await globalThis.fetch("https://us-central1-aiplatform.googleapis.com/v1beta1/projects/citymate-india/locations/us-central1/publishers/google/models/gemini-2.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi" }] }]
      })
    });
    const json = await res.json();
    console.log("Test 3 (Vertex AI projects/locations path): Status", res.status, JSON.stringify(json).substring(0, 500));
  } catch (e) {
    console.error("Test 3 error:", e);
  }
}

testFetch();
