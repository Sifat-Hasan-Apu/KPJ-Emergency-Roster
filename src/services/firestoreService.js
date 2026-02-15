import { db } from '@/lib/firebase/client';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, serverTimestamp } from 'firebase/firestore';

// --- Users Collection ---
export const getUser = async (eid) => {
    const docRef = doc(db, "users", eid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data();
    } else {
        return null;
    }
};

// --- Roster Collection ---
// Structure: rosters/{YYYY-MM} (doc) -> includes 'shifts' map or subcollection
// Simpler approach for now: rosters/{YYYY-MM-DD} documents? 
// Let's use rosters collection where ID is 'YYYY-MM' and it contains all shifts for that month.
export const getMonthRoster = async (monthId) => {
    const docRef = doc(db, "rosters", monthId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data() : null;
};

// --- Requests Collection ---
export const createRequest = async (requestData) => {
    // requestData: { eid, date, type, reason, status: 'pending' }
    const colRef = collection(db, "requests");
    await addDoc(colRef, {
        ...requestData,
        timestamp: serverTimestamp()
    });
};

export const getPendingRequests = async () => {
    const q = query(collection(db, "requests"), where("status", "==", "pending"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const updateRequestStatus = async (requestId, status, adminNote = "") => {
    const docRef = doc(db, "requests", requestId);
    await updateDoc(docRef, {
        status,
        adminNote
    });
};
