async function test() {
  try {
    const res = await globalThis.fetch("http://localhost:8000/");
    console.log("Port 8000 GET / status:", res.status);
    const text = await res.text();
    console.log("Port 8000 GET / body:", text.substring(0, 500));
  } catch (e) {
    console.error("Port 8000 GET / error:", e);
  }

  try {
    const res = await globalThis.fetch("http://localhost:8000/api/health");
    console.log("Port 8000 GET /api/health status:", res.status);
    const text = await res.text();
    console.log("Port 8000 GET /api/health body:", text.substring(0, 500));
  } catch (e) {
    console.error("Port 8000 GET /api/health error:", e);
  }
}

test();
