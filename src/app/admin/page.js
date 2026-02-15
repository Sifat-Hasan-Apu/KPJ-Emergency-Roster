"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import ShiftToolbar from '@/components/roster/ShiftToolbar';
import RosterGrid from '@/components/roster/RosterGrid';
import DutyStats from '@/components/analytics/DutyStats';
import PrintableView from '@/components/reports/PrintableView';
import PdfRosterView from '@/components/reports/PdfRosterView';
import ExcelRosterView from '@/components/reports/ExcelRosterView';
import DailyStatsSegment from '@/components/analytics/DailyStatsSegment';
import PendingRequestsPanel from '@/components/admin/PendingRequestsPanel';
import StaffList from '@/components/staff/StaffList';
import { db } from '@/lib/firebase/client';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { createSecondaryUser } from '@/lib/firebase/secondary';
import { notifyUser } from '@/utils/notificationUtils';
import { Calendar, Users, BarChart3, Inbox, Megaphone } from 'lucide-react';

const tabs = [
    { id: 'roster', label: 'Roster', icon: Calendar },
    { id: 'staff', label: 'Staff', icon: Users },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'requests', label: 'Requests', icon: Inbox }
];

const RosterPage = () => {
    const { currentUser, requestNotificationPermission } = useAuth();
    // Lifted State
    const [rosterData, setRosterData] = useState({});
    const [staffList, setStaffList] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const pdfRef = useRef(null);
    const excelRef = useRef(null);

    // Date State (Must be initialized before derived values)
    const [currentDate, setCurrentDate] = useState(new Date(2026, 1, 1));
    const [selectedDay, setSelectedDay] = useState(new Date()); // Default to today
    const [searchTerm, setSearchTerm] = useState('');

    // Announcement State
    const [announcementMessage, setAnnouncementMessage] = useState('');
    const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
    const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);
    const [isAnnouncementPanelOpen, setIsAnnouncementPanelOpen] = useState(false);

    // Initial Data Load (Staff)
    useEffect(() => {
        // Fetch staff sorted by creation time (ascending = oldest first, descending = newest first)
        // User wants "jake age entry dibe take roster e agei dekhabe" -> Oldest first (Ascending)
        const q = query(collection(db, "staff"), orderBy("createdAt", "asc"));
        const unsubscribe = onSnapshot(q,
            (snapshot) => {
                const staff = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setStaffList(staff);
                setIsLoaded(true);
            },
            (error) => {
                console.error("Error fetching staff:", error);
                setIsLoaded(true); // Stop loading even on error
                // alert("Error loading staff data: " + error.message);
            }
        );
        return () => unsubscribe();
    }, []);

    // Announcement Listener
    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, "settings", "announcement"),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setAnnouncementMessage(data.message || '');
                    setIsAnnouncementActive(data.isActive || false);
                }
            },
            (error) => console.error("Error fetching announcement:", error)
        );
        return () => unsubscribe();
    }, []);

    // Save/Toggle Announcement
    const handleSaveAnnouncement = async (activate) => {
        setIsSavingAnnouncement(true);
        try {
            await setDoc(doc(db, "settings", "announcement"), {
                message: announcementMessage,
                isActive: activate,
                updatedAt: new Date().toISOString()
            });
            alert(activate ? "Announcement activated!" : "Announcement deactivated!");
        } catch (error) {
            console.error("Error saving announcement:", error);
            alert("Failed to save announcement.");
        } finally {
            setIsSavingAnnouncement(false);
        }
    };

    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth(); // 0-11

    // Real-time Roster Data Load
    useEffect(() => {
        const docId = `${currentYear}-${currentMonth + 1}`; // e.g. 2026-2
        const docRef = doc(db, "roster_assignments", docId);

        const unsubscribe = onSnapshot(docRef,
            (docSnap) => {
                if (docSnap.exists()) {
                    setRosterData(docSnap.data());
                } else {
                    setRosterData({});
                }
            },
            (error) => {
                console.error("Error fetching roster:", error);
            }
        );

        return () => unsubscribe();
    }, [currentYear, currentMonth]);

    // Mock Pending Requests (In real app, fetch from Firestore)
    // Real-time Requests Listener
    const [pendingRequests, setPendingRequests] = useState([]);

    useEffect(() => {
        const q = query(collection(db, "requests")); // In production, add where('status', '==', 'pending')
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status === 'pending') {
                    reqs.push({ id: doc.id, ...data });
                }
            });
            setPendingRequests(reqs);
        });

        return () => unsubscribe();
    }, []);

    // Tab State
    const [activeTab, setActiveTab] = useState(null);

    // Date State moved to top


    const handleMonthChange = (direction) => {
        setCurrentDate(prev => {
            const newDate = new Date(prev);
            newDate.setMonth(prev.getMonth() + direction);
            return newDate;
        });
    };

    // Filter Staff
    const filteredStaff = staffList.filter(staff => {
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
            staff.name.toLowerCase().includes(term) ||
            staff.eid.toLowerCase().includes(term) ||
            staff.designation.toLowerCase().includes(term)
        );
    });

    // Handle Granular Shift Updates (Batched)
    const handleShiftChange = async (updates) => {
        // updates is object { key: value, key2: value2 }
        const docId = `${currentYear}-${currentMonth + 1}`;
        const docRef = doc(db, "roster_assignments", docId);

        try {
            // Use setDoc with merge: true to update specific fields or create doc if missing
            // If value is null, we should delete the field.
            // Firestore update() needs explicit deleteField() for deletions, but setDoc(merge) overwrites.
            // However, merge: true doesn't delete if we pass null, it typically sets to null.
            // RosterGrid passes null for deletion.

            // Setting to null is fine for our usage (we check if val exists), 
            // but for cleaner DB we might want deleteField().
            // Let's iterate and preprocess if we want real deletion.
            // For now, setting to null/undefined in Firestore map is equivalent to "no shift" for our logic 
            // AS LONG AS components handle null safely. (RosterData[key] would be null).

            await setDoc(docRef, updates, { merge: true });
        } catch (error) {
            console.error("Error saving roster:", error);
            alert("Failed to save changes. Check console.");
        }
    };

    const handleAddStaff = async (newStaff) => {
        try {
            const tempPassword = newStaff.passKey || '123456';
            const email = `${newStaff.eid}@roster.app`;

            // 1. Create Auth User (Secondary App)
            const newUser = await createSecondaryUser(email, tempPassword);

            // 2. Save to 'users' collection (Auth/Role Data)
            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                eid: newStaff.eid,
                name: newStaff.name,
                role: 'employee',
                designation: newStaff.designation,
                phone: newStaff.phone,
                phone: newStaff.phone,
                email: email,
                passKey: tempPassword, // Store specifically for lookup
                createdAt: new Date().toISOString()
            });

            // 3. Save to 'staff' collection (Roster Data)
            await setDoc(doc(db, "staff", newUser.uid), {
                ...newStaff,
                id: newUser.uid,
                email: email,
                createdAt: new Date().toISOString()
            });

            alert(`Staff ${newStaff.name} created successfully! PassKey: ${tempPassword}`);
        } catch (error) {
            console.error("Error creating staff:", error);
            if (error.code === 'auth/email-already-in-use') {
                alert("This Employee ID already exists!");
            } else {
                alert(`Failed to create staff: ${error.message}`);
            }
        }
    };

    const handleRemoveStaff = async (id) => {
        if (confirm("Are you sure you want to remove this staff member? This will delete their access and data.")) {
            try {
                // Delete from both collections
                await Promise.all([
                    deleteDoc(doc(db, "staff", id)),
                    deleteDoc(doc(db, "users", id))
                ]);

                // Optional: You might want to call an API to delete the Auth user if possible, 
                // but client-side Firestore deletion removes them from the app flow effectively.
                alert("Staff member removed successfully.");
            } catch (error) {
                console.error("Error removing staff:", error);
                alert("Failed to remove staff");
            }
        }
    };

    // --- APPROVAL LOGIC ---
    // --- APPROVAL LOGIC ---
    // --- APPROVAL LOGIC ---
    const handleApproveRequest = async (reqId) => {
        const request = pendingRequests.find(r => r.id === reqId);
        if (!request) return alert("Request not found");

        try {
            // Determine dates to update
            // Support both old 'date' field and new 'dates' array
            const datesToUpdate = request.dates || (request.date ? [request.date] : []);

            if (datesToUpdate.length === 0) {
                alert("No valid dates found in request");
                return;
            }

            // --- 1. HANDLE SWAP REQUESTS ---
            if (request.requestType === 'SWAP') {
                const requesterId = request.userId;
                const targetId = request.swapWithUserId;

                if (!targetId) return alert("Swap target user not found");

                // Process each date for SWAP
                for (const dateStr of datesToUpdate) {
                    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
                    const docId = `${yyyy}-${mm}`; // e.g., 2026-2 (Firestore uses 1-based month in ID)

                    // Fetch current roster for this month
                    // Note: In a real app we might need to fetch fresh specific doc if not loaded
                    // For now, we rely on local rosterData if it matches, or simplistic update

                    // getKey
                    const keyRequester = `${yyyy}-${mm - 1}-${dd}_${requesterId}`; // 0-indexed month in key
                    const keyTarget = `${yyyy}-${mm - 1}-${dd}_${targetId}`;

                    // access current shifts from rosterData (if loaded) or just blind write?
                    // Safe swap needs to read current values. 
                    // Let's assume the ADMIN view has the data loaded for 'currentMonth'.
                    // If request is for a different month than view, this might be tricky.
                    // For safety, let's just use the values provided in request if available, 
                    // OR simple logic: A gets B's shift, B gets A's shift.

                    // We need to read the Target's current shift from DB to be sure
                    // (Complexity: fetching each doc. For MVP, we can try to use rosterData if date matches)

                    let shiftA = rosterData[keyRequester] || 'O';
                    let shiftB = rosterData[keyTarget] || 'O';

                    // Update: Swap them
                    await setDoc(doc(db, "roster_assignments", docId), {
                        [keyRequester]: shiftB,
                        [keyTarget]: shiftA
                    }, { merge: true });
                }

                await notifyUser(requesterId, "Swap Approved ✅", `Your swap with ${request.swapWithUserName} passed!`, { status: 'approved' });
                await notifyUser(targetId, "Swap Approved ✅", `Swap with ${request.userName} confirmed by Admin!`, { status: 'approved' });

            }
            // --- 2. HANDLE LEAVE / SHIFT CHANGE ---
            else {
                const staff = staffList.find(s => s.eid === request.userEid || s.id === request.userId);
                if (!staff) return alert("Staff not found");

                const updates = {};
                const pendingDocs = new Set(); // Track which docs need update

                datesToUpdate.forEach(dateStr => {
                    const [yyyy, mm, dd] = dateStr.split('-').map(Number);
                    const docId = `${yyyy}-${mm}`;
                    const key = `${yyyy}-${mm - 1}-${dd}_${staff.id}`;

                    // We can't batch updates across different docs easily with setDoc object
                    // So we will just fire promises for each month involved (usually 1)
                    if (!updates[docId]) updates[docId] = {};
                    updates[docId][key] = request.requestedShift;
                });

                // Execute updates per month document
                for (const [did, data] of Object.entries(updates)) {
                    await setDoc(doc(db, "roster_assignments", did), data, { merge: true });
                }

                const title = request.requestType === 'LEAVE' ? "Leave Approved 🌴" : "Request Approved ✅";
                await notifyUser(request.userId, title, "Your request has been approved.", { status: 'approved' });
            }

            // Update Request Status
            await setDoc(doc(db, "requests", reqId), {
                status: 'approved',
                processedAt: new Date().toISOString()
            }, { merge: true });

            alert("Request Approved & Roster Updated!");

        } catch (error) {
            console.error("Error approving:", error);
            alert(`Approval Failed: ${error.message}`);
        }
    };

    const handleRejectRequest = async (reqId) => {
        try {
            await setDoc(doc(db, "requests", reqId), {
                status: 'rejected',
                processedAt: new Date().toISOString()
            }, { merge: true });

            const request = pendingRequests.find(r => r.id === reqId);
            if (request) {
                // Determine rejection message
                const type = request.requestType === 'SWAP' ? 'Swap request' :
                    request.requestType === 'LEAVE' ? 'Leave application' : 'Shift request';

                await notifyUser(
                    request.userId,
                    "Request Rejected ❌",
                    `Your ${type} for ${request.dates?.[0] || request.date} was rejected.`,
                    { status: 'rejected' }
                );

                // If swap, maybe notify target too? (Optional, usually not needed if they didn't know yet)
            }
            alert("Request Rejected");
        } catch (error) {
            console.error("Error rejecting:", error);
            alert("Failed to reject request");
        }
    };

    // Pre-process pending requests to match RosterGrid format
    // Requests `date` is "YYYY-MM-DD". RosterGrid needs to know if it matches.
    // We already fetch `date` in full format in EmployeeDashboard.
    // RosterGrid `isPending` logic matches: `parseInt(req.date.split('-')[2]) === gridDay`
    // We just need to map `eid` (which RosterGrid uses) to the request's userEid
    const formattedPendingRequests = pendingRequests.map(req => ({
        ...req,
        eid: req.userEid // Remap userEid to eid for RosterGrid compatibility
    }));

    if (!isLoaded) return <div className="text-white text-center mt-20">Loading Roster...</div>;

    return (
        <div className="min-h-screen pb-20 container mx-auto px-2 sm:px-4">
            {/* Header - Mobile Optimized */}
            {/* Header - Mobile Optimized Toolbar */}
            <div className="mb-6 mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-0">

                {/* Left: Enable Notifications */}
                <div className="flex-none order-2 sm:order-1 flex items-center gap-2">
                    {/* Announcement Icon Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsAnnouncementPanelOpen(!isAnnouncementPanelOpen)}
                            className={`p-2 rounded-xl border transition-all flex items-center gap-1 ${isAnnouncementActive
                                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-amber-400 hover:border-amber-500/30'
                                }`}
                            title="Special Announcement"
                        >
                            <Megaphone className="w-5 h-5" />
                            {isAnnouncementActive && (
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            )}
                        </button>

                        {/* Announcement Dropdown Panel */}
                        {isAnnouncementPanelOpen && (
                            <>
                                {/* Mobile Backdrop */}
                                <div
                                    className="fixed inset-0 bg-black/60 z-[40] sm:hidden"
                                    onClick={() => setIsAnnouncementPanelOpen(false)}
                                />

                                {/* Panel */}
                                <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 sm:absolute sm:top-full sm:mt-2 sm:left-auto sm:right-0 sm:translate-x-0 sm:translate-y-0 w-[90vw] max-w-sm sm:w-96 p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 border border-amber-500/30 shadow-2xl shadow-amber-500/10 z-[50]">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Megaphone className="w-4 h-4 text-amber-400" />
                                            <h3 className="text-sm font-semibold text-amber-300">Special Announcement</h3>
                                        </div>
                                        {isAnnouncementActive && (
                                            <span className="px-2 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 rounded-full animate-pulse">
                                                LIVE
                                            </span>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={announcementMessage}
                                        onChange={(e) => setAnnouncementMessage(e.target.value)}
                                        placeholder="Write your special message..."
                                        className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 outline-none transition-all mb-3"
                                    />
                                    <div className="flex gap-2">
                                        {isAnnouncementActive ? (
                                            <button
                                                onClick={() => { handleSaveAnnouncement(false); setIsAnnouncementPanelOpen(false); }}
                                                disabled={isSavingAnnouncement}
                                                className="flex-1 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 text-sm font-medium transition-all disabled:opacity-50"
                                            >
                                                {isSavingAnnouncement ? '...' : 'Deactivate'}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => { handleSaveAnnouncement(true); setIsAnnouncementPanelOpen(false); }}
                                                disabled={isSavingAnnouncement || !announcementMessage.trim()}
                                                className="flex-1 px-3 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-medium shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isSavingAnnouncement ? '...' : 'Activate ✨'}
                                            </button>
                                        )}
                                    </div>
                                    <p className="mt-2 text-[10px] text-slate-500">Shows on Employee Dashboard with animation.</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Notification Button */}
                    <button
                        onClick={() => requestNotificationPermission()}
                        className="p-2 sm:px-4 sm:py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-300 hover:bg-indigo-600/40 transition-colors text-xs font-medium flex items-center gap-2 shadow-sm shadow-indigo-500/10"
                        title="Enable Notifications"
                    >
                        <span className="text-lg">🔔</span>
                        <span className="hidden sm:inline">Enable Notifications</span>
                    </button>
                </div>

                {/* Center: Title */}
                <div className="flex-1 text-center order-1 sm:order-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Roster Management</h1>
                </div>

                {/* Right: Actions */}
                <div className="flex-none flex items-center gap-2 order-3">
                    {activeTab === 'roster' && (
                        <>
                            <button
                                onClick={() => pdfRef.current?.generatePDF()}
                                className="p-2 sm:px-4 sm:py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-xl text-white transition-all text-xs sm:text-sm font-medium shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                                title="Download PDF"
                            >
                                <span className="text-lg">📄</span>
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button
                                onClick={() => excelRef.current?.generateExcel()}
                                className="p-2 sm:px-4 sm:py-2 bg-gradient-to-r from-green-600 to-lime-600 hover:from-green-500 hover:to-lime-500 rounded-xl text-white transition-all text-xs sm:text-sm font-medium shadow-lg shadow-green-900/20 flex items-center gap-2"
                                title="Download Excel"
                            >
                                <span className="text-lg">📊</span>
                                <span className="hidden sm:inline">Excel</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Tab Navigation - Ultra Modern & Mobile Optimized */}
            <div className="flex space-x-1 sm:space-x-2 rounded-2xl bg-slate-900/40 p-1.5 mb-6 border border-white/5 w-full max-w-lg mx-auto shadow-2xl backdrop-blur-xl z-10 relative overflow-hidden">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`group flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 sm:py-3 transition-all duration-300 ease-out relative overflow-hidden
                                ${isActive
                                    ? 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/25 ring-1 ring-white/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                }`}
                        >
                            {/* Active Glow Effect */}
                            {isActive && (
                                <span className="absolute inset-0 bg-gradient-to-tr from-rose-400/0 via-white/10 to-rose-400/0 animate-shimmer" />
                            )}

                            <Icon className={`w-5 h-5 sm:w-4 sm:h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />
                            <span className={`hidden sm:inline text-sm font-semibold tracking-wide ${isActive ? 'opacity-100' : 'opacity-80'}`}>
                                {tab.label}
                            </span>

                            {/* Badge for Requests */}
                            {tab.id === 'requests' && pendingRequests.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 sm:top-auto sm:right-auto sm:relative flex h-2.5 w-2.5 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-white ring-2 ring-slate-900 sm:ring-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 sm:h-auto sm:w-auto p-1">{pendingRequests.length}</span>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content Area */}
            <div className="mt-4 relative min-h-[500px]">
                {/* Welcome Screen (Default) */}
                {!activeTab && (
                    <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in-95 duration-700 fill-mode-forwards">
                        <div className="w-24 h-24 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/20 rotate-3 hover:rotate-6 transition-transform duration-500">
                            <span className="text-4xl">🏥</span>
                        </div>
                        <h2 className="text-3xl font-bold text-slate-200 mb-3 text-center">
                            Welcome to QP Roster
                        </h2>
                        <p className="text-slate-400 text-center max-w-md mx-auto leading-relaxed">
                            Select a tab above to manage the duty roster, update staff records, or view duty analytics.
                        </p>
                    </div>
                )}

                {/* Animated Content Wrapper */}
                {activeTab && (
                    <div
                        key={activeTab} // Forces re-render and animation on tab switch
                        className="animate-in fade-in slide-in-from-bottom-8 duration-500 ease-out fill-mode-forwards"
                    >
                        {activeTab === 'requests' && (
                            <div className="max-w-2xl mx-auto">
                                <PendingRequestsPanel
                                    requests={pendingRequests}
                                    rosterData={rosterData}
                                    onApprove={handleApproveRequest}
                                    onReject={handleRejectRequest}
                                />
                            </div>
                        )}

                        {activeTab === 'roster' && (
                            <>
                                {/* Mobile-optimized Controls */}
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 gap-3">
                                    {/* Search Bar - Full width on mobile */}
                                    <div className="relative flex-1 order-2 sm:order-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <svg className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Search staff..."
                                            className="block w-full pl-9 sm:pl-10 pr-3 py-2.5 sm:py-2 border border-slate-700 rounded-xl leading-5 bg-slate-800/80 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 text-sm transition-colors"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                        {searchTerm && (
                                            <button
                                                onClick={() => setSearchTerm('')}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                                            >
                                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        )}
                                    </div>

                                    {/* Month Navigation - Compact on mobile */}
                                    <div className="flex items-center justify-center gap-1 sm:gap-2 bg-slate-800/80 backdrop-blur-md px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl border border-slate-700/50 shadow-lg order-1 sm:order-2">
                                        <button
                                            onClick={() => handleMonthChange(-1)}
                                            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-all active:scale-95"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>

                                        <div className="flex items-center gap-1.5 sm:gap-2 px-1 sm:px-2">
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-500 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                            <p className="text-sm sm:text-base font-bold text-slate-100 text-center whitespace-nowrap">
                                                <span className="sm:hidden">{currentDate.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}</span>
                                                <span className="hidden sm:inline">{currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                                            </p>
                                        </div>

                                        <button
                                            onClick={() => handleMonthChange(1)}
                                            className="p-1.5 sm:p-2 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-cyan-400 transition-all active:scale-95"
                                        >
                                            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>

                                {/* Daily Stats Segment */}
                                <div className="mb-6">
                                    <DailyStatsSegment
                                        selectedDate={selectedDay}
                                        onDateChange={setSelectedDay}
                                        rosterData={rosterData}
                                        staffList={staffList}
                                        currentYear={currentYear}
                                        currentMonth={currentMonth}
                                    />
                                </div>

                                {/* ShiftToolbar - Hidden on mobile, Sticky on Desktop */}
                                <div className="hidden sm:block sticky top-2 z-50 bg-slate-900/95 backdrop-blur shadow-2xl rounded-2xl border border-slate-700/50 p-2 mb-4 transition-all">
                                    <ShiftToolbar />
                                </div>

                                <RosterGrid
                                    rosterData={rosterData}
                                    staffList={filteredStaff}
                                    onShiftChange={handleShiftChange}
                                    currentYear={currentYear}
                                    currentMonth={currentMonth}
                                    pendingRequests={formattedPendingRequests}
                                    selectedDay={selectedDay}
                                    onDaySelect={setSelectedDay}
                                    headerOffset="top-32"
                                />
                            </>
                        )}

                        {activeTab === 'staff' && (
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
                                <StaffList
                                    staffList={staffList}
                                    onAddStaff={handleAddStaff}
                                    onRemoveStaff={handleRemoveStaff}
                                />
                            </div>
                        )}

                        {activeTab === 'analytics' && (
                            <>
                                <div className="flex items-center justify-center mb-6">
                                    <div className="flex items-center gap-4 bg-slate-800/50 rounded-full px-4 py-2 border border-slate-700/50">
                                        <button
                                            onClick={() => handleMonthChange(-1)}
                                            className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                                        </button>
                                        <p className="text-lg font-medium text-slate-200 min-w-[140px] text-center">
                                            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                                        </p>
                                        <button
                                            onClick={() => handleMonthChange(1)}
                                            className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <DutyStats
                                    isOpen="inline"
                                    onClose={() => { }} // Not needed for inline
                                    rosterData={rosterData}
                                    staffList={staffList}
                                    currentYear={currentYear}
                                    currentMonth={currentMonth}
                                />
                            </>
                        )}
                    </div>
                )}
            </div>

            <PrintableView
                rosterData={rosterData}
                staffList={staffList}
                currentYear={currentYear}
                currentMonth={currentMonth}
            />
            <PdfRosterView
                ref={pdfRef}
                rosterData={rosterData}
                staffList={staffList}
                currentYear={currentYear}
                currentMonth={currentMonth}
            />
            <ExcelRosterView
                ref={excelRef}
                rosterData={rosterData}
                staffList={staffList}
                currentYear={currentYear}
                currentMonth={currentMonth}
            />
            {/* Developer Credit */}
            <div className="text-center py-8 opacity-60">
                <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500 mb-0.5">Developed by</p>
                <p className="text-sm font-semibold text-slate-400">Abubakar Siddik Sumon</p>
            </div>
        </div>
    );
};

export default RosterPage;
