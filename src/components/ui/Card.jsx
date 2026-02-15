import React from 'react';

const Card = ({ children, className = '', ...props }) => {
    return (
        <div
            className={`glass-panel p-6 shadow-md ${className}`}
            {...props}
            style={{
                background: 'var(--color-bg-card)',
                backdropFilter: 'var(--backdrop-blur)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-lg)'
            }}
        >
            {children}
        </div>
    );
};

export default Card;
