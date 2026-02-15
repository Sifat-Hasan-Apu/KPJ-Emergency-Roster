"use client";

import React from 'react';
import Card from '@/components/ui/Card';
import { SHIFTS, SHIFT_KEYS } from '@/data/shiftDefinitions';

const ShiftToolbar = () => {
    const handleDragStart = (e, code) => {
        e.dataTransfer.setData('shiftCode', code);
        e.dataTransfer.effectAllowed = 'copy';
    };

    return (
        <Card className="mb-6 p-4 sticky top-20 z-40 shadow-xl border-t-4 border-t-cyan-500 bg-slate-800 border-slate-700">
            <div className="flex flex-wrap items-center gap-4">
                <span className="text-sm font-bold text-slate-400 uppercase whitespace-nowrap">Draggable Shifts:</span>
                {SHIFT_KEYS.map((key) => {
                    const shift = SHIFTS[key];
                    return (
                        <div
                            key={key}
                            draggable
                            onDragStart={(e) => handleDragStart(e, shift.code)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-grab active:cursor-grabbing hover:scale-105 transition-transform
                  ${shift.bgClass} ${shift.borderClass} bg-opacity-20`}
                        >
                            <span className={`font-bold ${shift.colorClass}`}>{shift.code}</span>
                            <span className="text-sm font-medium text-slate-300 hidden sm:inline">{shift.label}</span>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default ShiftToolbar;
