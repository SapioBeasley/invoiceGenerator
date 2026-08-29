import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import type { GroomingEntry, GroomingExportOptions } from '@/types/groomingChecklist';

interface GroomingClient {
  id: string;
  name: string;
}

export const generateGroomingChecklistPDF = (
  client: GroomingClient,
  entries: GroomingEntry[],
  month: string,
  options: GroomingExportOptions,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const margin = 28;
  const pageWidth = doc.internal.pageSize.getWidth();
  const monthLabel = month ? dayjs(`${month}-01`).format('MMMM YYYY') : '';
  const sortedEntries = [...entries]
    .filter((entry) => entry.clientId === client.id && entry.date.startsWith(month))
    .sort((a, b) => `${a.date} ${a.itemLabel}`.localeCompare(`${b.date} ${b.itemLabel}`));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('HillTop Developmental Services: Individual Data Summary', margin, 30);
  doc.setFontSize(10);
  doc.text(`Client’s Name: ${client.name}`, margin, 48);
  doc.text(`Task: ${options.task}`, margin, 63);
  doc.text(`Month/Year: ${monthLabel}`, margin, 78);
  doc.setFont('helvetica', 'normal');
  doc.text('Rating Method:', margin, 94);
  doc.text(doc.splitTextToSize(options.ratingMethod || ' ', pageWidth - 150), margin + 75, 94);

  autoTable(doc, {
    startY: 115,
    margin: { left: margin, right: margin, top: 24, bottom: 28 },
    head: [['DATE', 'CHECKLIST ITEM', 'RATING']],
    body: sortedEntries.map((entry) => [dayjs(entry.date).format('M/D/YYYY'), entry.itemLabel, entry.rating]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 9, cellPadding: 5, lineColor: [170, 170, 170], lineWidth: 0.5, textColor: [30, 30, 30] },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: 90 }, 2: { cellWidth: 90 } },
  });

  const tableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Recorded completions by date:', margin, tableEnd + 24);
  autoTable(doc, {
    startY: tableEnd + 32,
    margin: { left: margin, right: margin, top: 24, bottom: 28 },
    head: [['DATE', 'COMPLETED ITEMS']],
    body: [...new Set(sortedEntries.map((entry) => entry.date))].map((date) => [
      dayjs(date).format('M/D/YYYY'),
      sortedEntries.filter((entry) => entry.date === date && entry.rating === '1').length.toString(),
    ]),
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 4, lineColor: [190, 190, 190], lineWidth: 0.5 },
    headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255], fontStyle: 'bold' },
  });

  const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? tableEnd + 50;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    doc.splitTextToSize(`Barriers to progress: ${options.barriersToProgress || ''}`, pageWidth - margin * 2),
    margin,
    finalY + 24,
  );
  doc.save(`grooming-checklist-${client.name.replace(/\s+/g, '-').toLowerCase()}-${month || 'report'}.pdf`);
};