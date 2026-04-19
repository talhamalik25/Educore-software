const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

if (!admin.apps.length) {
    if (fs.existsSync(serviceAccountPath)) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccountPath),
        });
        console.log('✅ Firebase Admin initialized');
    } else {
        console.warn('⚠️ Firebase Admin NOT initialized: serviceAccountKey.json missing in src/config/');
    }
}

module.exports = admin;
