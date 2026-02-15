export const SHIFTS = {
    M: {
        code: 'M',
        label: 'Morning',
        time: '08:00 AM - 02:00 PM',
        colorVar: 'var(--shift-morning)',
        colorClass: 'text-yellow-400',
        bgClass: 'bg-yellow-400/20',
        borderClass: 'border-yellow-400/50'
    },
    E: {
        code: 'E',
        label: 'Evening',
        time: '02:00 PM - 08:00 PM',
        colorVar: 'var(--shift-evening)',
        colorClass: 'text-orange-400',
        bgClass: 'bg-orange-400/20',
        borderClass: 'border-orange-400/50'
    },
    N: {
        code: 'N',
        label: 'Night',
        time: '08:00 PM - 08:00 AM',
        colorVar: 'var(--shift-night)',
        colorClass: 'text-blue-400',
        bgClass: 'bg-blue-400/20',
        borderClass: 'border-blue-400/50'
    },
    G: {
        code: 'G',
        label: 'General',
        time: '09:00 AM - 05:00 PM',
        colorVar: 'var(--shift-general)',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-400/20',
        borderClass: 'border-emerald-400/50'
    },
    O: {
        code: 'O',
        label: 'Day Off',
        time: 'Rest',
        colorVar: 'var(--shift-off)',
        colorClass: 'text-slate-400',
        bgClass: 'bg-slate-700/50',
        borderClass: 'border-slate-600'
    },
    SL: {
        code: 'SL',
        label: 'Sick Leave',
        time: 'Sick Leave',
        colorVar: 'var(--shift-sick)',
        colorClass: 'text-red-500',
        bgClass: 'bg-red-500/10',
        borderClass: 'border-red-500/30'
    },
    CL: {
        code: 'CL',
        label: 'Casual Leave',
        time: 'Casual Leave',
        colorVar: 'var(--shift-casual)',
        colorClass: 'text-pink-500',
        bgClass: 'bg-pink-500/10',
        borderClass: 'border-pink-500/30'
    },
    AL: {
        code: 'AL',
        label: 'Annual Leave',
        time: 'Annual Leave',
        colorVar: 'var(--shift-annual)',
        colorClass: 'text-purple-500',
        bgClass: 'bg-purple-500/10',
        borderClass: 'border-purple-500/30'
    },
    UD: {
        code: 'UD',
        label: 'Unassigned',
        time: 'No Duty',
        colorVar: 'var(--shift-unassigned)',
        colorClass: 'text-gray-500',
        bgClass: 'bg-gray-500/10',
        borderClass: 'border-gray-500/30'
    }
};

export const SHIFT_KEYS = Object.keys(SHIFTS);
