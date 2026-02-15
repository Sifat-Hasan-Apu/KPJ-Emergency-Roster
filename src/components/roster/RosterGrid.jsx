"use client";

import React, { useState, useMemo } from 'react';
import Card from '@/components/ui/Card';
import RosterCell from './RosterCell';
import MobileRosterView from './MobileRosterView';
import { getMonthDays } from '@/utils/dateUtils';
import { validateShiftAssignment, getAutoAssignments } from '@/utils/rulesEngine';
import Toast from '@/components/ui/Toast';
import ContextMenu from '@/components/ui/ContextMenu';
import { useIsMobile } from '@/utils/useMediaQuery';

const RosterGrid = ({ rosterData, onShiftChange, currentYear, currentMonth, staffList, pendingRequests = [], selectedDay, onDaySelect }) => {
    // All hooks MUST be called unconditionally (React hooks rules)
    const isMobile = useIsMobile();
    const days = useMemo(() => getMonthDays(currentYear, currentMonth), [currentYear, currentMonth]);
    const displayStaff = staffList || [];
    const [toast, setToast] = useState(null);
    const [contextMenu, setContextMenu] = useState(null);

    // On mobile, render the mobile-optimized view
    if (isMobile) {
        return (
            <MobileRosterView
                rosterData={rosterData}
                onShiftChange={onShiftChange}
                currentYear={currentYear}
                currentMonth={currentMonth}
                staffList={staffList}
                pendingRequests={pendingRequests}
            />
        );
    }

    // Desktop View Below
    const handleContextMenu = (e, staffId, date) => {
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            staffId,
            date
        });
    };

    const handleMenuSelect = (shiftCode) => {
        if (!contextMenu) return;
        const { staffId, date } = contextMenu;
        handleShiftUpdate(staffId, date, shiftCode);
        setContextMenu(null);
    };

    const handleShiftUpdate = (staffId, day, shiftCode) => {
        const key = `${currentYear}-${currentMonth}-${day}_${staffId}`;

        if (!shiftCode) {
            onShiftChange({ [key]: null });
            setToast({ message: 'Slot Cleared', type: 'info' });
            return;
        }

        const validation = validateShiftAssignment(rosterData, staffId, day, shiftCode, currentYear, currentMonth);

        if (!validation.valid) {
            setToast({ message: validation.message, type: 'error' });
            return;
        }

        const updates = { [key]: shiftCode };
        const autoUpdates = getAutoAssignments(rosterData, staffId, day, shiftCode, currentYear, currentMonth, days.length);

        if (Object.keys(autoUpdates).length > 0) {
            Object.assign(updates, autoUpdates);
            setToast({ message: 'Next day automatically set to Off (Night Shift Rule)', type: 'info' });
        }

        onShiftChange(updates);
    };

    const handleShiftDrop = (staffId, day, shiftCode, e) => {
        const sourceDataStr = e?.dataTransfer?.getData('sourceCell');

        if (sourceDataStr) {
            const source = JSON.parse(sourceDataStr);
            const sourceKey = `${currentYear}-${currentMonth}-${source.date}_${source.staffId}`;
            const targetKey = `${currentYear}-${currentMonth}-${day}_${staffId}`;

            if (sourceKey === targetKey) return;

            const targetShift = rosterData[targetKey];
            const updates = {};
            updates[targetKey] = source.shiftCode;
            updates[sourceKey] = targetShift || null;

            onShiftChange(updates);
            setToast({ message: 'Shift Moved/Swapped', type: 'success' });
            return;
        }

        handleShiftUpdate(staffId, day, shiftCode);
    };

    const getShift = (staffId, day) => {
        const key = `${currentYear}-${currentMonth}-${day}_${staffId}`;
        return rosterData[key];
    };

    const isPending = (staffEid, gridDay) => {
        return pendingRequests.some(req =>
            req.eid === staffEid &&
            parseInt(req.date.split('-')[2], 10) === gridDay
        );
    };

    return (
        <Card className="p-0 border border-slate-700/50 shadow-xl bg-slate-900/60 backdrop-blur-md">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="overflow-x-auto">
                <div className="min-w-[900px]">
                    {/* Header Row - dates */}
                    <div className="border-b border-slate-700 bg-slate-900 flex">
                        <div className="sticky left-0 z-20 w-64 min-w-[256px] bg-slate-900 border-r border-slate-700 p-3 font-semibold text-slate-300 shadow-xl">
                            Staff Member
                        </div>
                        <div className="flex flex-1 w-full bg-slate-900">
                            {days.map(day => {
                                const isSelected = selectedDay && selectedDay.getDate() === day.date && selectedDay.getMonth() === currentMonth && selectedDay.getFullYear() === currentYear;
                                return (
                                    <button
                                        key={day.date}
                                        onClick={() => onDaySelect && onDaySelect(new Date(currentYear, currentMonth, day.date))}
                                        className={`h-14 flex-1 min-w-0 flex flex-col items-center justify-center border-r border-slate-700/50 transition-colors
                                            ${isSelected ? 'bg-cyan-500/20 shadow-inner' : ''}
                                            ${day.dayName === 'Fri' ? 'bg-red-900/20 text-red-400' : 'text-slate-400'}
                                            hover:bg-slate-700/50 cursor-pointer
                                        `}
                                    >
                                        <span className={`text-xs font-medium uppercase ${isSelected ? 'text-cyan-300' : ''}`}>{day.dayName}</span>
                                        <span className={`text-sm font-bold ${isSelected ? 'text-cyan-200' : ''}`}>{day.date}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Staff Rows */}
                    <div>
                        {displayStaff.map((staff, index) => (
                            <div key={staff.id} className={`flex group ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/30'}`}>
                                <div className="sticky left-0 z-20 w-64 min-w-[256px] bg-slate-900 border-r border-slate-700 p-2 flex items-center justify-between shadow-lg ring-1 ring-slate-700/50">
                                    <div>
                                        <div className="font-medium text-sm text-slate-200 group-hover:text-cyan-400 transition-colors">{staff.name}</div>
                                        <div className="text-xs text-slate-500">{staff.designation}</div>
                                    </div>
                                    <div className={`text-[10px] px-1.5 py-0.5 rounded border 
                                        ${staff.designation === 'Doctor' ? 'bg-blue-900/30 border-blue-800 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}>
                                        {staff.eid}
                                    </div>
                                </div>

                                <div className="flex flex-1 w-full">
                                    {days.map(day => {
                                        const isSelected = selectedDay && selectedDay.getDate() === day.date && selectedDay.getMonth() === currentMonth && selectedDay.getFullYear() === currentYear;
                                        return (
                                            <div key={day.date} className={`flex-1 relative ${isSelected ? 'bg-cyan-500/5' : ''}`}>
                                                {isSelected && <div className="absolute inset-0 border-x-2 border-cyan-500/20 pointer-events-none z-10" />}
                                                <RosterCell
                                                    date={day.date}
                                                    staffId={staff.id}
                                                    assignedShiftCode={getShift(staff.id, day.date)}
                                                    onDrop={handleShiftDrop}
                                                    onContextMenu={(e) => handleContextMenu(e, staff.id, day.date)}
                                                    isPending={isPending(staff.eid, day.date)}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    onClose={() => setContextMenu(null)}
                    onSelect={handleMenuSelect}
                />
            )}
        </Card>
    );
};

export default RosterGrid;
