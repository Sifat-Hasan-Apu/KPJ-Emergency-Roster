"use client";

import * as XLSX from 'xlsx';
import { forwardRef, useImperativeHandle } from 'react';
import { getMonthDays } from '@/utils/dateUtils';

const ExcelRosterView = forwardRef(({ rosterData, currentYear, currentMonth, staffList }, ref) => {
    const days = getMonthDays(currentYear, currentMonth);
    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

    useImperativeHandle(ref, () => ({
        generateExcel: () => {
            try {
                // Create workbook and worksheet
                const wb = XLSX.utils.book_new();

                // Prepare data array
                const data = [];

                // Header rows
                data.push(['KPJ HOSPITAL - EMERGENCY DEPARTMENT']);
                data.push([`Duty Roster — ${monthName}`]);
                data.push([]); // Empty row for spacing

                // Column headers: Staff Name, 1, 2, 3, ... 28/30/31
                const headerRow = ['Staff Name', 'Designation', ...days.map(d => d.date)];
                data.push(headerRow);

                // Day names row
                const dayNamesRow = ['', '', ...days.map(d => d.dayName)];
                data.push(dayNamesRow);

                // Staff data rows
                (staffList || []).forEach(staff => {
                    const row = [staff.name, staff.designation];
                    days.forEach(d => {
                        const key = `${currentYear}-${currentMonth}-${d.date}_${staff.id}`;
                        const shift = rosterData[key] || '-';
                        row.push(shift);
                    });
                    data.push(row);
                });

                // Add empty rows for spacing
                data.push([]);
                data.push([]);

                // Legend
                data.push(['Legend:']);
                data.push(['M = Morning', 'E = Evening', 'N = Night', 'G = General', 'O = Off']);
                data.push(['CL = Casual Leave', 'AL = Annual Leave', 'SL = Sick Leave']);

                // Add signature rows
                data.push([]);
                data.push([]);
                data.push(['____________________', '', '', '', '____________________', '', '', '', '____________________']);
                data.push(['Roster Maker', '', '', '', 'Head of Department', '', '', '', 'Hospital Director']);

                // Create worksheet from data
                const ws = XLSX.utils.aoa_to_sheet(data);

                // Set column widths
                const colWidths = [
                    { wch: 25 }, // Staff Name
                    { wch: 15 }, // Designation
                    ...days.map(() => ({ wch: 5 })) // Date columns
                ];
                ws['!cols'] = colWidths;

                // Merge cells for header
                ws['!merges'] = [
                    { s: { r: 0, c: 0 }, e: { r: 0, c: days.length + 1 } }, // Title
                    { s: { r: 1, c: 0 }, e: { r: 1, c: days.length + 1 } }, // Subtitle
                ];

                // Add worksheet to workbook
                XLSX.utils.book_append_sheet(wb, ws, 'Duty Roster');

                // Generate and download file
                XLSX.writeFile(wb, `Duty_Roster_${monthName.replace(' ', '_')}.xlsx`);

            } catch (error) {
                console.error('Excel generation error:', error);
                alert('Failed to generate Excel. Please try again.');
            }
        }
    }));

    // This component doesn't render anything visible
    return null;
});

ExcelRosterView.displayName = 'ExcelRosterView';

export default ExcelRosterView;
