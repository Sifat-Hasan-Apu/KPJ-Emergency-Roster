export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

export const getMonthDays = (year, month) => {
    const days = [];
    const totalDays = getDaysInMonth(year, month);

    for (let i = 1; i <= totalDays; i++) {
        const date = new Date(year, month, i);
        days.push({
            date: i,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            fullDate: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
        });
    }
    return days;
};

export const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];
