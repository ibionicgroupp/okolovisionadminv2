const admin = require('firebase-admin')

// Initialize Firebase Admin SDK if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    databaseURL: "https://okolovision-48840-default-rtdb.europe-west1.firebasedatabase.app",
  })
}

module.exports = admin
