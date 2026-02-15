
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyCDjL9tJkzATlQlP6qo6csKyOl5ytNcaw8",
    authDomain: "duty-roster-emergency.firebaseapp.com",
    projectId: "duty-roster-emergency",
    storageBucket: "duty-roster-emergency.firebasestorage.app",
    messagingSenderId: "937219432147",
    appId: "1:937219432147:web:86c031e01ebb08059ebe26",
    measurementId: "G-2V03RGG67M"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        button: '/kpj_logo.png',
        image: '/kpj_logo.png',
        icon: '/kpj_logo.png' // Ensure you have an icon
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});
