"use client";

import React, { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import { SHIFTS } from '@/data/shiftDefinitions';
import { getMonthDays } from '@/utils/dateUtils';
import { validateShiftAssignment, getAutoAssignments } from '@/utils/rulesEngine';
import ShiftPickerModal from './ShiftPickerModal';
import Toast from '@/components/ui/Toast';

/**
 * Mobile-optimized roster view
 * Shows staff cards with week-based day navigation
 * Uses tap-to-select instead of drag-drop
 */
const MobileRosterView = ({
    rosterData,
    onShiftChange,
    currentYear,
    currentMonth,
    staffList,
    pendingRequests = []
}) => {
    const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);
    const displayStaff = staffList || [];

    // Week navigation state
    const [weekOffset, setWeekOffset] = useState(0);
    const daysPerView = 7;

    // Calculate visible days
    const startIdx = weekOffset * daysPerView;
    const visibleDays = days.slice(startIdx, startIdx + daysPerView);
    const totalWeeks = Math.ceil(days.length / daysPerView);

    // Shift picker state
    const [pickerOpen, setPickerOpen] = useState(false);
    const [selectedCell, setSelectedCell] = useState(null);

    // Toast state
    const [toast, setToast] = useState(null);

    // Get shift code for a specific cell
    const getShift = (staffId, day) => {
        const key = `${currentYear}-${currentMonth}-${day}_${staffId}`;
        return rosterData[key];
    };

    // Check if cell has pending request
    const isPending = (staffEid, gridDay) => {
        return pendingRequests.some(req =>
            req.eid === staffEid &&
            parseInt(req.date.split('-')[2], 10) === gridDay
        );
    };

    // Handle cell tap
    const handleCellTap = (staff, day) => {
        setSelectedCell({
            staffId: staff.id,
            staffName: staff.name,
            day: day.date,
            dayName: day.dayName
        });
        setPickerOpen(true);
    };

    // Handle shift selection from picker
    const handleShiftSelect = (shiftCode) => {
        if (!selectedCell) return;

        const { staffId, day } = selectedCell;
        const key = `${currentYear}-${currentMonth}-${day}_${staffId}`;

        // Clear shift
        if (!shiftCode) {
            onShiftChange({ [key]: null });
            setToast({ message: 'Slot Cleared', type: 'info' });
            return;
        }

        // Validate
        const validation = validateShiftAssignment(rosterData, staffId, day, shiftCode, currentYear, currentMonth);
        if (!validation.valid) {
            setToast({ message: validation.message, type: 'error' });
            return;
        }

        // Prepare updates
        const updates = { [key]: shiftCode };

        // Auto-assignments (Night -> Off rule)
        const autoUpdates = getAutoAssignments(rosterData, staffId, day, shiftCode, currentYear, currentMonth, days.length);
        if (Object.keys(autoUpdates).length > 0) {
            Object.assign(updates, autoUpdates);
            setToast({ message: 'Next day set to Off (Night Rule)', type: 'info' });
        }

        onShiftChange(updates);
    };

    const getWeekLabel = () => {
        if (visibleDays.length === 0) return '';
        const start = visibleDays[0]?.date || 1;
        const end = visibleDays[visibleDays.length - 1]?.date || start;
        return `${start} - ${end}`;
    };

    return (
        <div className="space-y-3 pb-6">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Week Navigation - Sleek Glass Bar */}
            <div className="sticky top-0 z-30 bg-gradient-to-b from-slate-900 via-slate-900/98 to-slate-900/90 backdrop-blur-xl py-3 px-3 -mx-2 rounded-b-2xl border-b border-slate-700/30 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                    <button
                        onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
                        disabled={weekOffset === 0}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-600/20 hover:text-cyan-400 transition-all active:scale-95 border border-slate-700/50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>

                    <div className="text-center flex items-center gap-2">
                        <span className="text-cyan-400 font-bold text-base">{getWeekLabel()}</span>
                        <span className="text-slate-500 text-xs px-2 py-0.5 bg-slate-800/60 rounded-full">
                            {weekOffset + 1}/{totalWeeks}
                        </span>
                    </div>

                    <button
                        onClick={() => setWeekOffset(Math.min(totalWeeks - 1, weekOffset + 1))}
                        disabled={weekOffset >= totalWeeks - 1}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-800/80 text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-cyan-600/20 hover:text-cyan-400 transition-all active:scale-95 border border-slate-700/50"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                {/* Day Headers - Premium Glass Cards */}
                <div className="grid grid-cols-7 gap-1">
                    {visibleDays.map(day => (
                        <div
                            key={day.date}
                            className={`text-center py-1.5 rounded-lg transition-colors
                                ${day.dayName === 'Fri'
                                    ? 'bg-gradient-to-b from-red-900/40 to-red-900/20 text-red-400 border border-red-800/30'
                                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/30'}`}
                        >
                            <div className="text-[9px] uppercase font-semibold tracking-wider opacity-80">{day.dayName}</div>
                            <div className="text-sm font-bold">{day.date}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Staff Cards - Premium Design */}
            <div className="space-y-2">
                {displayStaff.map((staff, index) => (
                    <div
                        key={staff.id}
                        className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-md rounded-xl border border-slate-700/40 p-3 shadow-lg hover:border-slate-600/60 transition-all"
                    >
                        {/* Staff Info - Compact */}
                        <div className="flex items-center justify-between mb-2.5">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600/30 to-blue-600/30 flex items-center justify-center border border-cyan-500/20">
                                    <span className="text-cyan-400 font-bold text-xs">
                                        {staff.name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-white text-sm leading-tight">{staff.name}</h4>
                                    <span className="text-[10px] text-slate-500">{staff.designation}</span>
                                </div>
                            </div>
                            <span className="text-[10px] px-1.5 py-0.5 bg-slate-800/80 border border-slate-700/50 rounded text-slate-500 font-mono">
                                {staff.eid}
                            </span>
                        </div>

                        {/* Shift Cells Grid - With Inline Dates */}
                        <div className="grid grid-cols-7 gap-1">
                            {visibleDays.map(day => {
                                const shiftCode = getShift(staff.id, day.date);
                                const shift = SHIFTS[shiftCode];
                                const hasPending = isPending(staff.eid, day.date);
                                const isFriday = day.dayName === 'Fri';

                                return (
                                    <button
                                        key={day.date}
                                        onClick={() => handleCellTap(staff, day)}
                                        className={`h-14 rounded-lg flex flex-col items-center justify-center border transition-all active:scale-95 relative shadow-sm
                                            ${shift
                                                ? `${shift.bgClass} ${shift.borderClass} shadow-md`
                                                : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-700/50 hover:border-slate-600/50'}
                                            ${hasPending ? 'ring-2 ring-yellow-500/60 ring-offset-1 ring-offset-slate-900' : ''}
                                            ${isFriday && !shift ? 'border-red-800/40 bg-red-900/10' : ''}`}
                                    >
                                        {/* Inline Date Label */}
                                        <span className={`text-[8px] font-semibold leading-none mb-0.5
                                            ${isFriday ? 'text-red-400' : 'text-slate-500'}
                                            ${shift ? 'opacity-70' : ''}`}>
                                            {day.dayName.charAt(0)}{day.date}
                                        </span>

                                        {hasPending && (
                                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                                        )}
                                        {shift ? (
                                            <span className={`font-bold text-base ${shift.colorClass}`}>
                                                {shift.code}
                                            </span>
                                        ) : (
                                            <span className="text-slate-600 text-lg font-light">+</span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {displayStaff.length === 0 && (
                <div className="bg-slate-800/40 rounded-2xl border border-slate-700/30 p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/30 flex items-center justify-center">
                        <span className="text-3xl opacity-50">👥</span>
                    </div>
                    <p className="text-slate-500 text-sm">No staff members found</p>
                    <p className="text-slate-600 text-xs mt-1">Try adjusting your search</p>
                </div>
            )}

            {/* Shift Picker Modal */}
            <ShiftPickerModal
                isOpen={pickerOpen}
                onClose={() => setPickerOpen(false)}
                onSelect={handleShiftSelect}
                staffName={selectedCell?.staffName || ''}
                date={selectedCell ? `${selectedCell.dayName}, ${selectedCell.day}` : ''}
            />
        </div>
    );
};

export default MobileRosterView;
