"use client";

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * AnnouncementBanner - A beautiful curtain-reveal announcement banner
 * Features:
 * - Elegant curtain-open animation
 * - Casual/Script font for special occasions
 * - Dismiss button for employees
 */
const AnnouncementBanner = ({ message, onDismiss }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isCurtainOpen, setIsCurtainOpen] = useState(false);

    const handleDismiss = React.useCallback(() => {
        setIsCurtainOpen(false);
        setTimeout(() => {
            setIsVisible(false);
            setTimeout(() => onDismiss?.(), 500);
        }, 500);
    }, [onDismiss]);

    useEffect(() => {
        // Trigger entrance animation
        const showTimer = setTimeout(() => setIsVisible(true), 100);
        const curtainTimer = setTimeout(() => setIsCurtainOpen(true), 600);

        // Auto-dismiss after 2 seconds (after curtain opens)
        const autoDismissTimer = setTimeout(() => {
            handleDismiss();
        }, 2600); // 600ms (curtain open) + 2000ms (display time)

        return () => {
            clearTimeout(showTimer);
            clearTimeout(curtainTimer);
            clearTimeout(autoDismissTimer);
        };
    }, [handleDismiss]);

    if (!message) return null;

    return (
        <div
            className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-700 ease-out
                ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-gradient-to-br from-red-950/95 via-rose-950/95 to-red-900/95 backdrop-blur-xl transition-opacity duration-700
                    ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={handleDismiss}
            />

            {/* Curtain Effect - Left */}
            <div
                className={`absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-red-900 via-rose-900 to-red-800 transform transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left
                    ${isCurtainOpen ? '-translate-x-full' : 'translate-x-0'}`}
                style={{
                    boxShadow: 'inset -20px 0 40px rgba(0,0,0,0.4)',
                }}
            >
                {/* Curtain Folds */}
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.1) 30px, rgba(0,0,0,0.1) 60px)',
                }} />
            </div>

            {/* Curtain Effect - Right */}
            <div
                className={`absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-red-900 via-rose-900 to-red-800 transform transition-transform duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] origin-right
                    ${isCurtainOpen ? 'translate-x-full' : 'translate-x-0'}`}
                style={{
                    boxShadow: 'inset 20px 0 40px rgba(0,0,0,0.4)',
                }}
            >
                {/* Curtain Folds */}
                <div className="absolute inset-0 opacity-30" style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 30px, rgba(0,0,0,0.1) 30px, rgba(0,0,0,0.1) 60px)',
                }} />
            </div>

            {/* Content - Revealed after curtains open */}
            <div
                className={`relative z-10 max-w-2xl mx-4 text-center transition-all duration-700 delay-500
                    ${isCurtainOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
            >
                {/* Decorative Stars/Sparkles */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-4xl animate-pulse">✨</div>
                <div className="absolute -top-6 left-10 text-2xl animate-bounce delay-100">⭐</div>
                <div className="absolute -top-6 right-10 text-2xl animate-bounce delay-200">⭐</div>

                {/* Main Message */}
                <div
                    className="relative bg-gradient-to-br from-rose-900 via-red-900 to-rose-950 backdrop-blur-md rounded-3xl p-8 sm:p-12 border border-white/20 shadow-2xl"
                >


                    {/* Message Text - Casual Script Font */}
                    <p
                        className="text-2xl sm:text-4xl md:text-5xl text-white leading-relaxed"
                        style={{
                            fontFamily: "'Dancing Script', 'Pacifico', cursive",
                            textShadow: '0 4px 20px rgba(0,0,0,0.3)',
                        }}
                    >
                        {message}
                    </p>

                    {/* Decorative Line */}
                    <div className="mt-6 flex items-center justify-center gap-3">
                        <span className="h-px w-16 bg-gradient-to-r from-transparent to-amber-400/50" />
                        <span className="text-amber-400 text-xl">🎊</span>
                        <span className="h-px w-16 bg-gradient-to-l from-transparent to-amber-400/50" />
                    </div>

                    {/* Subtle Footer */}
                    <p className="mt-4 text-sm text-white/50 font-light">— Management Team</p>
                </div>

                {/* Bottom Sparkle */}
                <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-3xl animate-pulse delay-300">🌟</div>
            </div>

            {/* Gold Curtain Trim Line */}
            <div className={`absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-300 via-amber-500 to-amber-300 transition-opacity duration-500
                ${isCurtainOpen ? 'opacity-0' : 'opacity-100'}`}
            />
        </div>
    );
};

export default AnnouncementBanner;
