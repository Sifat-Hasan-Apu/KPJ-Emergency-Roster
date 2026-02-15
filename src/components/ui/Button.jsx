import React from 'react';

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
    const baseStyles = "px-4 py-2 rounded-lg font-medium transition-all duration-200 outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900";

    const variants = {
        primary: {
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            boxShadow: '0 0 10px var(--color-primary-light)'
        },
        secondary: {
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text-main)',
            border: '1px solid var(--color-border)',
        },
        danger: {
            background: 'var(--color-danger)',
            color: 'white',
        }
    };

    const style = variants[variant] || variants.primary;

    return (
        <button
            className={`${baseStyles} ${className}`}
            style={style}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
