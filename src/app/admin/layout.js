"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const AdminLayout = ({ children }) => {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const isAdmin = sessionStorage.getItem('adminAuth');
        if (isAdmin === 'true') {
            setAuthorized(true);
        } else {
            router.replace('/');
        }
    }, [router]);

    if (!authorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-rose-500 border-t-transparent"></div>
                    <p className="animate-pulse text-sm text-slate-400">Verifying access...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[url('/bg-grid.svg')] bg-fixed">
            {/* Top Navigation - Ultra Modern Glass Style */}
            <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl border border-rose-500/20 bg-gradient-to-r from-rose-900/90 to-pink-900/90 backdrop-blur-xl shadow-[0_8px_30px_rgb(225,29,72,0.15)] transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    {/* Logo Section */}
                    <div className="flex items-center gap-4 group">
                        <div className="relative h-11 w-11 rounded-xl overflow-hidden shadow-sm transition-transform duration-300 group-hover:scale-105 bg-white/10 group-hover:bg-white/20">
                            <Image src="/header_logo.png" alt="KPJ Logo" fill className="object-cover" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-extrabold tracking-tight text-white leading-none group-hover:text-rose-100 transition-colors">
                                KPJ <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-rose-200">Emergency</span>
                            </span>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-rose-200/80 font-semibold group-hover:text-rose-100/90 transition-colors">Department</span>
                        </div>
                    </div>

                    {/* Profile + Logout */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                sessionStorage.removeItem('adminAuth');
                                router.replace('/');
                            }}
                            className="text-xs text-rose-200/60 hover:text-white border border-rose-500/20 hover:border-rose-400/50 px-3 py-1.5 rounded-lg transition-all hover:bg-rose-500/10"
                        >
                            Logout
                        </button>
                        <div className="h-11 w-11 rounded-full p-0.5 bg-gradient-to-br from-slate-100 to-slate-200 border border-white shadow-lg cursor-pointer hover:scale-105 transition-transform duration-300">
                            <div className="h-full w-full rounded-full overflow-hidden relative">
                                <Image
                                    src="/admin_avatar.png"
                                    alt="Admin Profile"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-[95%] mx-auto px-4 py-8 pt-28">
                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
