
import { db } from '@/lib/firebase/client';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Call the Next.js API to send an FCM message
 */
export const sendPushNotification = async (token, title, body, data = {}) => {
    try {
        const response = await fetch('/api/notifications/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, title, body, data }),
        });
        return await response.json();
    } catch (error) {
        console.error('Failed to send push notification:', error);
        return { error: error.message };
    }
};

/**
 * Notify all Admins about a new request
 */
export const notifyAdmins = async (title, body, data) => {
    try {
        const q = query(collection(db, "users"), where("role", "==", "admin"));
        const querySnapshot = await getDocs(q);

        const promises = [];
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.fcmToken) {
                promises.push(sendPushNotification(userData.fcmToken, title, body, data));
            }
        });

        await Promise.all(promises);
        console.log(`Notified ${promises.length} admins.`);
    } catch (error) {
        console.error("Error notifying admins:", error);
    }
};

/**
 * Notify a specific user (e.g. status update)
 */
/**
 * Notify a specific user (e.g. status update)
 * Saves to Firestore AND sends Push Notification
 */


export const notifyUser = async (userId, title, body, data = {}) => {
    try {
        // 1. Save to In-App Notifications
        await addDoc(collection(db, "notifications"), {
            userId,
            title,
            body,
            data,
            read: false,
            createdAt: serverTimestamp(),
            type: data?.status === 'approved' ? 'success' : data?.status === 'rejected' ? 'error' : 'info'
        });
        console.log(`Saved in-app notification for user ${userId}`);

        // 2. Send Push Notification
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.fcmToken) {
                console.log(`📤 Sending push to token: ${userData.fcmToken.substring(0, 20)}...`);
                const result = await sendPushNotification(userData.fcmToken, title, body, data);

                // Log detailed response
                if (result.success) {
                    console.log(`✅ Push notification SENT! MessageId: ${result.messageId}`);
                } else {
                    console.error(`❌ Push notification FAILED:`, result);
                    // If token is invalid, we might want to remove it
                    if (result.fcmError?.code === 'UNREGISTERED' || result.fcmError?.code === 'INVALID_ARGUMENT') {
                        console.warn(`⚠️ Token might be stale for user ${userId}`);
                    }
                }
            } else {
                console.warn(`⚠️ User ${userId} has no FCM token.`);
            }
        }
    } catch (error) {
        console.error("Error notifying user:", error);
    }
};

