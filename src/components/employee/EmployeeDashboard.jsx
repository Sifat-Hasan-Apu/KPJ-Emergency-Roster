"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { getMonthDays, MONTH_NAMES } from '@/utils/dateUtils';
import { SHIFTS } from '@/data/shiftDefinitions';
import ShiftRequestModal from './ShiftRequestModal';
import { doc, onSnapshot, addDoc, collection, serverTimestamp, query, where, orderBy } from 'firebase/firestore';
import { notifyAdmins } from '@/utils/notificationUtils';
import { db } from '@/lib/firebase/client';
import { Hind_Siliguri } from 'next/font/google';
import confetti from 'canvas-confetti';
import LeaveBannerCharacter from './LeaveBannerCharacter';
import AnnouncementBanner from '@/components/common/AnnouncementBanner';

const hindSiliguri = Hind_Siliguri({
    subsets: ['bengali'],
    weight: ['300', '400', '500', '600', '700']
});

// --- Premium Roster Styles ---
const ROSTER_STYLES = {
    'M': {
        gradient: 'from-sky-400 to-blue-500',
        shadow: 'shadow-[0_0_15px_-3px_rgba(56,189,248,0.4)]',
        text: 'text-white'
    },
    'E': {
        gradient: 'from-amber-400 to-orange-500',
        shadow: 'shadow-[0_0_15px_-3px_rgba(251,191,36,0.4)]',
        text: 'text-white'
    },
    'N': {
        gradient: 'from-indigo-500 to-violet-600',
        shadow: 'shadow-[0_0_15px_-3px_rgba(99,102,241,0.4)]',
        text: 'text-white'
    },
    'G': {
        gradient: 'from-emerald-400 to-teal-500',
        shadow: 'shadow-[0_0_15px_-3px_rgba(52,211,153,0.4)]',
        text: 'text-white'
    },
    'O': {
        gradient: 'from-slate-800 to-slate-900', // Minimal dark
        shadow: '',
        text: 'text-slate-500',
        border: 'border-slate-700/50'
    },
    'CL': {
        gradient: 'from-pink-500 to-fuchsia-600',
        shadow: 'shadow-[0_0_15px_-3px_rgba(236,72,153,0.4)]',
        text: 'text-white'
    },
    'AL': {
        gradient: 'from-violet-500 to-purple-600',
        shadow: 'shadow-[0_0_15px_-3px_rgba(139,92,246,0.4)]',
        text: 'text-white'
    },
    'SL': {
        gradient: 'from-rose-500/20 to-red-600/20',
        shadow: '',
        text: 'text-rose-400',
        border: 'border-rose-500/30'
    },
    'default': {
        gradient: 'from-slate-800/50 to-slate-900/50',
        text: 'text-slate-600',
        border: 'border-slate-800'
    }
};

const getShiftStyle = (code) => {
    return ROSTER_STYLES[code] || ROSTER_STYLES.default;
};

// Vibrant Fireworks Effect
const FireworksConfetti = () => {
    React.useEffect(() => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 },
            zIndex: 100
        };

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }, []);

    return null;
};

