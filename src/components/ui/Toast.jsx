"use client";

import React, { useEffect } from 'react';

const Toast = ({ message, type = 'info', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const bgColors = {
        info: 'bg-blue-600',
        error: 'bg-red-600',
        success: 'bg-green-600',
        warning: 'bg-orange-500'
    };

    return (
        <div className={`fixed bottom-4 right-4 ${bgColors[type]} text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 z-50`}>
            <span className="font-bold">
                {type === 'error' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️'}
            </span>
            <p className="font-medium">{message}</p>
            <button onClick={onClose} className="ml-4 opacity-70 hover:opacity-100 font-bold">&times;</button>
        </div>
    );
};

export default Toast;
