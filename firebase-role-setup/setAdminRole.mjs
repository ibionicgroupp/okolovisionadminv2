import admin from "firebase-admin"
import { readFileSync } from "fs"

const serviceAccount = JSON.parse(readFileSync("./serviceAccountKey.json", "utf-8"))

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
})

async function setAdminRole() {
    const uid = "sGHmLCAArCbpI2Drl2mxXnq2ayo2" // 👈 встав свій UID

    try {
        await admin.auth().setCustomUserClaims(uid, { role: "admin" })
        console.log(`✅ Role 'admin' assigned to user: ${uid}`)
        process.exit(0)
    } catch (error) {
        console.error("❌ Error setting role:", error)
        process.exit(1)
    }
}

setAdminRole()
