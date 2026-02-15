"use client";

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Users, Moon, Sun, Sunrise, Briefcase, CalendarOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SHIFT_TYPES = {
    M: { label: 'Morning', icon: Sunrise, color: 'from-amber-500 to-yellow-500', textColor: 'text-amber-400' },
    E: { label: 'Evening', icon: Sun, color: 'from-orange-500 to-red-500', textColor: 'text-orange-400' },
    N: { label: 'Night', icon: Moon, color: 'from-blue-600 to-indigo-600', textColor: 'text-blue-400' },
    G: { label: 'General', icon: Briefcase, color: 'from-teal-500 to-cyan-500', textColor: 'text-teal-400' },
    O: { label: 'Day Off', icon: CalendarOff, color: 'from-emerald-600 to-green-600', textColor: 'text-emerald-400' },
    L: { label: 'Leave', icon: AlertCircle, color: 'from-rose-500 to-pink-600', textColor: 'text-pink-400' }, // Groups CL, AL, SL
    U: { label: 'Unassigned', icon: Users, color: 'from-slate-600 to-slate-700', textColor: 'text-slate-400' }
};

const DailyStatsSegment = ({ selectedDate, onDateChange, rosterData, staffList, currentYear, currentMonth }) => {
    const [selectedShiftType, setSelectedShiftType] = useState(null);

    // Calculate Stats for Selected Date
    const stats = useMemo(() => {
        if (!rosterData || !staffList) return {};

        const day = selectedDate.getDate();
        // Key format: YYYY-M-D_uid (month is 0-indexed in key construction in other files)
        // Let's verify key format from RosterGrid: `${currentYear}-${currentMonth}-${day}_${staffId}`
        // currentMonth passed here should be 0-indexed to match RosterGrid logic if RosterGrid uses 0-indexed month for key.
        // Wait, RosterGrid uses `currentMonth` prop. In page.js: `currentMonth = currentDate.getMonth()` (0-11).
        // So `currentMonth` passed here is 0-indexed.

        const counts = { M: 0, E: 0, N: 0, G: 0, O: 0, L: 0, U: 0 };
        const staffDetails = { M: [], E: [], N: [], G: [], O: [], L: [], U: [] };

        staffList.forEach(staff => {
            const key = `${currentYear}-${currentMonth}-${day}_${staff.id}`;
            const shiftCode = rosterData[key];

            let type = 'U'; // Default Unassigned
            if (shiftCode) {
                if (['CL', 'AL', 'SL'].includes(shiftCode)) type = 'L';
                else if (counts[shiftCode] !== undefined) type = shiftCode;
            }

            counts[type]++;
            staffDetails[type].push({
                ...staff,
                actualCode: shiftCode || 'U'
            });
        });

        return { counts, staffDetails };
    }, [selectedDate, rosterData, staffList, currentYear, currentMonth]);

    const handlePrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 1);
        onDateChange(prev);
    };

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 1);
        onDateChange(next);
    };

    return (
        <div className="mb-6 bg-slate-900/50 rounded-2xl border border-slate-800 p-4 backdrop-blur-sm">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handlePrevDay}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center">
                        <h3 className="text-lg font-bold text-white">
                            Daily Stats
                        </h3>
                        <p className="text-sm text-cyan-400 font-medium">
                            {selectedDate.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </p>
                    </div>

                    <button
                        onClick={handleNextDay}
                        className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>

                {/* Total Staff Count */}
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-800/60 rounded-full border border-slate-700/50">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-300">Total Staff: {staffList.length}</span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3">
                {Object.entries(SHIFT_TYPES).map(([type, info]) => {
                    const count = stats.counts?.[type] || 0;
                    const Icon = info.icon;
                    const isSelected = selectedShiftType === type;

                    return (
                        <motion.button
                            key={type}
                            onClick={() => setSelectedShiftType(isSelected ? null : type)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`relative p-3 rounded-xl border transition-all duration-300 overflow-hidden text-left
                                ${isSelected
                                    ? `bg-slate-800 border-${info.color.split('-')[1]}-500/50 ring-1 ring-${info.color.split('-')[1]}-500/50`
                                    : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                                }
                            `}
                        >
                            {/* Background Glow for Active State */}
                            {isSelected && (
                                <div className={`absolute inset-0 bg-gradient-to-br ${info.color} opacity-10`} />
                            )}

                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <Icon className={`w-5 h-5 ${info.textColor}`} />
                                <span className="text-2xl font-bold text-white">{count}</span>
                            </div>
                            <div className="text-xs text-slate-400 font-medium relative z-10">
                                {info.label}
                            </div>
                        </motion.button>
                    );
                })}
            </div>

            {/* Staff List Details (Collapsible) */}
            <AnimatePresence>
                {selectedShiftType && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-4 pt-4 border-t border-slate-800">
                            <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${SHIFT_TYPES[selectedShiftType].textColor}`}>
                                {SHIFT_TYPES[selectedShiftType].icon && (() => {
                                    const Icon = SHIFT_TYPES[selectedShiftType].icon;
                                    return <Icon className="w-4 h-4" />;
                                })()}
                                Staff on {SHIFT_TYPES[selectedShiftType].label} ({stats.counts[selectedShiftType]})
                            </h4>

                            {stats.staffDetails[selectedShiftType].length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                    {stats.staffDetails[selectedShiftType].map(staff => (
                                        <div key={staff.id} className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-slate-700 text-slate-300 ring-2 ring-slate-800`}>
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-200 truncate">{staff.name}</p>
                                                <p className="text-[10px] text-slate-500 truncate">{staff.designation}</p>
                                            </div>
                                            {selectedShiftType === 'L' && (
                                                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                                                    {staff.actualCode}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-500 italic">No staff assigned to this shift type.</p>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DailyStatsSegment;
