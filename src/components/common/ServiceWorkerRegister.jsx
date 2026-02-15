"use client";

import { useEffect } from 'react';

/**
 * ServiceWorkerRegister Component
 * 
 * This component registers the Firebase Messaging Service Worker
 * when the app loads. This is CRITICAL for background notifications
 * to work when the app is minimized or tab is closed.
 */
export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register the service worker
            navigator.serviceWorker.register('/firebase-messaging-sw.js')
                .then((registration) => {
                    console.log('✅ Firebase Messaging Service Worker registered:', registration.scope);

                    // Check for updates periodically
                    registration.update();
                })
                .catch((error) => {
                    console.error('❌ Service Worker registration failed:', error);
                });

            // Handle SW updates
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('🔄 Service Worker updated');
            });
        }
    }, []);

    return null; // This component doesn't render anything
}
