import React, { useEffect, useRef, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const ContextMenu = ({ x, y, onClose, onSelect }) => {
    const menuRef = useRef(null);
    const [coords, setCoords] = useState({ top: y, left: x });
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Clean up on unmount
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                onClose();
            }
        };
        // Use 'mousedown' generally, but 'click' can also work. 
        // Blocking context menu default is handled in parent, but let's ensure we don't block global right clicks unnecessarily.
        window.addEventListener('mousedown', handleClickOutside);
        window.addEventListener('scroll', onClose, true);
        window.addEventListener('resize', onClose);

        return () => {
            window.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', onClose, true);
            window.removeEventListener('resize', onClose);
        };
    }, [onClose]);

    // Adjust position
    useLayoutEffect(() => {
        if (menuRef.current) {
            const rect = menuRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;

            let newTop = y;
            let newLeft = x;

            if (y + rect.height > viewportHeight) newTop = y - rect.height;
            if (x + rect.width > viewportWidth) newLeft = x - rect.width;

            if (newTop < 0) newTop = 10;
            if (newLeft < 0) newLeft = 10;

            setCoords({ top: newTop, left: newLeft });
        }
    }, [x, y, mounted]);

    if (!mounted) return null;

    return createPortal(
        <div
            ref={menuRef}
            style={{ top: coords.top, left: coords.left }}
            className="fixed z-[9999] bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl py-1 min-w-[140px] animate-in fade-in zoom-in-95 duration-75 overflow-hidden"
            onContextMenu={(e) => e.preventDefault()} // Prevent native menu on this menu
        >
            <button
                onClick={() => onSelect(null)}
                className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 flex items-center gap-3 transition-colors group"
            >
                <div className="p-1 rounded-md bg-red-500/10 group-hover:bg-red-500/20 text-red-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                Clear Slot
            </button>
        </div>,
        document.body
    );
};

export default ContextMenu;