const EmployeeDashboard = () => {
    const { currentUser, logout, requestNotificationPermission } = useAuth();
    const [activeTab, setActiveTab] = useState('today');
    const [selectedDate, setSelectedDate] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Date State for Roster View
    const [viewDate, setViewDate] = useState(new Date());
    const [rosterData, setRosterData] = useState({});
    const [isRosterLoaded, setIsRosterLoaded] = useState(false);

    // Announcement State
    const [announcement, setAnnouncement] = useState(null);
    const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(false);
    const [isAnnouncementChecked, setIsAnnouncementChecked] = useState(false);

    // Announcement Listener
    React.useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "settings", "announcement"),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.isActive && data.message) {
                        setAnnouncement(data);
                        setShowAnnouncementBanner(true);
                    } else {
                        setShowAnnouncementBanner(false);
                    }
                } else {
                    setShowAnnouncementBanner(false);
                }
                setIsAnnouncementChecked(true); // Check complete
            },
            (error) => {
                console.error("Error fetching announcement:", error);
                setIsAnnouncementChecked(true); // Unblock on error
            }
        );
        return () => unsubscribe();
    }, []);

    // PREVENT FLASH: Show full-screen loader until announcement check completes


    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();
    const days = getMonthDays(currentYear, currentMonth);

    // Fetch Roster Data for the Viewed Month
    React.useEffect(() => {
        setIsRosterLoaded(false);
        const rosterDocId = `${currentYear}-${currentMonth + 1}`; // e.g., 2026-2

        const unsubscribe = onSnapshot(doc(db, "roster_assignments", rosterDocId), (docSnap) => {
            if (docSnap.exists()) {
                setRosterData(docSnap.data());
            } else {
                setRosterData({});
            }
            setIsRosterLoaded(true);
        });

        return () => unsubscribe();
    }, [currentYear, currentMonth]);

    // Helper: Get Shift for a specific day for CURRENT USER
    const getMyShift = (day) => {
        if (!rosterData) return null;
        // Key format: "YYYY-M-D_uid" -> "2026-1-5_uid123" (Month is 0-indexed)
        const key = `${currentYear}-${currentMonth}-${day}_${currentUser.uid}`;
        const shiftCode = rosterData[key];
        return shiftCode ? SHIFTS[shiftCode] : null;
    };

    const handleMonthChange = (direction) => {
        setViewDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    const handleDateClick = (dayObj) => {
        // Only allow future dates
        // For demo, let's say dates > today are clickable
        const today = new Date().getDate();
        if (dayObj.date > today) {
            setSelectedDate(dayObj.fullDate);
            setIsModalOpen(true);
        }
    };

    const handleRequestSubmit = async (requestData) => {
        try {
            // Build request document
            const requestDoc = {
                requestType: requestData.requestType,
                dates: requestData.dates || [selectedDate],
                requestedShift: requestData.requestedShift || null,
                reason: requestData.reason,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.name || currentUser.email,
                userEid: currentUser.eid || "N/A",
                status: 'pending',
                createdAt: serverTimestamp(),
                month: `${currentYear}-${currentMonth + 1}`
            };

            // Add swap-specific fields
            if (requestData.requestType === 'SWAP') {
                requestDoc.swapWithUserId = requestData.swapWithUserId || null;
                requestDoc.swapWithUserName = requestData.swapWithUserName || null;
                requestDoc.currentShift = requestData.currentShift || null;
            }

            await addDoc(collection(db, "requests"), requestDoc);

            // Build notification message
            const dateStr = requestData.dates?.length > 1
                ? `${requestData.dates.length} দিন`
                : requestData.dates?.[0] || selectedDate;
            const typeLabel = requestData.requestType === 'LEAVE' ? 'ছুটি' :
                requestData.requestType === 'SWAP' ? 'Swap' : 'Shift Change';

            await notifyAdmins(
                `নতুন ${typeLabel} Request`,
                `${currentUser.displayName || currentUser.name || currentUser.email} - ${dateStr}`,
                { requestId: (requestData.dates?.[0] || selectedDate) + "_" + currentUser.uid }
            );

            alert("Request সফলভাবে পাঠানো হয়েছে!");
        } catch (error) {
            console.error("Error submitting request:", error);
            alert("Request পাঠাতে ব্যর্থ হয়েছে।");
        }
        setIsModalOpen(false);
    };

    // Calculate Today's Shift
    const todayObj = new Date();
    const isSameMonth = todayObj.getMonth() === currentMonth && todayObj.getFullYear() === currentYear;
    const todayDate = todayObj.getDate();

    // We need to fetch today's data specifically if we are not on the current month view?
    // Actually, usually dashboard shows today's status immediately. 
    // Let's assume for simplicity we primarily use the `rosterData` if it matches this month.
    // Ideally, we might want a separate listener for "Today" if the user navigates away, 
    // but typically users stay near current date. 
    // For robust "Today" tab, let's keep it simple: It uses the SAME rosterData if month matches.
    // If user navigates to next month, "Today" tab might look empty unless we handle it independent.
    // FIX: Let's force "Today" tab to always check the REAL current month data, or just reset view to today when clicking 'Today' tab.

    // Better UX: When clicking "Today" tab, reset viewDate to today.

    const displayedShift = isSameMonth ? getMyShift(todayDate) : null;



    // Safe Name Handling
    const displayName = currentUser.name || currentUser.displayName || currentUser.email?.split('@')[0] || "User";
    const firstName = displayName.split(' ')[0]; // Use first name or full if no space

    // --- Notifications Logic ---
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [newNotification, setNewNotification] = useState(null); // For Popup
    const isInitialLoad = React.useRef(true);

    // Fetch Notifications
    React.useEffect(() => {
        if (!currentUser?.uid) return;

        // SIMPLIFIED QUERY: Removed orderBy to avoid "Missing Index" error on production
        // We will sort client-side.
        const q = query(
            collection(db, "notifications"),
            where("userId", "==", currentUser.uid)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Client-side Sort (Newest first)
            notifs.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA;
            });

            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);

            // Detect NEW notification for Popup
            if (!isInitialLoad.current) {
                snapshot.docChanges().forEach((change) => {
                    if (change.type === "added") {
                        // Show popup for the new item
                        const newMsg = change.doc.data();
                        setNewNotification({
                            id: change.doc.id,
                            title: newMsg.title,
                            body: newMsg.body,
                            type: newMsg.type
                        });

                        // Auto-hide after 5 seconds
                        setTimeout(() => setNewNotification(null), 5000);
                    }
                });
            }
            isInitialLoad.current = false;
        });

        return () => unsubscribe();
    }, [currentUser]);

    // PREVENT FLASH: Show full-screen loader until announcement check completes
    if (!isAnnouncementChecked) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-cyan-500/30 relative">

            {/* --- WhatsApp-style Popup Notification --- */}
            <AnimatePresence>
                {newNotification && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="fixed top-4 left-4 right-4 z-[60] mx-auto max-w-sm"
                    >
                        <div className={`p-4 rounded-2xl shadow-2xl border backdrop-blur-md flex gap-4 items-start ${newNotification.type === 'success' ? 'bg-indigo-900/90 border-indigo-500/50 text-white' :
                            newNotification.type === 'error' ? 'bg-red-900/90 border-red-500/50 text-white' :
                                'bg-slate-800/90 border-slate-600/50 text-white'
                            }`}>
                            <div className={`p-2 rounded-full shrink-0 ${newNotification.type === 'success' ? 'bg-indigo-500' :
                                newNotification.type === 'error' ? 'bg-red-500' : 'bg-slate-600'
                                }`}>
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {newNotification.type === 'success' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    ) : newNotification.type === 'error' ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    )}
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0" onClick={() => setIsNotificationsOpen(true)}>
                                <h4 className="font-bold text-sm truncate">{newNotification.title}</h4>
                                <p className="text-sm opacity-90 line-clamp-2">{newNotification.body}</p>
                            </div>
                            <button onClick={() => setNewNotification(null)} className="opacity-70 hover:opacity-100">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Announcement Banner */}
            {showAnnouncementBanner && announcement && (
                <AnnouncementBanner
                    message={announcement.message}
                    onDismiss={() => setShowAnnouncementBanner(false)}
                />
            )}

            <ShiftRequestModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                date={selectedDate}
                currentShift={selectedDate ? getMyShift(parseInt(selectedDate.split('-')[2])) : null}
                onSubmit={handleRequestSubmit}
                currentUserId={currentUser?.uid}
            />

            {/* Notification Center (Modal/Panel) */}
            <AnimatePresence>
                {isNotificationsOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
                            onClick={() => setIsNotificationsOpen(false)}
                        />
                        <motion.div
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col"
                        >
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/95 backdrop-blur">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    Notifications
                                    {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount}</span>}
                                </h3>
                                <button onClick={() => setIsNotificationsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {notifications.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-slate-500">
                                        <svg className="w-10 h-10 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                        <p className="text-sm">No notifications yet</p>
                                    </div>
                                ) : (
                                    notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 rounded-xl border transition-all ${notif.type === 'success' ? 'bg-indigo-500/10 border-indigo-500/30' :
                                                notif.type === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className={`text-sm font-bold ${notif.type === 'success' ? 'text-indigo-400' : notif.type === 'error' ? 'text-red-400' : 'text-slate-200'}`}>
                                                    {notif.title}
                                                </h4>
                                                <span className="text-[10px] text-slate-500">
                                                    {notif.createdAt?.toDate().toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-300 leading-relaxed">
                                                {notif.body}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Minimal Header */}
            <header className="px-6 pt-8 pb-4 flex justify-between items-end sticky top-0 z-10 bg-slate-950/80 backdrop-blur-xl">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter text-white">
                        Hi, {firstName}
                    </h1>
                    <p className="text-sm text-slate-500 font-medium tracking-wide">ID: {currentUser.eid || "N/A"}</p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setIsNotificationsOpen(true)}
                        className="relative bg-slate-900 ring-1 ring-slate-800 p-2.5 rounded-full text-slate-400 hover:text-white transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        {/* Red Dot Badge */}
                        {unreadCount > 0 && (
                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950 animate-pulse"></span>
                        )}
                    </button>

                    <button
                        onClick={logout}
                        className="bg-slate-900 ring-1 ring-slate-800 p-2.5 rounded-full text-slate-400 hover:text-white transition-all active:scale-95"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="px-4 pb-28">
                {activeTab === 'today' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-6 mt-4"
                    >
                        {displayedShift ? (
                            <div className="relative overflow-hidden rounded-[2rem] p-8 min-h-[320px] flex flex-col justify-between shadow-2xl shadow-indigo-500/100">
                                {/* Dynamic Background based on shift */}
                                <div className={`absolute inset-0 opacity-20 ${displayedShift.code === 'N' ? 'bg-indigo-600' :
                                    displayedShift.code === 'M' ? 'bg-sky-500' :
                                        displayedShift.code === 'O' ? 'bg-emerald-600' :
                                            displayedShift.code === 'CL' ? 'bg-pink-600' :
                                                displayedShift.code === 'AL' ? 'bg-violet-600' :
                                                    displayedShift.code === 'SL' ? 'bg-rose-600' : 'bg-slate-700'}`}></div>
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950/90"></div>

                                {displayedShift.code === 'O' && <FireworksConfetti />}



                                {/* Content */}
                                <div className="relative z-10 flex justify-between items-start">
                                    <span className="bg-white/10 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium text-white/90 border border-white/5">
                                        TODAY
                                    </span>
                                    {displayedShift.code === 'N' && <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"></div>}
                                </div>

                                {displayedShift.code === 'O' ? (
                                    <div className="relative z-10 text-center space-y-4 py-4">
                                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md border border-emerald-500/30 animate-pulse">
                                            <span className="text-4xl">☕</span>
                                        </div>
                                        <h2 className={`text-2xl font-bold text-white leading-relaxed max-w-sm mx-auto ${hindSiliguri.className}`}>
                                            আজ আপনার ছুটি! নিজের জন্য সময় কাটান এবং বিশ্রাম নিন।
                                        </h2>
                                    </div>
                                ) : (displayedShift.code === 'CL' || displayedShift.code === 'AL') ? (
                                    <div className="relative z-10 w-full flex items-center justify-center pt-8">
                                        <LeaveBannerCharacter type={displayedShift.code} />
                                    </div>
                                ) : displayedShift.code === 'SL' ? (
                                    <div className="relative z-10 text-center space-y-4 py-10">
                                        <p className="text-white/60 text-sm font-semibold tracking-widest uppercase">
                                            Sick Leave (SL)
                                        </p>
                                        <h2 className={`text-3xl font-bold text-white leading-relaxed max-w-sm mx-auto ${hindSiliguri.className}`}>
                                            দ্রুত সুস্থ হয়ে উঠুন! নিজের যত্ন নিন।
                                        </h2>
                                    </div>
                                ) : (
                                    <div className="relative z-10 text-center space-y-2">
                                        <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-2xl">
                                            {displayedShift.code}
                                        </h2>
                                        <h3 className="text-2xl font-bold text-slate-200 tracking-tight">
                                            {displayedShift.label}
                                        </h3>
                                        <p className="text-slate-400 text-lg font-medium tracking-wide font-mono">
                                            {displayedShift.time}
                                        </p>
                                    </div>
                                )}

                                <div className="relative z-10 text-center">
                                    <p className="text-xs text-slate-500 uppercase tracking-widest font-semibold">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-[2rem] p-8 h-80 flex flex-col justify-center items-center text-center bg-slate-900/50 border border-slate-800/50 border-dashed">
                                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-6 text-slate-500">
                                    {/* Calendar Icon */}
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="text-slate-500 text-xs font-bold tracking-widest uppercase mb-2">
                                    UNASSIGNED SHIFT
                                </p>
                                <h2 className="text-xl font-bold text-slate-400 mb-2">No Roster Found</h2>
                                <p className={`text-slate-500 text-sm max-w-[280px] leading-relaxed ${hindSiliguri.className}`}>
                                    এই তারিখের জন্য আপনার কোনো ডিউটি অ্যাসাইন করা হয়নি। প্রয়োজনে এডমিনের সাথে কথা বলুন।
                                </p>
                            </div>
                        )}

                        {/* Request Button Removed - Click on dates instead */}
                        <div className="text-center text-slate-500 text-sm mt-4">
                            <p>Tap on a future date in the Roster to request a change.</p>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'roster' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="mt-6"
                    >
                        {/* Elegant Month Navigation */}
                        <div className="flex items-center justify-between mb-8 px-4">
                            <h2 className="text-2xl font-bold text-white tracking-tight">Roster</h2>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => handleMonthChange(-1)}
                                    className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                </button>

                                <div className="text-center">
                                    <span className="block text-sm font-bold text-white tracking-wide">
                                        {MONTH_NAMES[currentMonth]}
                                    </span>
                                    <span className="block text-xs text-slate-500 font-medium">
                                        {currentYear}
                                    </span>
                                </div>

                                <button
                                    onClick={() => handleMonthChange(1)}
                                    className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:border-slate-600 transition-all active:scale-95"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                </button>
                            </div>
                        </div>

                        {/* Notification Permission Button - Styled */}
                        <div className="px-6 mb-4 flex justify-end">
                            <button
                                onClick={() => requestNotificationPermission()}
                                className="group relative px-4 py-2 rounded-full bg-slate-900 border border-indigo-500/30 text-indigo-400 hover:text-white hover:border-indigo-500/60 hover:bg-indigo-500/10 transition-all duration-300 flex items-center gap-2 overflow-hidden shadow-lg shadow-indigo-500/10"
                            >
                                <span className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="relative p-1 rounded-full bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors">
                                    <svg className="w-3.5 h-3.5 group-hover:animate-swing" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                </div>
                                <span className="text-xs font-bold tracking-wide relative">Enable Notifications</span>
                            </button>
                        </div>

                        {!isRosterLoaded ? (
                            <div className="flex justify-center py-32">
                                <div className="relative">
                                    <div className="w-10 h-10 border-2 border-slate-800 rounded-full"></div>
                                    <div className="absolute top-0 left-0 w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            </div>
                        ) : Object.keys(rosterData).length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 opacity-50">
                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 text-slate-700">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="text-slate-500 font-medium">No roster published</p>
                            </div>
                        ) : (
                            <motion.div
                                className="bg-slate-900/50 border border-slate-800/50 rounded-3xl p-6 backdrop-blur-sm"
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.4 }}
                            >
                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 mb-6 text-center">
                                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d, i) => (
                                        <div key={i} className="text-[10px] uppercase tracking-widest font-bold text-slate-600">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Calendar Grid */}
                                <div className="grid grid-cols-7 gap-y-6 gap-x-2">
                                    {days.map((day, index) => {
                                        const shift = getMyShift(day.date);
                                        const isToday = day.date === new Date().getDate() &&
                                            currentMonth === new Date().getMonth() &&
                                            currentYear === new Date().getFullYear();

                                        const style = shift ? getShiftStyle(shift.code) : ROSTER_STYLES.default;

                                        return (
                                            <motion.div
                                                key={day.date}
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => {
                                                    const today = new Date();
                                                    // Allow requests for tomorrow onwards
                                                    const targetDate = new Date(currentYear, currentMonth, day.date);
                                                    if (targetDate > today) {
                                                        setSelectedDate(day.fullDate); // Ensure fullDate format is YYYY-M-D
                                                        setIsModalOpen(true);
                                                    }
                                                }}
                                                className="flex flex-col items-center gap-1 group cursor-pointer"
                                            >
                                                {/* Shift Bubble */}
                                                <div className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center relative
                                                    bg-gradient-to-br ${style.gradient} 
                                                    ${style.shadow}
                                                    ${style.border ? `border ${style.border}` : ''}
                                                    ${isToday ? 'ring-2 ring-white scale-110 z-10 shadow-lg shadow-white/10' : ''}
                                                    transition-all duration-300 md:group-hover:scale-110
                                                `}>
                                                    {shift ? (
                                                        <span className={`text-[11px] font-bold ${style.text} tracking-tight`}>
                                                            {shift.code}
                                                        </span>
                                                    ) : (
                                                        <span className="text-[10px] text-slate-700">&middot;</span>
                                                    )}
                                                </div>

                                                {/* Date Label */}
                                                <span className={`text-[10px] font-medium transition-colors ${isToday ? 'text-white' : 'text-slate-600 group-hover:text-slate-400'
                                                    }`}>
                                                    {day.date}
                                                </span>

                                                {/* Optional: Small dot for Today under date */}
                                                {isToday && (
                                                    <div className="w-1 h-1 bg-cyan-500 rounded-full absolute -bottom-2"></div>
                                                )}
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </main>

            {/* Floating Bottom Nav */}
            <nav className="fixed bottom-6 left-6 right-6 bg-slate-900/90 backdrop-blur-xl border border-white/5 rounded-2xl shadow-2xl shadow-black/50 py-4 px-8 z-30 flex justify-between items-center">
                <button
                    onClick={() => {
                        setActiveTab('today');
                        setViewDate(new Date());
                    }}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'today' ? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                </button>

                <div className="w-px h-8 bg-slate-800"></div>

                <button
                    onClick={() => setActiveTab('roster')}
                    className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab === 'roster' ? 'text-cyan-400 scale-110' : 'text-slate-500 hover:text-slate-400'}`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </button>

                <div className="w-px h-8 bg-slate-800"></div>

                <button className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-400 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                </button>
            </nav>

            {/* Developer Credit */}
            <div className="text-center py-6 pb-24 opacity-60">
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-0.5">Developed by</p>
                <p className="text-sm font-semibold text-slate-400">Abubakar Siddik Sumon</p>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
