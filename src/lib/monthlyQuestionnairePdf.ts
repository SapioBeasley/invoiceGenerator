import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import { MonthlyQuestionnaireData } from '@/types/monthlyQuestionnaire';

export const generateMonthlyQuestionnairePDF = (data: MonthlyQuestionnaireData) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 42;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text('HillTop Developmental Services', pageWidth / 2, y, { align: 'center' });
  y += 25;
  doc.setFontSize(14);
  doc.text(data.packetTitle, pageWidth / 2, y, { align: 'center' });
  y += 30;

  doc.setFontSize(11);
  doc.text(`Client’s Name: ${data.clientName}`, margin, y);
  doc.text(`Job Coach: ${data.jobCoach}`, pageWidth / 2, y);
  y += 17;
  doc.text(`Month: ${data.month ? dayjs(`${data.month}-01`).format('MM/YYYY') : ''}`, margin, y);
  y += 28;

  let questionNumber = 1;
  data.topics.forEach((topic) => {
    ensureSpace(44);
    doc.setFillColor(41, 128, 185);
    doc.rect(margin, y - 15, contentWidth, 22, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(`Topic: ${topic.title}`, margin + 8, y);
    doc.setTextColor(30, 30, 30);
    y += 28;

    topic.questions.forEach((question) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      const prompt = `${questionNumber}. ${question.prompt}`;
      questionNumber += 1;
      const promptLines = doc.splitTextToSize(prompt, contentWidth) as string[];
      ensureSpace(promptLines.length * 14 + 28);
      doc.text(promptLines, margin, y);
      y += promptLines.length * 14 + 6;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const answerLines = doc.splitTextToSize(question.answer || ' ', contentWidth) as string[];
      ensureSpace(answerLines.length * 14 + 20);
      doc.text(answerLines, margin, y);
      y += answerLines.length * 14 + 18;
    });
  });

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(data.packetTitle, margin, pageHeight - 24);
  doc.save(
    `monthly-questionnaire-${data.clientName.replace(/\s+/g, '-').toLowerCase()}-${data.month || 'report'}.pdf`,
  );
};