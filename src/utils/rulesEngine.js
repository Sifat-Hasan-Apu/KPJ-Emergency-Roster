export const validateShiftAssignment = (rosterData, staffId, date, shiftCode, currentYear, currentMonth) => {
    // 1. Double Shift Prevention (Overwrite Warning)
    const key = `${currentYear}-${currentMonth}-${date}_${staffId}`;
    if (rosterData[key] && rosterData[key] !== shiftCode) {
        // This is more of a UI confirmation, but we can flag it here if needed.
        // For now, allow overwrite but maybe UI should handle the "Are you sure?"
    }

    // 2. Night Duty Gap Rule
    // Logic: If yesterday was Night (N), today should generally be Off (O), 
    // BUT we now allow consecutive Nights (up to 3).
    // So: If yesterday = N, today can be O OR N. 
    // If today is M, E, etc., it is a violation.

    const prevDate = date - 1;
    if (prevDate >= 1) {
        const prevKey = `${currentYear}-${currentMonth}-${prevDate}_${staffId}`;
        const prevShift = rosterData[prevKey];

        if (prevShift === 'N') {
            // New logic: Allow 'N' (consecutive) or 'O' (rest). Block others.
            if (shiftCode !== 'N' && shiftCode !== 'O') {
                return {
                    valid: false,
                    message: 'Violation: after a Night Shift, staff must take a Rest Day (O) or continue Night Duty (N).'
                };
            }
        }
    }

    // 3. Consecutive Night Shifts Rule
    // Rule: after 3 consecutive night shifts, next day MUST be Off ('O')
    // Sub-rule A: Cannot assign 4th Night
    // Sub-rule B: Cannot assign Morning/Evening immediately after 3 Nights (must be Off)

    // Check previous 3 days
    let consecutiveNights = 0;
    for (let i = 1; i <= 3; i++) {
        const checkDate = new Date(currentYear, currentMonth - 1, date); // currentMonth is 1-indexed
        checkDate.setDate(checkDate.getDate() - i); // Go back i days

        const y = checkDate.getFullYear();
        const m = checkDate.getMonth() + 1; // getMonth is 0-indexed, convert back to 1-indexed
        const d = checkDate.getDate();

        const checkKey = `${y}-${m}-${d}_${staffId}`;
        if (rosterData[checkKey] === 'N') {
            consecutiveNights++;
        } else {
            break; // sequence broken
        }
    }

    if (consecutiveNights === 3) {
        if (shiftCode === 'N') {
            return { valid: false, message: "Violation: Maximum 3 consecutive night shifts allowed." };
        }
        if (shiftCode !== 'O') {
            return { valid: false, message: "Violation: Must take a Rest Day (Off) after 3 consecutive nights." };
        }
    }

    return { valid: true };
};

// 3. Consecutive Night Shifts Rule logic is handled in validation.
// For auto-assignment, we only want to auto-set 'O' if this is the 3rd consecutive night.

export const getAutoAssignments = (rosterData, staffId, date, shiftCode, currentYear, currentMonth, daysInMonth) => {
    const autoUpdates = {};

    // Check if we are assigning the 3rd consecutive Night
    if (shiftCode === 'N') {
        // Check previous 2 days
        let consecutiveNights = 0;
        for (let i = 1; i <= 2; i++) {
            const checkDate = new Date(currentYear, currentMonth - 1, date);
            checkDate.setDate(checkDate.getDate() - i);

            const y = checkDate.getFullYear();
            const m = checkDate.getMonth() + 1;
            const d = checkDate.getDate();
            const key = `${y}-${m}-${d}_${staffId}`;

            if (rosterData[key] === 'N') {
                consecutiveNights++;
            }
        }

        // If including today (which is N) we have 3, then Next Day (date + 1) must be O
        if (consecutiveNights === 2) {
            // We found 2 previous, plus today = 3.
            const nextDate = date + 1;
            if (nextDate <= daysInMonth) {
                const nextKey = `${currentYear}-${currentMonth}-${nextDate}_${staffId}`;
                autoUpdates[nextKey] = 'O';
            }
        }
    }

    return autoUpdates;
};
