import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import { WeeklyScheduleData } from '@/types/weeklySchedule';

export const generateWeeklySchedulePDF = (data: WeeklyScheduleData) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;
  const clientNames = [data.primaryClientName, ...data.additionalClients].filter(Boolean);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('HillTop Developmental Services', margin, 30);
  doc.setFontSize(13);
  doc.text(`WEEKLY SCHEDULE ${data.weekLabel}`, pageWidth / 2, 30, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Staff: ${data.staff}`, margin, 48);
  doc.text(`First Day of the work week: ${data.firstDayOfWeek ? dayjs(data.firstDayOfWeek).format('M/D/YY') : ''}`, margin, 63);
  doc.text(`Clients: ${clientNames.join(', ')}`, pageWidth / 2, 48);

  data.pickupDropoff.forEach((value, index) => {
    doc.text(`Pickup/Dropoff ${index + 1}: ${value}`, pageWidth / 2, 63 + index * 14);
  });

  const notesY = 63 + Math.max(data.pickupDropoff.length, 1) * 14;
  doc.setFont('helvetica', 'bold');
  doc.text('COPY NOTES:', margin, notesY);
  doc.setFont('helvetica', 'normal');
  doc.text(
    doc.splitTextToSize(data.copyNotes || ' ', pageWidth - margin * 2 - 70),
    margin + 70,
    notesY,
  );

  autoTable(doc, {
    startY: notesY + 20,
    margin: { left: margin, right: margin, top: 24, bottom: 28 },
    head: [['DATE', 'TIME', 'LOCATION', 'PURPOSE', 'CLIENT INPUT (USE NAMES)']],
    body: data.entries.map((entry) => [
      entry.date ? dayjs(entry.date).format('M/D/YY') : '',
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
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 58 },
      1: { cellWidth: 58 },
      2: { cellWidth: 130 },
      3: { cellWidth: 170 },
    },
  });

  doc.save(
    `weekly-schedule-${data.primaryClientName.replace(/\s+/g, '-').toLowerCase()}-${data.firstDayOfWeek || 'week'}.pdf`,
  );
};