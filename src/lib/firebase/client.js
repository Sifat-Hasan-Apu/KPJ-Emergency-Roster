import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from "firebase/messaging";
import { getAnalytics, isSupported as isAnalyticsSupported } from "firebase/analytics";

const firebaseConfig = {
    apiKey: "AIzaSyCDjL9tJkzATlQlP6qo6csKyOl5ytNcaw8",
    authDomain: "duty-roster-emergency.firebaseapp.com",
    projectId: "duty-roster-emergency",
    storageBucket: "duty-roster-emergency.firebasestorage.app",
    messagingSenderId: "937219432147",
    appId: "1:937219432147:web:86c031e01ebb08059ebe26",
    measurementId: "G-2V03RGG67M"
};

// Initialize Firebase (Singleton)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Messaging is supported only in browser environments
export const getFCM = async () => {
    if (typeof window !== "undefined" && (await import("firebase/messaging")).isSupported()) {
        return getMessaging(app);
    }
    return null;
};

// Initialize Analytics (Browser only)
export const initAnalytics = async () => {
    if (typeof window !== "undefined" && (await isAnalyticsSupported())) {
        return getAnalytics(app);
    }
    return null;
};

export default app;
