import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import { GroomingChecklistData } from '@/types/groomingChecklist';

const formatDate = (date: string): string =>
  date ? dayjs(date).format('M/D') : '';

export const generateGroomingChecklistPDF = (data: GroomingChecklistData) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('HillTop Developmental Services: Individual Data Summary', margin, 30);
  doc.setFontSize(10);
  doc.text(`Client’s Name: ${data.clientName}`, margin, 48);
  doc.text(`Task: ${data.task}`, margin, 63);
  doc.text(`Month/Year: ${data.month ? dayjs(`${data.month}-01`).format('MM/YYYY') : ''}`, margin, 78);
  doc.setFont('helvetica', 'normal');
  doc.text('Rating Method:', margin, 94);
  const ratingLines = doc.splitTextToSize(data.ratingMethod || ' ', pageWidth - 150) as string[];
  doc.text(ratingLines, margin + 75, 94);

  const head = [['Date: Month/Day', ...data.dates.map(formatDate)]];
  const body = data.items.map((item, index) => [
    `${index + 1}) ${item.label}`,
    ...data.dates.map((date) => item.ratings[date] ?? ''),
  ]);
  const totals = [
    'Totals:',
    ...data.dates.map((date) =>
      data.items.filter((item) => item.ratings[date]?.trim() === '1').length.toString(),
    ),
  ];

  autoTable(doc, {
    startY: 115,
    margin: { left: margin, right: margin, top: 24, bottom: 28 },
    head,
    body: [...body, totals],
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: data.dates.length > 8 ? 7 : 8,
      cellPadding: 4,
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
      0: { cellWidth: Math.min(220, pageWidth * 0.28) },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'body' && hookData.row.index === body.length) {
        hookData.cell.styles.fontStyle = 'bold';
        hookData.cell.styles.fillColor = [240, 240, 240];
      }
    },
  });

  const tableEnd = (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 430;
  let y = tableEnd + 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Barriers to progress:', margin, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    doc.splitTextToSize(data.barriersToProgress || ' ', pageWidth - margin * 2),
    margin,
    y,
  );

  doc.save(
    `grooming-checklist-${data.clientName.replace(/\s+/g, '-').toLowerCase()}-${data.month || 'report'}.pdf`,
  );
};