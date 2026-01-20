// index.js
const functions = require('@google-cloud/functions-framework');
const admin = require("firebase-admin");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

// ---- CORS ----
function cors(req, res) {
    res.set("Access-Control-Allow-Origin", "*")
    // 🧩 ДОДАЙ "Authorization" у дозволені заголовки:
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    if (req.method === "OPTIONS") {
        res.status(204).send("")
        return true
    }
    return false
}

/* ==========================================================
   🆕 admindistributorsv2 (GCF via Functions Framework)
========================================================== */
functions.http("admindistributorsv2", async (req, res) => {
    if (cors(req, res)) return;
    if (req.method === "GET") return res.status(200).send("OK");
    if (req.method !== "POST")
        return res.status(405).json({success: false, message: "Method Not Allowed"});

    try {
        const {action, data = {}, id} = req.body || {};

        // ✅ CREATE
        if (action === "create") {
            if (!data.type || !data.name || !data.phone || !data.city || !data.login || !data.password) {
                return res.json({success: false, message: "Missing required fields"});
            }

            // 🧹 Нормалізуємо email
            data.login = data.login.trim().toLowerCase();

            // 🛑 Валідація email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.login)) {
                return res.json({
                    success: false,
                    message: "Невалідна email адреса",
                });
            }

            // 🛑 тільки @okolo.vision
            if (!data.login.endsWith("@okolo.vision")) {
                return res.json({
                    success: false,
                    message: "Дистрибʼютор повинен мати email @okolo.vision",
                });
            }

            // 🛑 email не повинен існувати у users
            const userConflict = await db
                .collection("users")
                .where("email", "==", data.login)
                .limit(1)
                .get();

            if (!userConflict.empty) {
                return res.json({
                    success: false,
                    message: "Ця email адреса вже використовується користувачем для гри",
                });
            }

            let userRecord;

            // 1️⃣ Firebase Auth
            try {
                userRecord = await admin.auth().createUser({
                    email: data.login,
                    password: data.password,
                    displayName: data.name,
                });

                await admin.auth().setCustomUserClaims(userRecord.uid, {
                    role: "distributor",
                    distributorId: userRecord.uid,
                });

            } catch (err) {
                console.error("❌ Error creating auth user:", err.code, err.message);

                if (err.code === "auth/email-already-exists") {
                    return res.json({
                        success: false,
                        message: "Дистрибʼютор з такою email вже існує",
                    });
                }

                return res.json({
                    success: false,
                    message: "Помилка створення користувача",
                });
            }

            // 2️⃣ Firestore
            try {
                await db.collection("distributors").doc(userRecord.uid).set({
                    type: data.type,
                    name: data.name,
                    phone: data.phone,
                    city: data.city,
                    login: data.login,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    promocodes: [],
                });

                return res.json({success: true, id: userRecord.uid});

            } catch (err) {
                console.error("❌ Firestore error:", err);

                // rollback
                await admin.auth().deleteUser(userRecord.uid);

                return res.json({
                    success: false,
                    message: "Не вдалося створити запис у Firestore",
                });
            }
        }


        // ✏️ UPDATE
        if (action === "update") {
            if (!id) return res.json({success: false, message: "Missing id"});
            if (data.login) {
                return res.json({
                    success: false,
                    message: "Distributor email cannot be changed"
                });
            }

            await db.collection("distributors").doc(id).update({
                ...data,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            if (data.password) {
                try {
                    await admin.auth().updateUser(id, {
                        password: data.password
                    });
                } catch (err) {
                    console.error("❌ Failed to update password in Auth:", err);
                }
            }
            return res.json({success: true});
        }

        // 🔍 GET
        if (action === "get") {
            if (!id) return res.json({success: false, message: "Missing id"});

            // 🧩 Перевірка токена авторизації
            const authHeader = req.headers.authorization || "";
            const token = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;

            let decoded = null;
            if (token) {
                try {
                    decoded = await admin.auth().verifyIdToken(token);
                } catch (err) {
                    console.error("❌ Invalid token:", err.message);
                    return res.status(401).json({success: false, message: "Invalid token"});
                }
            } else {
                return res.status(401).json({success: false, message: "No token provided"});
            }

            // 🗂️ Отримуємо дистриб’ютора
            const doc = await db.collection("distributors").doc(id).get();
            if (!doc.exists) return res.json({success: false, message: "Not found"});

            const data = {id: doc.id, ...doc.data()};

            // 🔐 Контроль доступу:
            // - admin бачить усіх
            // - distributor бачить лише свій власний документ
            if (decoded.role !== "admin" && decoded.distributorId !== id) {
                return res.status(403).json({success: false, message: "Forbidden"});
            }

            return res.json({success: true, data});
        }


        if (action === "adminChangeDistributorEmail") {
            const {newEmail} = data

            if (!id || !newEmail) {
                return res.json({success: false, message: "Missing id or email"})
            }

            const cleanEmail = newEmail.trim().toLowerCase()

            if (!cleanEmail.endsWith("@okolo.vision")) {
                return res.json({
                    success: false,
                    message: "Distributor email must be @okolo.vision"
                })
            }

            // 1️⃣ Firebase Auth
            await admin.auth().updateUser(id, {
                email: cleanEmail,
                emailVerified: true
            })

            // 2️⃣ Firestore
            await db.collection("distributors").doc(id).update({
                login: cleanEmail,
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            })

            return res.json({success: true})
        }

        // 🔐 ADMIN: SET DISTRIBUTOR PASSWORD (SAFE)
        if (action === "adminSetDistributorPassword") {
            const {password} = data || {}

            if (!id || !password) {
                return res.json({
                    success: false,
                    message: "Missing distributor id or password",
                })
            }

            try {
                // 1️⃣ Отримуємо distributor
                const distDoc = await db.collection("distributors").doc(id).get()
                if (!distDoc.exists) {
                    return res.json({success: false, message: "Distributor not found"})
                }

                const {login, name} = distDoc.data()
                if (!login) {
                    return res.json({success: false, message: "Distributor has no email"})
                }

                let authUser = null

                // 2️⃣ Пробуємо знайти Auth user по UID
                try {
                    authUser = await admin.auth().getUser(id)
                } catch (_) {
                    authUser = null
                }

                // 3️⃣ Якщо НЕ існує → створюємо
                if (!authUser) {
                    await admin.auth().createUser({
                        uid: id,
                        email: login,
                        password,
                        displayName: name || "Distributor",
                    })

                    await admin.auth().setCustomUserClaims(id, {
                        role: "distributor",
                        distributorId: id,
                    })

                    return res.json({
                        success: true,
                        message: "Auth user created and password set",
                    })
                }

                // 4️⃣ Якщо існує → оновлюємо пароль
                await admin.auth().updateUser(id, {password})

                return res.json({
                    success: true,
                    message: "Password updated",
                })

            } catch (err) {
                console.error("adminSetDistributorPassword ERROR:", err)
                return res.status(500).json({
                    success: false,
                    message: err.message,
                })
            }
        }


        // 📜 LIST
        if (action === "list") {
            const snap = await db.collection("distributors").orderBy("createdAt", "desc").get();
            const items = [];
            snap.forEach(doc => items.push({id: doc.id, ...doc.data()}));
            return res.json({success: true, data: items});
        }

        // 🔍 FIND PROMOCODE
        if (action === "findPromocode") {
            const {code} = data
            if (!code) return res.json({success: false, message: "Missing code"})

            // шукаємо або по code, або по barcode
            const byCode = await db.collection("promocodes").where("code", "==", code).get()
            const byBarcode = await db.collection("promocodes").where("barcode", "==", code).get()

            const snap = !byCode.empty ? byCode : byBarcode
            if (snap.empty) return res.json({success: false, message: "Промокод не знайдено"})

            const doc = snap.docs[0]
            return res.json({success: true, data: {id: doc.id, ...doc.data()}})
        }

        // 🔗 ATTACH PROMOCODE TO DISTRIBUTOR
        if (action === "attachPromocode") {
            const {distributorId, promocodeId} = data
            if (!distributorId || !promocodeId)
                return res.json({success: false, message: "Missing distributorId or promocodeId"})

            const ref = db.collection("distributors").doc(distributorId)
            await ref.update({
                promocodes: admin.firestore.FieldValue.arrayUnion(promocodeId),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            })

            return res.json({success: true, message: "Promocode attached"})
        }
        // 📋 GET PROMOCODES WITH USER DETAILS
        if (action === "getPromocodesByIds") {
            const {ids = []} = data;
            if (!Array.isArray(ids) || !ids.length)
                return res.json({success: false, message: "No promocode IDs provided"});

            const promos = [];

            for (const id of ids) {
                const doc = await db.collection("promocodes").doc(id).get();
                if (!doc.exists) continue;

                const promo = {id: doc.id, ...doc.data()};

                // якщо промокод активовано — підтягнути користувача
                if (promo.usedByUserId) {
                    const userDoc = await db.collection("users").doc(promo.usedByUserId).get();
                    if (userDoc.exists) {
                        promo.user = {
                            id: userDoc.id,
                            ...userDoc.data(),
                        };
                    }
                }

                promos.push(promo);
            }

            return res.json({success: true, data: promos});
        }
        // 🧩 SET ADMIN ROLE (через основний endpoint)
        if (action === "setAdminRole") {
            const {uid} = data
            if (!uid) return res.json({success: false, message: "Missing UID"})

            try {
                await admin.auth().setCustomUserClaims(uid, {role: "admin"})
                return res.json({success: true, message: `Admin role assigned to ${uid}`})
            } catch (e) {
                console.error(e)
                return res.status(500).json({success: false, error: e.message})
            }
        }


        // ❌ Невідома дія
        return res.json({success: false, message: "Unknown action"});

    } catch
        (e) {
        console.error("admindistributorsv2 ERROR:", e);
        res.status(500).json({success: false, error: e.message});
    }
})
;


/* ==========================================================
   🧩 Разове виставлення ролі адміна
========================================================== */
functions.http("setAdminRole", async (req, res) => {
    if (req.method !== "POST") return res.status(405).send("Use POST");

    const {uid} = req.body;
    if (!uid) return res.status(400).json({success: false, message: "Missing UID"});

    try {
        await admin.auth().setCustomUserClaims(uid, {role: "admin"});
        return res.json({success: true, message: `Admin role assigned to ${uid}`});
    } catch (e) {
        console.error(e);
        return res.status(500).json({success: false, error: e.message});
    }
});
