const admin = require('firebase-admin');
const path = require('path');

let serviceAccount;

try {
  // 1. Try to load from a raw JSON environment variable (Best for Render/Docker)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  } 
  // 2. Fallback to loading from a file path
  else {
    const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const serviceAccountPath = envPath 
      ? path.resolve(process.cwd(), envPath) 
      : path.resolve(__dirname, '../../serviceAccountKey.json');
    serviceAccount = require(serviceAccountPath);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.warn("⚠️ Firebase Admin SDK not initialized.");
  console.warn("Error:", error.message);
  console.warn("Please ensure FIREBASE_SERVICE_ACCOUNT_JSON is set, OR serviceAccountKey.json exists.");
}

module.exports = admin;
