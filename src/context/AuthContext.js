"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/client';
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getFCM } from '@/lib/firebase/client';
import { getToken } from 'firebase/messaging';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Login Function
    const login = async (eid, passKey) => {
        // Construct email from Employee ID if it doesn't already look like an email
        const email = eid.includes('@') ? eid : `${eid}@roster.app`;
        // PassKey is the password
        return signInWithEmailAndPassword(auth, email, passKey);
    };

    const logout = () => {
        return signOut(auth);
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in, fetch additional details from Firestore
                try {
                    const userDocRef = doc(db, "users", user.uid);
                    const userDoc = await getDoc(userDocRef);

                    let fullUserData = { ...user };

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        fullUserData = { ...user, ...userData };
                        setCurrentUser(fullUserData);
                    } else {
                        // Fallback if no firestore doc exists yet
                        const eid = user.email.split('@')[0];
                        fullUserData = { ...user, eid: eid, role: 'employee', name: eid };
                        setCurrentUser(fullUserData);
                    }

                    // --- FCM Token Logic ---
                    try {
                        const messaging = await getFCM();
                        if (messaging) {
                            // Request notification permission first
                            const permission = await Notification.requestPermission();
                            console.log('📱 Notification permission:', permission);

                            if (permission !== 'granted') {
                                console.warn('⚠️ Notification permission denied by user');
                            } else {
                                // Permission granted, get FCM token
                                const currentToken = await getToken(messaging, {
                                    vapidKey: 'BG7M-i2LvLT6v3jiCLOIffJokay7W8HvEve5XOrtzNcWJhIg39IPvAnCMfD1pZRoClvd5bSmyEiHkHCpyyKmjBI'
                                });

                                if (currentToken) {
                                    // Save token to user profile
                                    await setDoc(doc(db, "users", user.uid), {
                                        fcmToken: currentToken
                                    }, { merge: true });
                                    console.log('✅ FCM Token saved for user:', user.uid);
                                } else {
                                    console.warn('⚠️ No FCM token received');
                                }
                            }
                        }
                    } catch (fcmError) {
                        console.error("❌ FCM Error:", fcmError);
                        // Don't block login on FCM error
                    }

                } catch (error) {
                    console.error("Error fetching user details:", error);
                    setCurrentUser(user);
                }
            } else {
                // User is signed out
                setCurrentUser(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // Expose permission request function manually
    const requestNotificationPermission = async () => {
        try {
            const messaging = await getFCM();
            if (messaging) {
                const permission = await Notification.requestPermission();
                if (permission === 'granted') {
                    const currentToken = await getToken(messaging, {
                        vapidKey: 'BG7M-i2LvLT6v3jiCLOIffJokay7W8HvEve5XOrtzNcWJhIg39IPvAnCMfD1pZRoClvd5bSmyEiHkHCpyyKmjBI'
                    });
                    if (currentToken && currentUser) {
                        await setDoc(doc(db, "users", currentUser.uid), {
                            fcmToken: currentToken
                        }, { merge: true });
                        console.log('✅ FCM Token Refreshed Manual');
                        alert("Notifications Enabled Successfully! 🔔");
                    }
                } else {
                    alert("Notifications Denied. Please enable from browser settings.");
                }
            } else {
                alert("Notifications not supported in this browser.");
            }
        } catch (error) {
            console.error("Manual Permission Error:", error);
            alert("Error enabling notifications.");
        }
    };

    const value = {
        currentUser,
        login,
        logout,
        loading,
        requestNotificationPermission
    };

    return (
        <AuthContext.Provider value={value}>
            {loading ? (
                <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
                        <p className="animate-pulse text-sm text-slate-400">Initializing App...</p>
                    </div>
                </div>
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};
