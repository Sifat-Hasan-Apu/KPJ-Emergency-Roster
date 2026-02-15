"use client";

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { forwardRef, useImperativeHandle } from 'react';
import { getMonthDays } from '@/utils/dateUtils';

const PdfRosterView = forwardRef(({ rosterData, currentYear, currentMonth, staffList }, ref) => {
    const days = getMonthDays(currentYear, currentMonth);
    const monthName = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

    useImperativeHandle(ref, () => ({
        generatePDF: () => {
            try {
                const doc = new jsPDF({
                    orientation: 'landscape',
                    unit: 'mm',
                    format: 'a4',
                });

                const pageWidth = doc.internal.pageSize.getWidth();

                // Header
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('KPJ HOSPITAL - EMERGENCY DEPARTMENT', pageWidth / 2, 15, { align: 'center' });

                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.text(`Duty Roster — ${monthName}`, pageWidth / 2, 22, { align: 'center' });

                // Prepare table data
                // Header row: Staff Name, 1, 2, 3, ... 28/30/31
                const tableHead = [
                    ['Staff Name', ...days.map(d => `${d.date}\n${d.dayName}`)]
                ];

                // Body rows: Each staff member
                const tableBody = (staffList || []).map(staff => {
                    const row = [`${staff.name}\n(${staff.designation})`];
                    days.forEach(d => {
                        const key = `${currentYear}-${currentMonth}-${d.date}_${staff.id}`;
                        const shift = rosterData[key] || '-';
                        row.push(shift);
                    });
                    return row;
                });

                // Generate table
                autoTable(doc, {
                    head: tableHead,
                    body: tableBody,
                    startY: 28,
                    theme: 'grid',
                    styles: {
                        fontSize: 7,
                        cellPadding: 1.5,
                        halign: 'center',
                        valign: 'middle',
                        lineColor: [0, 0, 0],
                        lineWidth: 0.2,
                    },
                    headStyles: {
                        fillColor: [30, 41, 59], // Slate-800
                        textColor: [255, 255, 255],
                        fontStyle: 'bold',
                        fontSize: 6,
                    },
                    columnStyles: {
                        0: { halign: 'left', cellWidth: 35 }, // Staff Name column wider
                    },
                    didDrawPage: (data) => {
                        // Footer on each page
                        const pageCount = doc.internal.getNumberOfPages();
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'normal');
                        doc.text(
                            `Page ${data.pageNumber} of ${pageCount}`,
                            pageWidth / 2,
                            doc.internal.pageSize.getHeight() - 10,
                            { align: 'center' }
                        );
                    },
                    margin: { top: 28, left: 10, right: 10 },
                });

                // Signature section on last page
                const finalY = doc.lastAutoTable.finalY || 150;
                const sigY = Math.min(finalY + 25, doc.internal.pageSize.getHeight() - 35);

                // Check if we need a new page for signatures
                if (finalY + 40 > doc.internal.pageSize.getHeight() - 20) {
                    doc.addPage();
                }

                const sigLineY = doc.internal.pageSize.getHeight() - 25;

                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');

                // Signature lines
                doc.line(20, sigLineY, 70, sigLineY);
                doc.text('Roster Maker', 45, sigLineY + 5, { align: 'center' });

                doc.line(pageWidth / 2 - 25, sigLineY, pageWidth / 2 + 25, sigLineY);
                doc.text('Head of Department', pageWidth / 2, sigLineY + 5, { align: 'center' });

                doc.line(pageWidth - 70, sigLineY, pageWidth - 20, sigLineY);
                doc.text('Hospital Director', pageWidth - 45, sigLineY + 5, { align: 'center' });

                // Legend
                doc.setFontSize(7);
                const legendY = doc.internal.pageSize.getHeight() - 8;
                doc.text('M=Morning  E=Evening  N=Night  G=General  O=Off  CL=Casual Leave  AL=Annual Leave  SL=Sick Leave', pageWidth / 2, legendY, { align: 'center' });

                // Save
                doc.save(`Duty_Roster_${monthName.replace(' ', '_')}.pdf`);

            } catch (error) {
                console.error('PDF generation error:', error);
                alert('Failed to generate PDF. Please try again.');
            }
        }
    }));

    // This component doesn't render anything visible
    return null;
});

PdfRosterView.displayName = 'PdfRosterView';

export default PdfRosterView;
