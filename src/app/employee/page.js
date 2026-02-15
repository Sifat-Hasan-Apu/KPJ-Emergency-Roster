"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import EmployeeDashboard from '@/components/employee/EmployeeDashboard';

const EmployeePage = () => {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !currentUser) {
            router.replace('/');
        }
    }, [currentUser, loading, router]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent"></div>
                    <p className="animate-pulse text-sm text-slate-400">Loading...</p>
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return null; // Will redirect via useEffect
    }

    return <EmployeeDashboard />;
};

export default EmployeePage;
