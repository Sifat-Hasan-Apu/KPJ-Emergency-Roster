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

const RosterGrid = ({ rosterData, onShiftChange, currentYear, currentMonth, staffList, pendingRequests = [] }) => {
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
        <Card className="overflow-hidden p-0 border border-slate-700/50 shadow-xl bg-slate-900/60 backdrop-blur-md">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <div className="w-full">
                <div className="inline-block min-w-full align-middle">
                    <div className="border-b border-slate-700 bg-slate-800/80 sticky top-0 z-30 flex">
                        <div className="sticky left-0 z-40 w-64 bg-slate-800 border-r border-slate-700 p-3 font-semibold text-slate-300 shadow-lg">
                            Staff Member
                        </div>
                        <div className="flex flex-1 w-full">
                            {days.map(day => (
                                <div key={day.date} className={`h-14 flex-1 min-w-0 flex flex-col items-center justify-center border-r border-slate-700/50 
                                    ${day.dayName === 'Fri' ? 'bg-red-900/20 text-red-400' : 'text-slate-400'}`}>
                                    <span className="text-xs font-medium uppercase">{day.dayName}</span>
                                    <span className="text-sm font-bold">{day.date}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div>
                        {displayStaff.map((staff, index) => (
                            <div key={staff.id} className={`flex group ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-800/30'}`}>
                                <div className="sticky left-0 z-20 w-64 bg-slate-900 border-r border-slate-700 p-2 flex items-center justify-between shadow-lg ring-1 ring-slate-700/50">
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
                                    {days.map(day => (
                                        <RosterCell
                                            key={day.date}
                                            date={day.date}
                                            staffId={staff.id}
                                            assignedShiftCode={getShift(staff.id, day.date)}
                                            onDrop={handleShiftDrop}
                                            onContextMenu={(e) => handleContextMenu(e, staff.id, day.date)}
                                            isPending={isPending(staff.eid, day.date)}
                                        />
                                    ))}
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
