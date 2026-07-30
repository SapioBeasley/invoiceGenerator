import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import { BehavioralAssessmentData } from '@/types/behavioralAssessment';

const addWrappedText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  fontSize = 11,
  lineHeight = 16,
): number => {
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text || ' ', width) as string[];
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
};

const addSection = (
  doc: jsPDF,
  title: string,
  prompt: string,
  value: string,
  y: number,
  pageWidth: number,
): number => {
  const margin = 42;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(title, margin, y);
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(9);
  const promptLines = doc.splitTextToSize(prompt, pageWidth - margin * 2 - 105) as string[];
  doc.text(promptLines, margin + 105, y);
  doc.setDrawColor(180, 180, 180);
  doc.line(margin, y + 7, pageWidth - margin, y + 7);
  return addWrappedText(doc, value, margin, y + 28, pageWidth - margin * 2, 11, 16) + 12;
};

export const generateBehavioralAssessmentPDF = (data: BehavioralAssessmentData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 42;
  let y = 42;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('HillTop Developmental Services', pageWidth / 2, y, { align: 'center' });
  y += 26;
  doc.setFontSize(14);
  doc.text('ABC BEHAVIORAL ASSESSMENT', pageWidth / 2, y, { align: 'center' });
  y += 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Including the Following:', margin, y);
  y += 22;

  const prompts = [
    ['When', 'Date, time of day, duration'],
    ['Antecedents', 'Where, who, what, why'],
    ['Consequences', 'What did Coach do, say, etc. to resolve the situation? How did client react?'],
  ];
  prompts.forEach(([title, prompt]) => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${title}:`, margin, y);
    doc.setFont('helvetica', 'normal');
    y = addWrappedText(doc, prompt, margin + 105, y, pageWidth - margin * 2 - 105, 10, 14) + 5;
  });

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Client’s Name:', margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName, margin + 95, y);
  doc.text('Month:', pageWidth / 2 + 20, y);
  doc.text(data.month ? dayjs(`${data.month}-01`).format('MMMM YYYY') : '', pageWidth / 2 + 65, y);
  y += 28;

  y = addSection(doc, 'When', 'Date, time of day, duration', data.when, y, pageWidth);
  y = addSection(doc, 'Antecedents', 'Where, who, what, why', data.antecedents, y, pageWidth);
  y = addSection(
    doc,
    'Consequences',
    'Staff response and client reaction',
    data.consequences,
    y,
    pageWidth,
  );
  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Summary', margin, y);
  y = addWrappedText(doc, data.summary, margin, y + 24, pageWidth - margin * 2);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('ABC Behavioral Assessment', margin, doc.internal.pageSize.getHeight() - 24);
  doc.save(
    `abc-behavioral-assessment-${data.clientName.replace(/\s+/g, '-').toLowerCase()}-${data.month || 'report'}.pdf`,
  );
};