"use client";

import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import Button from '@/components/ui/Button';

const SetupPage = () => {
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);

    const createAdmin = async () => {
        setLoading(true);
        setStatus('Creating Admin Account...');

        try {
            const email = "admin@roster.app";
            const password = "admin123";

            // 1. Create Auth User
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create User Profile
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                eid: 'admin',
                name: 'System Admin',
                role: 'admin',
                email: email,
                createdAt: new Date().toISOString()
            });

            setStatus('✅ Admin Created Successfully! (admin@roster.app / admin123)');
        } catch (error) {
            console.error(error);
            if (error.code === 'auth/email-already-in-use') {
                setStatus('⚠️ Admin account already exists. Try logging in.');
            } else {
                setStatus(`❌ Error: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Initial Setup</h1>
                <p className="text-slate-400 mb-8">
                    Create the first Administrator account to access the dashboard.
                </p>

                <div className="bg-slate-800/50 p-4 rounded-lg mb-6 text-left">
                    <p className="text-sm text-slate-500 mb-1">Default Credentials</p>
                    <div className="flex justify-between items-center text-slate-200 font-mono text-sm">
                        <span>Email:</span>
                        <span>admin@roster.app</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-200 font-mono text-sm">
                        <span>Password:</span>
                        <span>admin123</span>
                    </div>
                </div>

                <Button
                    onClick={createAdmin}
                    disabled={loading}
                    className="w-full justify-center"
                >
                    {loading ? 'Creating...' : 'Create Admin Account'}
                </Button>

                {status && (
                    <div className={`mt-6 p-3 rounded-lg text-sm font-medium ${status.includes('Error') ? 'bg-red-900/20 text-red-500' :
                            status.includes('Exists') ? 'bg-yellow-900/20 text-yellow-500' :
                                'bg-green-900/20 text-green-500'
                        }`}>
                        {status}
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-slate-800">
                    <a href="/admin" className="text-cyan-500 hover:text-cyan-400 text-sm font-medium hover:underline">
                        Go to Login Page →
                    </a>
                </div>
            </div>
        </div>
    );
};

export default SetupPage;
