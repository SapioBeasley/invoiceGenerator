import autoTable from 'jspdf-autotable';
import jsPDF from 'jspdf';
import dayjs from 'dayjs';
import type { ActivityDateRange, ClientActivity } from '@/types/activitySummary';
import { getActivitiesForDate, getDatesInRange } from '@/lib/activitySummary';

interface ActivityClient {
  id: string;
  name: string;
  uciNumber: string;
  goals: string[];
}

export const generateActivitySummaryPDF = (
  client: ActivityClient,
  activities: ClientActivity[],
  range: ActivityDateRange,
) => {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 28;
  const reportStart = dayjs(range.start).format('MMM D, YYYY');
  const reportEnd = dayjs(range.end).format('MMM D, YYYY');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('HillTop Developmental Services: Individual Data Summary', margin, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Client: ${client.name}`, margin, 52);
  doc.text(`UCI#: ${client.uciNumber}`, margin, 67);
  doc.text(`Report period: ${reportStart} – ${reportEnd}`, margin, 82);

  const rows = getDatesInRange(range).map((date) => {
    const dailyActivities = getActivitiesForDate(activities, client.id, date);
    const goalValues = client.goals.map((goal) =>
      dailyActivities
        .map((activity) => activity.goalValues[goal])
        .filter(Boolean)
        .join(', '),
    );
    const descriptions = dailyActivities
      .map((activity) => activity.activity)
      .filter(Boolean)
      .join('; ');

    return [dayjs(date).format('ddd, MMM D, YYYY'), ...goalValues, descriptions];
  });

  autoTable(doc, {
    startY: 98,
    margin: { left: margin, right: margin, top: 28, bottom: 28 },
    head: [['Date', ...client.goals, 'Activity']],
    body: rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: client.goals.length > 5 ? 7 : 8,
      cellPadding: 4,
      textColor: [30, 30, 30],
      lineColor: [190, 190, 190],
      lineWidth: 0.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: { fillColor: [247, 249, 251] },
    columnStyles: {
      0: { cellWidth: 92 },
      [client.goals.length + 1]: { cellWidth: Math.max(120, pageWidth * 0.2) },
    },
  });

  doc.save(
    `individual-data-summary-${client.name.replace(/\s+/g, '-').toLowerCase()}-${range.start}-${range.end}.pdf`,
  );
};