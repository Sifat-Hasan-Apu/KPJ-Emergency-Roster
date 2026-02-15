"use client";

import React, { useState, useMemo } from 'react';

const SHIFT_INFO = {
    M: { label: 'Morning', color: 'from-amber-500 to-yellow-500', textColor: 'text-amber-400' },
    E: { label: 'Evening', color: 'from-orange-500 to-red-500', textColor: 'text-orange-400' },
    N: { label: 'Night', color: 'from-blue-500 to-indigo-500', textColor: 'text-blue-400' },
    G: { label: 'General', color: 'from-teal-500 to-cyan-500', textColor: 'text-teal-400' },
    O: { label: 'Off', color: 'from-emerald-500 to-green-500', textColor: 'text-emerald-400' },
    CL: { label: 'Casual Leave', color: 'from-pink-500 to-rose-500', textColor: 'text-pink-400' },
    AL: { label: 'Annual Leave', color: 'from-purple-500 to-violet-500', textColor: 'text-purple-400' },
    SL: { label: 'Sick Leave', color: 'from-rose-600 to-red-600', textColor: 'text-rose-400' },
};

const DutyStats = ({ isOpen, onClose, rosterData, currentYear, currentMonth, staffList }) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Calculate stats for all staff
    const allStats = useMemo(() => {
        if (!staffList || !rosterData) return [];

        return staffList.map(staff => {
            const stats = { M: 0, E: 0, N: 0, G: 0, O: 0, CL: 0, AL: 0, SL: 0, WorkingDays: 0 };
            const staffUid = staff.id; // This is the Firestore document ID (UID)

            // Key format: YYYY-M-D_uid (month is 0-indexed in key)
            const keyPrefix = `${currentYear}-${currentMonth}-`;

            Object.keys(rosterData).forEach(key => {
                if (key.startsWith(keyPrefix) && key.endsWith(`_${staffUid}`)) {
                    const shiftCode = rosterData[key];
                    if (stats[shiftCode] !== undefined) {
                        stats[shiftCode]++;
                    }
                    // Count working days (M, E, N, G)
                    if (['M', 'E', 'N', 'G'].includes(shiftCode)) {
                        stats.WorkingDays++;
                    }
                }
            });

            return { ...staff, stats };
        });
    }, [staffList, rosterData, currentYear, currentMonth]);

    // Filter by search
    const filteredStats = useMemo(() => {
        if (!searchQuery.trim()) return allStats;
        const q = searchQuery.toLowerCase();
        return allStats.filter(staff =>
            staff.name?.toLowerCase().includes(q) ||
            staff.designation?.toLowerCase().includes(q)
        );
    }, [allStats, searchQuery]);

    // Summary totals
    const summary = useMemo(() => {
        const totals = { M: 0, E: 0, N: 0, G: 0, O: 0, Leave: 0 };
        allStats.forEach(({ stats }) => {
            totals.M += stats.M;
            totals.E += stats.E;
            totals.N += stats.N;
            totals.G += stats.G;
            totals.O += stats.O;
            totals.Leave += stats.CL + stats.AL + stats.SL;
        });
        return totals;
    }, [allStats]);

    if (!isOpen) return null;

    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' });

    const content = (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {Object.entries(summary).map(([code, count]) => {
                    const info = SHIFT_INFO[code] || { label: code, color: 'from-slate-500 to-slate-600', textColor: 'text-slate-400' };
                    return (
                        <div key={code} className={`bg-gradient-to-br ${info.color} rounded-xl p-3 text-center shadow-lg`}>
                            <div className="text-2xl sm:text-3xl font-bold text-white">{count}</div>
                            <div className="text-[10px] sm:text-xs text-white/80 uppercase tracking-wider">
                                {code === 'Leave' ? 'Leave' : info.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="🔍 Search by name or designation..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="overflow-x-auto max-h-[55vh] rounded-xl border border-slate-700/50 shadow-inner bg-slate-900/50">
                <table className="w-full text-sm text-left min-w-[500px]">
                    <thead className="text-xs uppercase bg-slate-800/90 sticky top-0 shadow-sm backdrop-blur-sm">
                        <tr>
                            <th className="px-3 py-3 text-slate-300 sticky left-0 bg-slate-800 z-10">Staff</th>
                            <th className="px-2 py-3 text-center text-amber-400">M</th>
                            <th className="px-2 py-3 text-center text-orange-400">E</th>
                            <th className="px-2 py-3 text-center text-blue-400">N</th>
                            <th className="px-2 py-3 text-center text-teal-400">G</th>
                            <th className="px-2 py-3 text-center text-emerald-400">Off</th>
                            <th className="px-2 py-3 text-center text-pink-400">Leave</th>
                            <th className="px-2 py-3 text-center font-bold text-cyan-400">Work</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredStats.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                                    {searchQuery ? 'No results found' : 'No staff data available'}
                                </td>
                            </tr>
                        ) : (
                            filteredStats.map((staff, index) => {
                                const { stats } = staff;
                                const leaveTotal = stats.CL + stats.AL + stats.SL;
                                return (
                                    <tr
                                        key={staff.id}
                                        className={`border-b border-slate-800 hover:bg-slate-800/60 transition-colors ${index % 2 === 0 ? 'bg-slate-900/30' : 'bg-slate-900/60'}`}
                                    >
                                        <td className="px-3 py-2.5 sticky left-0 bg-inherit z-10">
                                            <div className="font-medium text-slate-200 truncate max-w-[120px] sm:max-w-[180px]">
                                                {staff.name}
                                            </div>
                                            <div className="text-[10px] text-slate-500 truncate">
                                                {staff.designation}
                                            </div>
                                        </td>
                                        <td className="px-2 py-2.5 text-center text-amber-300 font-medium">{stats.M || '-'}</td>
                                        <td className="px-2 py-2.5 text-center text-orange-300 font-medium">{stats.E || '-'}</td>
                                        <td className="px-2 py-2.5 text-center text-blue-300 font-medium">{stats.N || '-'}</td>
                                        <td className="px-2 py-2.5 text-center text-teal-300 font-medium">{stats.G || '-'}</td>
                                        <td className="px-2 py-2.5 text-center text-emerald-300 font-medium">{stats.O || '-'}</td>
                                        <td className="px-2 py-2.5 text-center text-pink-300 font-medium">{leaveTotal || '-'}</td>
                                        <td className="px-2 py-2.5 text-center font-bold text-cyan-300">{stats.WorkingDays || '-'}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer Info */}
            <div className="text-center text-xs text-slate-500">
                Showing {filteredStats.length} of {allStats.length} staff for {monthName} {currentYear}
            </div>
        </div>
    );

    // Inline mode (for dashboard tab)
    if (isOpen === 'inline') {
        return (
            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/80 rounded-2xl border border-slate-700/50 backdrop-blur-md p-4 sm:p-6 shadow-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-4">
                    📊 Duty Distribution Analytics
                </h2>
                {content}
            </div>
        );
    }

    // Modal mode (if used as popup)
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h2 className="text-xl font-bold text-white">📊 Duty Distribution Analytics</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[calc(90vh-60px)]">
                    {content}
                </div>
            </div>
        </div>
    );
};

export default DutyStats;
