import { initializeApp, getApps, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCDjL9tJkzATlQlP6qo6csKyOl5ytNcaw8",
    authDomain: "duty-roster-emergency.firebaseapp.com",
    projectId: "duty-roster-emergency",
    storageBucket: "duty-roster-emergency.firebasestorage.app",
    messagingSenderId: "937219432147",
    appId: "1:937219432147:web:86c031e01ebb08059ebe26",
    measurementId: "G-2V03RGG67M"
};

export const createSecondaryUser = async (email, password) => {
    // 1. Initialize a secondary app with a unique name
    const secondaryAppName = `secondaryApp-${Date.now()}`;
    const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    const secondaryAuth = getAuth(secondaryApp);

    try {
        // 2. Create the user on the secondary auth instance
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const newUser = userCredential.user;

        // 3. Sign out immediately from the secondary instance to be safe
        await signOut(secondaryAuth);

        return newUser;
    } catch (error) {
        throw error;
    } finally {
        // 4. Clean up: Delete the secondary app instance
        await deleteApp(secondaryApp);
    }
};
