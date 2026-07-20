const key = process.env.GEMINI_API_KEY;
console.log("Key length:", key ? key.length : "undefined");
console.log("Key prefix:", key ? key.substring(0, 10) : "undefined");
console.log("Key suffix:", key ? key.substring(key.length - 10) : "undefined");
console.log("Is starts with AIza:", key ? key.startsWith("AIza") : "false");
console.log("Is starts with AQ.Ab8:", key ? key.startsWith("AQ.Ab8") : "false");
