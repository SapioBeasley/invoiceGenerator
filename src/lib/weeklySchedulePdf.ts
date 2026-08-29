import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import type { ActivityDateRange } from '@/types/activitySummary';
import { getDatesInRange } from '@/lib/activitySummary';
import type { ScheduleEntry, WeeklyScheduleExportOptions } from '@/types/weeklySchedule';

interface ScheduleClient {
  id: string;
  name: string;
}

const getWeekStart = (date: string): string => {
  const value = dayjs(date);
  return (value.day() === 0 ? value.subtract(6, 'day') : value.startOf('week').add(1, 'day'))
    .format('YYYY-MM-DD');
};

export const generateWeeklySchedulePDF = (
  client: ScheduleClient,
  entries: ScheduleEntry[],
  range: ActivityDateRange,
  options: WeeklyScheduleExportOptions,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;
  const dates = getDatesInRange(range);
  const weekStarts = [...new Set(dates.map(getWeekStart))];
  const clientNames = [client.name, ...options.additionalClients].filter(Boolean);

  weekStarts.forEach((weekStart, weekIndex) => {
    if (weekIndex > 0) doc.addPage();
    const weekEnd = dayjs(weekStart).add(6, 'day').format('YYYY-MM-DD');
    const weekEntries = entries
      .filter((entry) => entry.date >= range.start && entry.date <= range.end)
      .filter((entry) => getWeekStart(entry.date) === weekStart)
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    const staff = weekEntries.find((entry) => entry.staff)?.staff ?? '';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('HillTop Developmental Services', margin, 30);
    doc.setFontSize(13);
    doc.text(
      `WEEKLY SCHEDULE ${dayjs(weekStart).format('M/D/YY')} – ${dayjs(weekEnd).format('M/D/YY')}`,
      pageWidth / 2,
      30,
      { align: 'center' },
    );
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Staff: ${staff}`, margin, 48);
    doc.text(`Clients: ${clientNames.join(', ')}`, pageWidth / 2, 48);
    options.pickupDropoff.forEach((value, index) => {
      if (value) doc.text(`Pickup/Dropoff ${index + 1}: ${value}`, pageWidth / 2, 63 + index * 14);
    });

    const notesY = 63 + Math.max(options.pickupDropoff.length, 1) * 14;
    doc.setFont('helvetica', 'bold');
    doc.text('COPY NOTES:', margin, notesY);
    doc.setFont('helvetica', 'normal');
    doc.text(
      doc.splitTextToSize(options.copyNotes || ' ', pageWidth - margin * 2 - 70),
      margin + 70,
      notesY,
    );

    autoTable(doc, {
      startY: notesY + 20,
      margin: { left: margin, right: margin, top: 24, bottom: 28 },
      head: [['DATE', 'TIME', 'LOCATION', 'PURPOSE', 'CLIENT INPUT (USE NAMES)']],
      body: weekEntries.map((entry) => [
        dayjs(entry.date).format('M/D/YY'),
        entry.time,
        entry.location,
        entry.purpose,
        entry.clientInput,
      ]),
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        cellPadding: 5,
        overflow: 'linebreak',
        lineColor: [170, 170, 170],
        lineWidth: 0.5,
        textColor: [30, 30, 30],
      },
      headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { cellWidth: 58 },
        1: { cellWidth: 58 },
        2: { cellWidth: 130 },
        3: { cellWidth: 170 },
      },
    });
  });

  doc.save(
    `weekly-schedule-${client.name.replace(/\s+/g, '-').toLowerCase()}-${range.start.slice(0, 7)}.pdf`,
  );
};