async function test() {
  // Fetch ID token from metadata server
  let idToken;
  try {
    const res = await globalThis.fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://generativelanguage.googleapis.com/", {
      headers: {
        "Metadata-Flavor": "Google"
      }
    });
    idToken = await res.text();
    console.log("Fetched ID Token:", idToken.substring(0, 30) + "...");
  } catch (e) {
    console.error("Failed to fetch ID Token:", e);
    return;
  }

  // Call localhost:8000 with ID Token
  try {
    const res = await globalThis.fetch("http://localhost:8000/v1beta/models/gemini-3.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${idToken}`
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Hi, say 'authentication successful' and nothing else." }] }]
      })
    });
    console.log("Localhost 8000 status:", res.status);
    const json = await res.json();
    console.log("Localhost 8000 body:", JSON.stringify(json).substring(0, 1000));
  } catch (e) {
    console.error("Localhost 8000 error:", e);
  }
}

test();
