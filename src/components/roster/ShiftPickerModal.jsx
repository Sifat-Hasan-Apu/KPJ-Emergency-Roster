"use client";

import React from 'react';
import { SHIFTS, SHIFT_KEYS } from '@/data/shiftDefinitions';

/**
 * Touch-friendly shift picker modal for mobile
 * Appears as a bottom sheet with large, tappable shift buttons
 */
const ShiftPickerModal = ({ isOpen, onClose, onSelect, staffName, date }) => {
    if (!isOpen) return null;

    const handleSelect = (shiftCode) => {
        onSelect(shiftCode);
        onClose();
    };

    const handleClear = () => {
        onSelect(null);
        onClose();
    };

    // Group shifts by category for better organization
    const workShifts = ['M', 'E', 'N', 'G'];
    const leaveShifts = ['SL', 'CL', 'AL', 'UD'];
    const offShift = ['O'];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200" />

            {/* Modal Content */}
            <div
                className="relative w-full max-w-lg bg-gradient-to-b from-slate-800 to-slate-900 rounded-t-3xl border-t border-slate-600/50 p-5 pb-8 animate-in slide-in-from-bottom duration-300 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Handle Bar */}
                <div className="w-10 h-1 bg-slate-600 rounded-full mx-auto mb-4" />

                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-base font-bold text-white">{staffName}</h3>
                        <p className="text-xs text-cyan-400 font-medium">{date}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-white transition-all active:scale-95 border border-slate-600/50"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Work Shifts */}
                <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">Duty Shifts</p>
                    <div className="grid grid-cols-4 gap-2">
                        {workShifts.map((key) => {
                            const shift = SHIFTS[key];
                            if (!shift) return null;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleSelect(shift.code)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95
                                        ${shift.bgClass} ${shift.borderClass} hover:scale-[1.02] shadow-lg`}
                                >
                                    <span className={`text-xl font-bold ${shift.colorClass}`}>
                                        {shift.code}
                                    </span>
                                    <span className="text-[10px] text-slate-300 mt-0.5 opacity-80">
                                        {shift.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Leave Shifts */}
                <div className="mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-2 px-1">Leave Types</p>
                    <div className="grid grid-cols-4 gap-2">
                        {leaveShifts.map((key) => {
                            const shift = SHIFTS[key];
                            if (!shift) return null;
                            return (
                                <button
                                    key={key}
                                    onClick={() => handleSelect(shift.code)}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all active:scale-95
                                        ${shift.bgClass} ${shift.borderClass} hover:scale-[1.02] shadow-lg`}
                                >
                                    <span className={`text-xl font-bold ${shift.colorClass}`}>
                                        {shift.code}
                                    </span>
                                    <span className="text-[10px] text-slate-300 mt-0.5 opacity-80 truncate max-w-full">
                                        {shift.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Off + Clear Row */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Off Day Button */}
                    <button
                        onClick={() => handleSelect('O')}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 bg-slate-800/60 border-slate-600/50 transition-all active:scale-95 hover:bg-slate-700/60"
                    >
                        <span className="text-xl font-bold text-slate-400">O</span>
                        <span className="text-sm text-slate-400">Off Day</span>
                    </button>

                    {/* Clear Button */}
                    <button
                        onClick={handleClear}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-500/10 border-2 border-red-500/30 text-red-400 font-medium hover:bg-red-500/20 hover:border-red-500/50 transition-all active:scale-95"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span className="text-sm">Clear</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ShiftPickerModal;
