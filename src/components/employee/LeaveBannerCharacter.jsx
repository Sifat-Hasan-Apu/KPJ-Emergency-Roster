"use client";

import React from 'react';
import { motion } from 'framer-motion';

const LeaveBannerCharacter = ({ type }) => {
    const isCasual = type === 'CL';
    const bannerText = isCasual ? "You are on Casual Leave Today" : "You are on Annual Leave Today";
    const bannerColor = isCasual ? "bg-pink-500" : "bg-violet-500";
    const bannerBorder = isCasual ? "border-pink-300" : "border-violet-300";
    const bannerShadow = isCasual ? "shadow-pink-500/50" : "shadow-violet-500/50";

    return (
        <div className="relative h-72 w-full flex items-end justify-center overflow-visible">
            {/* Background Glow */}
            <div className={`absolute bottom-0 w-48 h-48 rounded-full blur-3xl opacity-30 ${isCasual ? 'bg-pink-500' : 'bg-violet-500'}`}></div>

            {/* Floating Sparkles */}
            {[...Array(5)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    initial={{ opacity: 0, y: 0, x: (i - 2) * 30 }}
                    animate={{
                        opacity: [0, 1, 0],
                        y: -100 - Math.random() * 50,
                        x: (i - 2) * 40 + (Math.random() * 20 - 10)
                    }}
                    transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: Math.random() * 2,
                        ease: "easeOut"
                    }}
                />
            ))}

            {/* Banner Animation */}
            <motion.div
                initial={{ opacity: 0, y: -50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2, type: "spring", bounce: 0.4 }}
                className="absolute top-4 z-20 flex flex-col items-center w-full px-4"
            >
                <div className={`relative w-full max-w-[90%] md:max-w-xs px-4 py-3 rounded-xl shadow-2xl ${bannerShadow} border-[3px] ${bannerColor} ${bannerBorder} transform -rotate-2`}>
                    <h2 className="text-sm md:text-lg font-black text-white uppercase tracking-wider text-center drop-shadow-md leading-tight">
                        {bannerText}
                    </h2>

                    {/* Decorative Stars on Banner */}
                    <span className="absolute -top-3 -left-3 text-2xl animate-bounce">✨</span>
                    <span className="absolute -bottom-3 -right-3 text-2xl animate-bounce" style={{ animationDelay: '0.5s' }}>✨</span>

                    {/* Banner Sticks connecting to hands */}
                    <div className="absolute top-full left-[10%] w-1.5 h-20 bg-slate-300 rounded-full -z-10 origin-top transform rotate-6"></div>
                    <div className="absolute top-full right-[10%] w-1.5 h-20 bg-slate-300 rounded-full -z-10 origin-top transform -rotate-6"></div>
                </div>
            </motion.div>

            {/* Cartoon Character */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, type: "spring", damping: 12 }}
                className="relative z-10 -mb-2 scale-90 md:scale-100"
            >
                <svg width="140" height="140" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    {/* Shadow */}
                    <ellipse cx="100" cy="155" rx="50" ry="5" fill="#000" fillOpacity="0.2" />

                    {/* Body */}
                    <rect x="60" y="80" width="80" height="70" rx="20" fill={isCasual ? "#ec4899" : "#8b5cf6"} stroke="#1e293b" strokeWidth="4" />
                    <rect x="75" y="95" width="50" height="40" rx="8" fill="#fff" />

                    {/* Face Screen Expressions */}
                    <motion.g
                        animate={{ y: [0, -1, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {/* Eyes - Blink Animation */}
                        <motion.ellipse
                            cx="90" cy="115" rx="4" ry="4"
                            fill="#1e293b"
                            animate={{ ry: [4, 0.5, 4] }}
                            transition={{ duration: 3, times: [0, 0.05, 0.1], repeat: Infinity, delay: 1 }}
                        />
                        <motion.ellipse
                            cx="110" cy="115" rx="4" ry="4"
                            fill="#1e293b"
                            animate={{ ry: [4, 0.5, 4] }}
                            transition={{ duration: 3, times: [0, 0.05, 0.1], repeat: Infinity, delay: 1 }}
                        />
                        <path d="M95 125 Q100 130 105 125" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Cheeks */}
                        <circle cx="82" cy="120" r="3" fill="#fca5a5" fillOpacity="0.6" />
                        <circle cx="118" cy="120" r="3" fill="#fca5a5" fillOpacity="0.6" />
                    </motion.g>

                    {/* Head */}
                    <path d="M65 80 L75 55 H125 L135 80 Z" fill="#cbd5e1" stroke="#1e293b" strokeWidth="4" />
                    <circle cx="100" cy="45" r="6" fill={isCasual ? "#f472b6" : "#a78bfa"} className="animate-ping" />
                    <line x1="100" y1="55" x2="100" y2="45" stroke="#1e293b" strokeWidth="4" />

                    {/* Arms holding the stick - Adjusted positions */}
                    <path d="M50 110 Q35 130 65 140" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />
                    <path d="M150 110 Q165 130 135 140" stroke="#cbd5e1" strokeWidth="10" strokeLinecap="round" />

                    {/* Hands */}
                    <circle cx="65" cy="140" r="10" fill="#fff" stroke="#1e293b" strokeWidth="3" />
                    <circle cx="135" cy="140" r="10" fill="#fff" stroke="#1e293b" strokeWidth="3" />
                </svg>
            </motion.div>
        </div>
    );
};

export default LeaveBannerCharacter;
