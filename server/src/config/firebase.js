const admin = require('firebase-admin');
const path = require('path');

// Look for the path in env, default to serviceAccountKey.json in the server root
const envPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
const serviceAccountPath = envPath 
  ? path.resolve(process.cwd(), envPath) 
  : path.resolve(__dirname, '../../serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
    // databaseURL: "https://your-database.firebaseio.com" // Add if you use Realtime DB
  });
  
  console.log("Firebase Admin SDK initialized successfully.");
} catch (error) {
  console.warn("⚠️ Firebase Admin SDK not initialized. Please ensure serviceAccountKey.json exists at the root of the server directory.");
}

module.exports = admin;
