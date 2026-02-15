"use client";

import React, { useState } from 'react';
import Card from '@/components/ui/Card';
import { motion, AnimatePresence } from 'framer-motion';

const SHIFT_STYLES = {
    'M': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
    'E': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    'N': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
    'G': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'O': 'bg-slate-700/50 text-slate-400 border-slate-600/50',
    '?': 'bg-slate-800 text-slate-500 border-slate-700 border-dashed'
};

const RequestCard = ({ req, isSelected, onClick, onApprove, onReject, rosterData }) => {
    // Determine badge color
    const getBadgeStyle = (type) => {
        switch (type) {
            case 'LEAVE': return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
            case 'SWAP': return 'bg-violet-500/10 text-violet-400 border-violet-500/20';
            case 'SHIFT_CHANGE': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    // Format Date Range
    const getDateDisplay = () => {
        if (req.dates && req.dates.length > 1) {
            return (
                <div className="flex flex-col">
                    <span className="font-bold text-white">{req.dates.length} Days</span>
                    <span className="text-[10px] text-slate-500">
                        {req.dates[0]} - {req.dates[req.dates.length - 1]}
                    </span>
                </div>
            );
        }
        return <span className="font-bold text-white">{req.dates?.[0] || req.date}</span>;
    };

    // Helper to get shift badge
    const ShiftBadge = ({ code }) => (
        <span className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold border ${SHIFT_STYLES[code] || SHIFT_STYLES['?']}`}>
            {code}
        </span>
    );

    // Swap Visual Logic
    const renderSwapDetails = () => {
        // Requester Shift (stored in req)
        const requesterShift = req.currentShift?.code || req.currentShift || 'O';

        // Target Shift (lookup in rosterData)
        let targetShift = '?';
        if (rosterData && req.swapWithUserId) {
            const dateStr = req.dates?.[0] || req.date;
            if (dateStr) {
                const [y, m, d] = dateStr.split('-').map(Number);
                // Roster keys use 0-indexed month: YYYY-M-D_uid
                const key = `${y}-${m - 1}-${d}_${req.swapWithUserId}`;
                targetShift = rosterData[key] || 'O';
            }
        }

        return (
            <div className="flex items-center justify-between bg-slate-950/30 p-2 rounded-lg border border-slate-800/50 w-full">
                {/* Requester Side */}
                <div className="flex flex-col items-center gap-1 min-w-[60px]">
                    <span className="text-[10px] text-slate-500 font-medium uppercase">My Slot</span>
                    <ShiftBadge code={requesterShift} />
                </div>

                {/* Swap Icon */}
                <div className="flex flex-col items-center px-2">
                    <span className="text-[10px] text-violet-400 font-bold mb-1">SWAP</span>
                    <svg className="w-5 h-5 text-violet-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </div>

                {/* Target Side */}
                <div className="flex flex-col items-center gap-1 min-w-[60px] text-right">
                    <span className="text-[10px] text-slate-500 font-medium uppercase truncate max-w-[80px]">
                        {req.swapWithUserName?.split(' ')[0]}
                    </span>
                    <ShiftBadge code={targetShift} />
                </div>
            </div>
        );
    };

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${isSelected
                ? 'bg-slate-800 border-cyan-500/50 ring-1 ring-cyan-500/20 shadow-lg shadow-cyan-900/20'
                : 'bg-slate-800/40 border-slate-700/50 hover:bg-slate-800/80 hover:border-slate-600'
                }`}
        >
            {/* Header: Type & Name */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${getBadgeStyle(req.requestType)}`}>
                        {req.userName?.charAt(0)}
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-200 text-sm leading-tight">{req.userName}</h4>
                        <span className="text-[10px] text-slate-500">{req.userEid}</span>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold border ${getBadgeStyle(req.requestType)}`}>
                    {req.requestType === 'SHIFT_CHANGE' ? 'SHIFT' : req.requestType}
                </span>
            </div>

            {/* Request Details Grid */}
            <div className={`mb-3 flex flex-col gap-2 ${req.requestType === 'SWAP' ? '' : 'grid grid-cols-2 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/50'}`}>

                {req.requestType === 'SWAP' ? (
                    <div className="flex flex-col gap-2">
                        {/* Date for Swap */}
                        <div className="flex items-center gap-2 px-1">
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="text-xs font-bold text-slate-300">{getDateDisplay()}</span>
                        </div>
                        {renderSwapDetails()}
                    </div>
                ) : (
                    <>
                        {/* Date */}
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="text-xs">{getDateDisplay()}</div>
                        </div>

                        {/* Info (Shift/Leave) */}
                        <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500">Requested</span>
                                <span className="text-xs font-bold text-cyan-300">{req.requestedShift}</span>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Reason */}
            {req.reason && (
                <p className="text-xs text-slate-400 italic mb-3 pl-2 border-l-2 border-slate-700 line-clamp-2">
                    &quot;{req.reason}&quot;
                </p>
            )}

            {/* Actions */}
            <div className="flex gap-2 mt-2">
                <button
                    onClick={(e) => { e.stopPropagation(); onReject(req.id); }}
                    className="flex-1 py-1.5 rounded-lg bg-slate-700/50 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-transparent text-slate-400 text-xs font-semibold transition-all"
                >
                    Reject
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onApprove(req.id); }}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-900/20 transition-all border border-cyan-500/50"
                >
                    Approve
                </button>
            </div>
        </motion.div>
    );
};

const PendingRequestsPanel = ({ requests, onApprove, onReject, rosterData }) => {
    const [selectedId, setSelectedId] = useState(null);

    // Sort requests: Pending first, then newest
    const sortedRequests = [...(requests || [])].sort((a, b) => {
        // Here we assume all requests passed are pending, otherwise sort by status too
        return b.createdAt?.seconds - a.createdAt?.seconds;
    });

    if (!sortedRequests || sortedRequests.length === 0) {
        return (
            <Card className="p-8 bg-slate-900/50 border border-slate-800 text-center flex flex-col items-center justify-center min-h-[200px]">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <h3 className="text-slate-400 font-medium">No Pending Requests</h3>
                <p className="text-slate-600 text-xs mt-1">Great job! All caught up.</p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col bg-slate-900 border border-slate-800 shadow-xl overflow-hidden h-full max-h-[600px]">
            <div className="p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur z-10 sticky top-0">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                    Pending Requests
                    <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full border border-slate-700">
                        {sortedRequests.length}
                    </span>
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                <AnimatePresence mode='popLayout'>
                    {sortedRequests.map((req) => (
                        <RequestCard
                            key={req.id}
                            req={req}
                            isSelected={selectedId === req.id}
                            onClick={() => setSelectedId(req.id)}
                            onApprove={onApprove}
                            onReject={onReject}
                            rosterData={rosterData}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </Card>
    );
};

export default PendingRequestsPanel;
