"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SHIFTS } from '@/data/shiftDefinitions';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

import { Hind_Siliguri } from 'next/font/google';

const hindSiliguri = Hind_Siliguri({
    subsets: ['bengali'],
    weight: ['300', '400', '500', '600', '700'],
    variable: '--font-hind-siliguri',
});

/**
 * Enhanced Shift Request Modal
 * - Tabs: Leave / Shift Change / Swap
 * - Multi-day leave selection
 * - Staff picker for swaps
 */
const ShiftRequestModal = ({ isOpen, onClose, date, currentShift, onSubmit, currentUserId }) => {
    // Tab state
    const [activeTab, setActiveTab] = useState('leave'); // 'leave' | 'shift' | 'swap'

    // Leave request state
    const [selectedShiftCode, setSelectedShiftCode] = useState('SL');
    const [selectedDates, setSelectedDates] = useState([]);
    const [reason, setReason] = useState('');

    // Swap state
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [isLoadingStaff, setIsLoadingStaff] = useState(false);

    // Helper to normalize date string (remove zero padding) e.g. "2026-02-05" -> "2026-2-5"
    const normalizeDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-').map(Number);
        return `${y}-${m}-${d}`;
    };

    // Initialize selected date logic
    useEffect(() => {
        if (date) {
            const normalized = normalizeDate(date);
            // Only set if not already selected (avoid loop), reset if date prop changes drastically?
            // Actually, we usually want to reset when 'date' changes for a new request.
            // But checking 'includes' is safer for now.
            // Better: just reset to [normalized] if the date prop changes.
            setSelectedDates([normalized]);
        }
    }, [date]);

    // Fetch staff list for swap
    // Fetch staff list for swap
    const fetchStaffList = async () => {
        setIsLoadingStaff(true);
        try {
            const snapshot = await getDocs(collection(db, 'staff'));
            const staff = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(s => s.uid !== currentUserId); // Exclude self
            setStaffList(staff);
        } catch (error) {
            console.error('Failed to fetch staff:', error);
        }
        setIsLoadingStaff(false);
    };

    useEffect(() => {
        if (activeTab === 'swap' && staffList.length === 0) {
            fetchStaffList();
        }
    }, [activeTab]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();

        if (activeTab === 'leave') {
            if (selectedDates.length === 0) {
                alert('অন্তত একটি তারিখ select করুন');
                return;
            }
            onSubmit({
                requestType: 'LEAVE',
                dates: selectedDates,
                requestedShift: selectedShiftCode,
                reason
            });
        } else if (activeTab === 'shift') {
            onSubmit({
                requestType: 'SHIFT_CHANGE',
                dates: [date],
                requestedShift: selectedShiftCode,
                reason
            });
        } else if (activeTab === 'swap') {
            if (!selectedStaff) {
                alert('Swap করার জন্য একজন staff select করুন');
                return;
            }
            onSubmit({
                requestType: 'SWAP',
                dates: [date],
                swapWithUserId: selectedStaff.id,
                swapWithUserName: selectedStaff.name,
                currentShift: currentShift?.code,
                reason
            });
        }

        onClose();
    };

    // Toggle date selection for multi-day leave
    const toggleDate = (d) => {
        setSelectedDates(prev =>
            prev.includes(d)
                ? prev.filter(x => x !== d)
                : [...prev, d].sort()
        );
    };

    // Generate nearby dates for multi-select (7 days from selected date)
    const generateNearbyDates = () => {
        if (!date) return [];
        const [year, month, day] = date.split('-').map(Number);
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(year, month - 1, day + i);
            dates.push({
                value: `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`,
                label: d.getDate(),
                dayName: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
            });
        }
        return dates;
    };

    const nearbyDates = generateNearbyDates();
    const leaveOptions = Object.values(SHIFTS).filter(s => ['SL', 'CL', 'AL'].includes(s.code));
    const shiftOptions = Object.values(SHIFTS).filter(s => ['M', 'E', 'N', 'G', 'O'].includes(s.code));

    const tabs = [
        { id: 'leave', label: 'ছুটি', icon: '🏖️' },
        { id: 'shift', label: 'Shift পরিবর্তন', icon: '🔄' },
        { id: 'swap', label: 'Swap', icon: '🤝' }
    ];

    return (
        <AnimatePresence>
            <div
                className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center ${hindSiliguri.className}`}
                onClick={onClose}
            >
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    transition={{ type: 'spring', damping: 25 }}
                    className="relative w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl sm:rounded-3xl border-t sm:border border-slate-700/50 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Handle Bar (mobile) */}
                    <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto my-3 sm:hidden" />

                    {/* Header */}
                    <div className="px-5 pb-4 border-b border-slate-700/50">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">নতুন Request</h3>
                                <p className="text-xs text-slate-400 font-sans">{date}</p>
                            </div>
                            {currentShift && (
                                <div className="text-right">
                                    <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">বর্তমান</span>
                                    <span className={`block text-sm font-bold ${currentShift.colorClass}`}>{currentShift.label}</span>
                                </div>
                            )}
                        </div>

                        {/* Tabs */}
                        <div className="flex gap-1 bg-slate-900/50 p-1 rounded-xl">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-pink-600 text-white shadow-lg shadow-pink-900/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                        }`}
                                >
                                    <span className="mr-1">{tab.icon}</span>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">

                        {/* Leave Tab */}
                        {activeTab === 'leave' && (
                            <>
                                {/* Multi-day Date Selection */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        তারিখ Select করুন (একাধিক হতে পারে)
                                    </label>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                        {nearbyDates.map(d => (
                                            <button
                                                key={d.value}
                                                type="button"
                                                onClick={() => toggleDate(d.value)}
                                                className={`flex-shrink-0 w-14 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all ${selectedDates.includes(d.value)
                                                    ? 'bg-pink-600/20 border-pink-500 text-pink-400'
                                                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                <span className="text-[10px] opacity-70">{d.dayName}</span>
                                                <span className="text-lg font-bold">{d.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {selectedDates.length > 1 && (
                                        <p className="text-xs text-pink-400 mt-2">
                                            ✓ {selectedDates.length} দিন selected
                                        </p>
                                    )}
                                </div>

                                {/* Leave Type */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                        ছুটির ধরন
                                    </label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {leaveOptions.map(shift => (
                                            <button
                                                key={shift.code}
                                                type="button"
                                                onClick={() => setSelectedShiftCode(shift.code)}
                                                className={`p-3 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${selectedShiftCode === shift.code
                                                    ? 'bg-pink-600/20 border-pink-500 text-pink-400'
                                                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                                    }`}
                                            >
                                                <span className="text-xl font-bold">{shift.code}</span>
                                                <span className="text-[10px] opacity-80">{shift.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Shift Change Tab */}
                        {activeTab === 'shift' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                    কোন Shift চান?
                                </label>
                                <div className="grid grid-cols-5 gap-2">
                                    {shiftOptions.map(shift => (
                                        <button
                                            key={shift.code}
                                            type="button"
                                            onClick={() => setSelectedShiftCode(shift.code)}
                                            className={`p-3 rounded-xl flex flex-col items-center gap-1 border-2 transition-all ${selectedShiftCode === shift.code
                                                ? `${shift.bgClass} ${shift.borderClass} ring-2 ring-pink-500/50`
                                                : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                                                }`}
                                        >
                                            <span className={`text-lg font-bold ${selectedShiftCode === shift.code ? shift.colorClass : ''}`}>
                                                {shift.code}
                                            </span>
                                            <span className="text-[9px] opacity-70">{shift.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Swap Tab */}
                        {activeTab === 'swap' && (
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                    কার সাথে Swap করতে চান?
                                </label>

                                {isLoadingStaff ? (
                                    <div className="flex justify-center py-8">
                                        <div className="w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full animate-spin" />
                                    </div>
                                ) : staffList.length === 0 ? (
                                    <p className="text-center text-slate-500 py-4">কোনো staff পাওয়া যায়নি</p>
                                ) : (
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {staffList.map(staff => (
                                            <button
                                                key={staff.id}
                                                type="button"
                                                onClick={() => setSelectedStaff(staff)}
                                                className={`w-full p-3 rounded-xl flex items-center gap-3 border-2 transition-all text-left ${selectedStaff?.id === staff.id
                                                    ? 'bg-pink-600/20 border-pink-500'
                                                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                                                    }`}
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-600/30 to-rose-600/30 flex items-center justify-center border border-pink-500/20">
                                                    <span className="text-pink-400 font-bold">
                                                        {staff.name?.charAt(0) || '?'}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{staff.name}</p>
                                                    <p className="text-[10px] text-slate-500">{staff.designation} • {staff.eid}</p>
                                                </div>
                                                {selectedStaff?.id === staff.id && (
                                                    <span className="ml-auto text-pink-400">✓</span>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Reason */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                কারণ
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-pink-500/50 min-h-[80px] resize-none text-sm"
                                placeholder="কেন এই request করছেন?"
                                required
                            />
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="p-5 border-t border-slate-700/50 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 transition-colors"
                        >
                            বাতিল
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 text-white font-bold shadow-lg shadow-pink-500/20 hover:opacity-90 transition-opacity"
                        >
                            Request পাঠান
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ShiftRequestModal;
