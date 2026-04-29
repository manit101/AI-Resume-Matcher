const admin = require('../config/firebase');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

exports.verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    let uid, email;

    // If the Admin SDK failed to initialize (e.g. no service account), we use the mock user.
    if (!admin.apps || admin.apps.length === 0) {
      console.warn("Using mock user because Firebase Admin is not initialized.");
      uid = 'mock-user-id';
      email = 'test@example.com';
      req.user = { uid, email };
    } else {
      const decodedToken = await admin.auth().verifyIdToken(token);
      uid = decodedToken.uid;
      email = decodedToken.email;
      req.user = decodedToken;
    }

    // Ensure user exists in Prisma DB
    await prisma.user.upsert({
      where: { id: uid },
      update: {},
      create: {
        id: uid,
        firebaseId: uid,
        email: email || `${uid}@example.com`,
        name: 'App User'
      }
    });

    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(403).json({ error: 'Unauthorized: Invalid token' });
  }
};
