import admin from "firebase-admin";

const initFirebaseAdmin = () => {
    if (!admin.apps.length) {
        try {
            // Using template literal for safe newline handling defined locally
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            console.log("Initializing Firebase Admin with Environment Variable...");
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log("✅ Firebase Admin initialized successfully!");
        } catch (error) {
            console.error("Firebase Admin Init Critical Error:", error);
        }
    }
    return admin;
};

export const getDb = () => {
    initFirebaseAdmin();
    return admin.firestore();
};

export const getMessaging = () => {
    initFirebaseAdmin();
    return admin.messaging();
};

export const getAuth = () => {
    initFirebaseAdmin();
    return admin.auth();
};
