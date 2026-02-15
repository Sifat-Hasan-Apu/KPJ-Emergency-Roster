"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

const EmployeeLogin = () => {
    // const [eid, setEid] = useState(''); // ID not needed
    const [passKey, setPassKey] = useState('');
    const [error, setError] = useState('');
    const { login, loading } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            // 1. Lookup user by PassKey
            const q = query(collection(db, "users"), where("passKey", "==", passKey));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Try Admin Fallback (admin/admin123)
                // If passKey is 'admin123', try to log in as admin
                if (passKey === 'admin123') {
                    await login('admin@roster.app', passKey);
                    return;
                }
                throw new Error("Invalid PassKey");
            }

            // 2. Get Email from found user
            const userDoc = querySnapshot.docs[0].data();
            const email = userDoc.email;

            // 3. Login
            await login(email, passKey);

        } catch (err) {
            console.error(err);
            if (err.message === "Invalid PassKey") {
                setError('Invalid PassKey. Please try again.');
            } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
                setError('Invalid PassKey');
            } else if (err.code === 'auth/too-many-requests') {
                setError('Too many failed attempts. Please try again later.');
            } else {
                setError('Login failed. Please check your connection.');
            }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-sm bg-slate-800 p-8 rounded-2xl shadow-xl border border-slate-700"
            >
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
                    <p className="text-slate-400 mt-2">Enter your credentials to access roster</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* User ID Input Removed */}

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Login PassKey</label>
                        <input
                            type="password"
                            value={passKey}
                            onChange={(e) => setPassKey(e.target.value)}
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all tracking-widest"
                            placeholder="••••"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold py-3 rounded-lg transition-colors shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Verifying...' : 'Unlock Access'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500">
                    Protected by Secure PassKey System v1.0
                </div>
            </motion.div>
        </div>
    );
};

export default EmployeeLogin;
