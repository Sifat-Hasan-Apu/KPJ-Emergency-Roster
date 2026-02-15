import { NextResponse } from 'next/server';
import { GoogleAuth } from 'google-auth-library';

export const dynamic = 'force-dynamic';

// Service Account credentials for OAuth
const SERVICE_ACCOUNT = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

const PROJECT_ID = 'duty-roster-emergency';
const FCM_ENDPOINT = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;

// Create auth client lazily
let authClient = null;

async function getAccessToken() {
    if (!authClient) {
        authClient = new GoogleAuth({
            credentials: SERVICE_ACCOUNT,
            scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
        });
    }
    const client = await authClient.getClient();
    const accessToken = await client.getAccessToken();
    return accessToken.token;
}

export async function POST(request) {
    console.log("📨 FCM HTTP API Route Called");

    // Step 1: Parse request body
    let requestData;
    try {
        requestData = await request.json();
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return NextResponse.json({ error: 'Invalid JSON in request body', details: e.message }, { status: 400 });
    }

    const { token, title, body, data } = requestData;

    if (!token) {
        return NextResponse.json({ error: 'Missing FCM token' }, { status: 400 });
    }

    // Step 2: Get OAuth access token
    let accessToken;
    try {
        accessToken = await getAccessToken();
        console.log("✅ Got OAuth Access Token");
    } catch (e) {
        console.error("OAuth Error:", e);
        return NextResponse.json({
            error: 'Failed to get OAuth token',
            details: e.message
        }, { status: 500 });
    }

    // Step 3: Prepare FCM message payload
    const stringifiedData = {};
    if (data && typeof data === 'object') {
        Object.keys(data).forEach(key => {
            stringifiedData[key] = String(data[key] ?? '');
        });
    }

    const fcmPayload = {
        message: {
            token: token,
            notification: {
                title: title || 'Notification',
                body: body || '',
            },
            data: stringifiedData,
        }
    };

    console.log("FCM Payload:", JSON.stringify(fcmPayload, null, 2));

    // Step 4: Send to FCM HTTP API
    try {
        const fcmResponse = await fetch(FCM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(fcmPayload),
        });

        const fcmResult = await fcmResponse.json();
        console.log("FCM Response:", JSON.stringify(fcmResult));

        if (!fcmResponse.ok) {
            console.error("FCM Error Response:", fcmResult);
            return NextResponse.json({
                error: 'FCM send failed',
                fcmError: fcmResult.error,
                status: fcmResponse.status
            }, { status: fcmResponse.status });
        }

        console.log("✅ FCM Message Sent Successfully!");
        return NextResponse.json({
            success: true,
            messageId: fcmResult.name
        });

    } catch (e) {
        console.error("FCM Fetch Error:", e);
        return NextResponse.json({
            error: 'Network error sending to FCM',
            details: e.message
        }, { status: 500 });
    }
}
