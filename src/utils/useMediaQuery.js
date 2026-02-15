"use client";

import { useState, useEffect } from 'react';

/**
 * React hook for responsive design - detects if a media query matches
 * SSR-safe: returns false on server, real value on client
 * @param {string} query - CSS media query string, e.g. "(max-width: 768px)"
 * @returns {boolean} - Whether the media query currently matches
 */
export function useMediaQuery(query) {
    // Lazy initialization to avoid SSR issues and setState in effect
    const getMatches = () => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(query).matches;
    };

    const [matches, setMatches] = useState(getMatches);

    useEffect(() => {
        // Check if window is available (client-side)
        if (typeof window === 'undefined') return;

        const mediaQuery = window.matchMedia(query);


        // Create listener function
        const handleChange = (event) => {
            setMatches(event.matches);
        };

        // Add listener
        mediaQuery.addEventListener('change', handleChange);

        // Cleanup
        return () => {
            mediaQuery.removeEventListener('change', handleChange);
        };
    }, [query]);

    return matches;
}

/**
 * Convenience hook - returns true if screen is mobile-sized
 */
export function useIsMobile() {
    return useMediaQuery('(max-width: 768px)');
}

export default useMediaQuery;
