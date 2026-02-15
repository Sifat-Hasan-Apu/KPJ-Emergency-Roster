"use client";

import React from 'react';
import { getMonthDays } from '@/utils/dateUtils';

const PrintableView = ({ rosterData, currentYear, currentMonth, staffList }) => {
    const days = getMonthDays(currentYear, currentMonth);

    // Helper to get shift code
    const getShift = (staffId, date) => {
        const key = `${currentYear}-${currentMonth}-${date}_${staffId}`;
        return rosterData[key] || '';
    };

    const displayStaff = staffList || [];

    return (
        <div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white z-[9999] p-4 text-black">
            {/* Header */}
            <div className="text-center mb-6 border-b-2 border-black pb-4">
                <h1 className="text-3xl font-bold uppercase tracking-widest">KPJ Hospital (Emergency Section)</h1>
                <h2 className="text-xl font-semibold mt-2">
                    Duty Roster - {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
            </div>

            {/* Roster Table */}
            <table className="w-full border-collapse border border-black text-[10px]">
                <thead>
                    <tr>
                        <th className="border border-black p-1 w-32 bg-gray-200">Staff Name</th>
                        {days.map(d => (
                            <th key={d.date} className="border border-black p-0.5 w-6 text-center">
                                <div className="font-bold">{d.date}</div>
                                <div className="font-normal text-[8px]">{d.dayName}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {displayStaff.map(staff => (
                        <tr key={staff.id}>
                            <td className="border border-slate-400 p-1 font-semibold whitespace-nowrap">
                                {staff.name} <span className="text-[10px]">({staff.designation})</span>
                            </td>
                            {days.map(d => {
                                const key = `${currentYear}-${currentMonth}-${d.date}_${staff.id}`;
                                const shift = rosterData[key] || '';
                                return (
                                    <td key={d.date} className="border border-black p-0.5 text-center font-bold">
                                        {shift}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Footer Signatures */}
            <div className="flex justify-between mt-16 pt-8 px-10">
                <div className="text-center">
                    <div className="border-t border-black w-48 mb-2"></div>
                    <p className="font-bold">Roster Maker</p>
                </div>
                <div className="text-center">
                    <div className="border-t border-black w-48 mb-2"></div>
                    <p className="font-bold">Head of Dept</p>
                </div>
                <div className="text-center">
                    <div className="border-t border-black w-48 mb-2"></div>
                    <p className="font-bold">Hospital Director</p>
                </div>
            </div>
        </div>
    );
};

export default PrintableView;
