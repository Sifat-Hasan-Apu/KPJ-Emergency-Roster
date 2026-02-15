"use client";

import React from 'react';
import { SHIFTS } from '@/data/shiftDefinitions';

const RosterCell = ({ date, staffId, assignedShiftCode, onDrop, onContextMenu, isPending }) => {
    const assignedShift = SHIFTS[assignedShiftCode];

    const handleDragStart = (e) => {
        if (!assignedShiftCode) {
            e.preventDefault(); // Cannot drag empty cell
            return;
        }
        // Payload for Swap/Move
        const payload = JSON.stringify({ staffId, date, shiftCode: assignedShiftCode });
        e.dataTransfer.setData('sourceCell', payload);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.1)'; // Highlight
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = '';
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.currentTarget.style.backgroundColor = '';
        const shiftCode = e.dataTransfer.getData('shiftCode');
        // Pass 'e' so parent can access dataTransfer for Swaps
        onDrop(staffId, date, shiftCode, e);
    };

    return (
        <div
            draggable={!!assignedShiftCode}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onContextMenu={onContextMenu}
            className={`h-10 border-r border-b border-slate-700/50 flex-1 min-w-0 flex items-center justify-center cursor-pointer transition-colors relative group
        ${assignedShift ? assignedShift.bgClass : 'hover:bg-slate-700/50'}
        ${assignedShiftCode ? 'cursor-grab active:cursor-grabbing' : ''}
        ${isPending ? 'animate-pulse bg-yellow-500/20 border-yellow-500/50' : ''}`}
            title={assignedShift ? assignedShift.label : 'Empty Slot'}
        >
            {isPending && <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>}
            {assignedShift && (
                <span className={`font-bold text-sm ${assignedShift.colorClass}`}>
                    {assignedShift.code}
                </span>
            )}
        </div>
    );
};

export default RosterCell;
