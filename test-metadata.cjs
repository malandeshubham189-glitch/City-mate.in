async function test() {
  try {
    const res = await globalThis.fetch("http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/identity?audience=https://generativelanguage.googleapis.com/", {
      headers: {
        "Metadata-Flavor": "Google"
      }
    });
    console.log("Metadata status:", res.status);
    const text = await res.text();
    console.log("Metadata ID Token:", text.substring(0, 500));
  } catch (e) {
    console.error("Metadata error:", e);
  }
}

test();
