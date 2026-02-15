import { NextResponse } from 'next/server';
import { getDb, getMessaging } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Re-defining shifts here to avoid importing client-side focused data/shiftDefinitions if it causes issues, 
// or simpler: just stick to the code map if the file is shared. 
// Assuming SHIFTS can be used here or we just send the code. 
// Let's infer the label carefully.

const SHIFT_LABELS = {
    'M': 'Morning Shift (06:00 - 14:00)',
    'E': 'Evening Shift (14:00 - 22:00)',
    'N': 'Night Shift (22:00 - 06:00)',
    'G': 'General Shift (09:00 - 17:00)',
    'O': 'Day Off (Rest Day)',
    'CL': 'Casual Leave',
    'AL': 'Annual Leave',
    'SL': 'Sick Leave',
    'default': 'Unassigned Shift'
};

export async function GET(request) {
    console.log('[Cron] API Triggered');
    try {
        console.log('[Cron] Initializing Firebase Admin...');
        const adminDb = getDb();
        const adminMessaging = getMessaging();
        console.log('[Cron] Firebase Admin Initialized');

        // 1. Calculate Tomorrow's Date (in BD Time UTC+6 ideally, or server time)
        // Here we use UTC+6 approximation for "Tomorrow" relative to 9 PM execution
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        const year = tomorrow.getFullYear();
        const month = tomorrow.getMonth(); // 0-indexed
        const day = tomorrow.getDate();

        // Roster Document ID format: "YYYY-M" (e.g. 2026-2 for February (since 0=Jan? Wait. 
        // In EmployeeDashboard: rosterDocId = `${currentYear}-${currentMonth + 1}`. 
        // So Month is 1-indexed in Doc ID.
        const rosterDocId = `${year}-${month + 1}`;

        console.log(`[Cron] Checking Roster for Date: ${year}-${month + 1}-${day}`);

        // 2. Fetch Roster Document
        const rosterRef = adminDb.collection('roster_assignments').doc(rosterDocId);
        const rosterSnap = await rosterRef.get();

        if (!rosterSnap.exists) {
            return NextResponse.json({ message: 'No roster found for this month', date: rosterDocId }, { status: 200 });
        }

        const rosterData = rosterSnap.data();

        // 3. Fetch All Users with Tokens
        const usersSnap = await adminDb.collection('users').get();
        const notifications = [];

        usersSnap.forEach(userDoc => {
            const userData = userDoc.data();
            const uid = userDoc.id;
            const fcmToken = userData.fcmToken;

            if (fcmToken) {
                // Construct Roster Key: "YYYY-M-D_uid" 
                // Note: In EmployeeDashboard key is `${currentYear}-${currentMonth}-${day}_${uid}`
                // where currentMonth is 0-indexed. Let's verify.
                // EmployeeDashboard: `currrentMonth = viewDate.getMonth()` (0-indexed)
                // Key construction: `${currentYear}-${currentMonth}-${day}_${currentUser.uid}`
                // So Key uses 0-indexed month.

                const rosterKey = `${year}-${month}-${day}_${uid}`;
                const shiftCode = rosterData[rosterKey];

                if (shiftCode) {
                    const shiftLabel = SHIFT_LABELS[shiftCode] || SHIFT_LABELS.default;

                    // Prepare Notification
                    const message = {
                        notification: {
                            title: 'Tomorrow\'s Duty Roster 📅',
                            body: `Your shift for tomorrow (${day}/${month + 1}): ${shiftLabel}`,
                        },
                        token: fcmToken,
                        data: {
                            type: 'ROSTER_UPDATE',
                            date: `${year}-${month + 1}-${day}`
                        }
                    };

                    notifications.push(adminMessaging.send(message)
                        .then(() => ({ uid, status: 'sent', shift: shiftCode }))
                        .catch(e => ({ uid, status: 'failed', error: e.message }))
                    );
                }
            }
        });

        // 4. Send All
        const results = await Promise.all(notifications);
        const sentCount = results.filter(r => r.status === 'sent').length;

        return NextResponse.json({
            success: true,
            message: `Processed ${usersSnap.size} users. Sent ${sentCount} notifications.`,
            details: results
        });

    } catch (error) {
        console.error('[Destin Cron Error]', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
