"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/context/AuthContext';

const ADMIN_PASSWORD = '04032023';

export default function LandingPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null); // 'admin' | 'staff'
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
    setPassword('');
    setError('');
  };

  const handleBack = () => {
    setSelectedRole(null);
    setPassword('');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (selectedRole === 'admin') {
        if (password === ADMIN_PASSWORD) {
          sessionStorage.setItem('adminAuth', 'true');
          router.push('/admin');
        } else {
          setError('Wrong password. Please try again.');
        }
      } else {
        // Staff login — lookup passKey in Firestore users collection
        const q = query(collection(db, "users"), where("passKey", "==", password));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          throw new Error("Invalid PassKey");
        }

        const userDoc = querySnapshot.docs[0].data();
        const email = userDoc.email;
        await login(email, password);
        router.push('/employee');
      }
    } catch (err) {
      console.error(err);
      if (err.message === "Invalid PassKey") {
        setError('Invalid password. Please contact admin.');
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid password.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Try again later.');
      } else {
        setError('Login failed. Check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_rgba(225,29,72,0.08)_0%,_transparent_60%)]" />
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-rose-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-[url('/bg-grid.svg')] opacity-[0.03]" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-md">
        {/* Logo & Branding */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center mb-10"
        >
          <div className="w-24 h-24 bg-white/90 rounded-2xl p-3 shadow-2xl shadow-rose-500/10 flex items-center justify-center mb-5">
            <div className="relative w-full h-full">
              <Image
                src="/kpj_logo.png"
                alt="KPJ Logo"
                fill
                className="object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            KPJ <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-amber-400">Emergency</span>
          </h1>
          <p className="text-slate-500 text-xs uppercase tracking-[0.25em] mt-1.5 font-medium">Duty Roster System</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {!selectedRole ? (
            /* ─── Role Selection Cards ─── */
            <motion.div
              key="cards"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full space-y-4"
            >
              <p className="text-center text-slate-400 text-sm mb-6">Select your role to continue</p>

              {/* Admin Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('admin')}
                className="w-full group relative overflow-hidden rounded-2xl border border-rose-500/20 bg-gradient-to-br from-rose-950/60 via-slate-900/80 to-slate-900/80 p-6 text-left transition-all duration-300 hover:border-rose-500/40 hover:shadow-[0_0_30px_-5px_rgba(225,29,72,0.2)]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-rose-100 transition-colors">Admin</h3>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">Manage roster, staff & analytics</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-600 ml-auto group-hover:text-rose-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </motion.button>

              {/* Staff Card */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect('staff')}
                className="w-full group relative overflow-hidden rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-950/60 via-slate-900/80 to-slate-900/80 p-6 text-left transition-all duration-300 hover:border-cyan-500/40 hover:shadow-[0_0_30px_-5px_rgba(6,182,212,0.2)]"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all" />
                <div className="relative flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white group-hover:text-cyan-100 transition-colors">Staff</h3>
                    <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">View your roster & request shifts</p>
                  </div>
                  <svg className="w-5 h-5 text-slate-600 ml-auto group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </motion.button>
            </motion.div>
          ) : (
            /* ─── Password Entry ─── */
            <motion.div
              key="password"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="w-full"
            >
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors group"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
                Back to role selection
              </button>

              {/* Role Badge */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${selectedRole === 'admin'
                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    : 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                  }`}>
                  {selectedRole === 'admin' ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  )}
                  {selectedRole === 'admin' ? 'Admin Access' : 'Staff Access'}
                </div>
              </div>

              {/* Password Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="relative group">
                  <div className={`absolute inset-0 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity ${selectedRole === 'admin'
                      ? 'bg-gradient-to-r from-rose-500 to-amber-500'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500'
                    }`} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="Enter Password"
                    className="relative w-full bg-slate-900/80 border border-slate-700/50 text-center text-xl tracking-[0.4em] text-white py-4 px-6 rounded-xl focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/30 transition-all placeholder:text-slate-600 placeholder:text-sm placeholder:tracking-normal font-mono"
                    autoFocus
                    maxLength={20}
                    required
                  />
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-lg text-sm text-center"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="submit"
                  disabled={loading || !password}
                  className={`w-full font-semibold py-3.5 rounded-xl transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed text-white ${selectedRole === 'admin'
                      ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 shadow-rose-500/20'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 shadow-cyan-500/20'
                    }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </span>
                  ) : (
                    'Unlock Access'
                  )}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <p className="text-slate-700 text-xs mt-10">
          Secure Access System • KPJ Emergency Department
        </p>
      </div>
    </div>
  );
}
