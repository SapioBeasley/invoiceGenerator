import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import { DocumentFormData } from '@/types/documentGenerator';

const loadImage = async (url: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
};

export const generateDocumentPDF = async (data: DocumentFormData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: 'letter',
  });

  const margin = 0.5;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let cursorY = margin;

  // 1. Add Logo
  try {
    const logoImg = await loadImage('/logo.png');
    // Calculate aspect ratio for logo
    const imgWidth = 2; // 2 inches wide
    const imgHeight = (logoImg.height * imgWidth) / logoImg.width;
    doc.addImage(logoImg, 'PNG', margin, cursorY, imgWidth, imgHeight);
    cursorY += imgHeight + 0.3;
  } catch (error) {
    console.warn('Failed to load logo', error);
  }

  // Helper to add text and manage pagination
  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    align: 'left' | 'center' | 'right' = 'left',
    marginBottom: number = 0.1,
  ) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');

    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    const lineHeight = (fontSize / 72) * 1.15; // standard single spacing

    for (const line of lines) {
      if (cursorY + lineHeight > pageHeight - margin) {
        doc.addPage();
        cursorY = margin + 0.6;
      }
      doc.text(line, align === 'center' ? pageWidth / 2 : margin, cursorY, {
        align: align === 'center' ? 'center' : 'left',
      });
      cursorY += lineHeight;
    }
    cursorY += marginBottom;
  };

  // Helper to add section
  const addSection = (
    title: string,
    content: string,
    tableKey: string,
    pageBreakBefore: boolean = false,
  ) => {
    const table = data.sectionTables?.[tableKey];
    const hasContent = !!content;
    const hasTable = !!table?.enabled;

    if (!hasContent && !hasTable) return;

    if (pageBreakBefore) {
      doc.addPage();
      cursorY = margin + 0.6;
    }

    addText(title, 12, true, 'left', 0.05);

    if (hasContent) {
      const paragraphs = content.split('\n');
      paragraphs.forEach((p, i) => {
        const isLast = i === paragraphs.length - 1;
        if (p.trim() === '') {
          cursorY += 0.05; // smaller gap for empty lines
        } else {
          // Normal paragraphs get standard padding only after the final paragraph
          // or if they are spaced apart manually
          addText(p, 11, false, 'left', isLast ? 0.15 : 0.05);
        }
      });
    } else if (hasTable) {
      cursorY += 0.05;
    }

    if (hasTable) {
      const head = [table.headers.map((h) => h.value)];
      const body = table.rows.map((r) => r.cols.map((c) => c.value));
      body.push(table.averages.map((a) => a.value));
      body.push(table.objectives.map((o) => o.value));

      autoTable(doc, {
        startY: cursorY,
        head,
        body,
        theme: 'grid',
        styles: {
          fontSize: 10,
          lineWidth: 0.01,
          lineColor: [150, 150, 150],
          textColor: [0, 0, 0],
        },
        headStyles: {
          fillColor: [240, 240, 240],
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.01,
          lineColor: [150, 150, 150],
        },
        bodyStyles: {
          fillColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250],
        },
        didParseCell: (data) => {
          // If we are in the body section
          if (data.section === 'body') {
            const rowIndex = data.row.index;
            // The last two rows in the body array are "Averages" and "Objectives"
            if (rowIndex === body.length - 2 || rowIndex === body.length - 1) {
              data.cell.styles.fillColor = [240, 240, 240];
              data.cell.styles.fontStyle = 'bold';
            }
          }
        },
        margin: {
          top: margin + 0.6,
          left: margin,
          right: margin,
          bottom: margin,
        },
      });
      // @ts-ignore
      cursorY = (doc as any).lastAutoTable.finalY + 0.3;
    }
  };

  // Common Header
  const title =
    data.documentType === 'ISP'
      ? 'INDIVIDUAL SERVICE PLAN'
      : 'ANNUAL PROGRESS REPORT';
  addText(title, 16, true, 'left', 0.2);

  const reportDateStr = data.reportDate
    ? dayjs(data.reportDate).format('MM/DD/YYYY')
    : '';
  addText(`Date of Report: ${reportDateStr}`, 11, false, 'left', 0);
  addText(
    `Period of Report: ${data.reportPeriod || ''}`,
    11,
    false,
    'left',
    0.2,
  );

  // Identifying Info
  addText('IDENTIFYING INFORMATION', 12, true, 'left', 0.05);
  addText(`Name: ${data.name || ''}`, 11, false, 'left', 0);
  addText(`UCI#: ${data.uciNumber || ''}`, 11, false, 'left', 0);
  addText(`Date of Birth: ${data.dob || ''}`, 11, false, 'left', 0);
  addText(`Address: ${data.address || ''}`, 11, false, 'left', 0);
  addText(
    `Referral Source: ${data.referralSource || ''}`,
    11,
    false,
    'left',
    0,
  );
  addText(
    `Service Coordinator: ${data.cordinatorName || ''}`,
    11,
    false,
    'left',
    0.2,
  );

  if (data.documentType === 'ISP') {
    if (data.includeRationale)
      addSection(
        'RATIONALE FOR SERVICES',
        data.rationaleForServices,
        'rationaleForServices',
      );
    if (data.includeBackground)
      addSection(
        'BACKGROUND INFORMATION',
        data.backgroundInformation,
        'backgroundInformation',
      );
    if (data.includeMotivational)
      addSection(
        'MOTIVATIONAL ANALYSIS',
        data.motivationalAnalysis,
        'motivationalAnalysis',
      );
    if (data.includeSelfControlObjectives)
      addSection(
        'SELF-CONTROL AND INTERPERSONAL SKILL OBJECTIVES',
        data.selfControlObjectives,
        'selfControlObjectives',
      );
    if (data.includeSelfControlBarriers)
      addSection(
        'SELF-CONTROL AND INTERPERSONAL SKILLS: BARRIERS TO PROGRESS',
        data.selfControlBarriers,
        'selfControlBarriers',
      );
    if (data.includeServiceStrategies)
      addSection(
        'SERVICE STRATEGIES',
        data.serviceStrategies,
        'serviceStrategies',
      );
    if (data.includeIntervention)
      addSection(
        'INTERVENTION RECOMMENDATIONS',
        data.interventionRecommendations,
        'interventionRecommendations',
      );
    if (data.includeLifeSkills)
      addSection(
        'LIFE SKILLS TRAINING',
        data.lifeSkillsTraining,
        'lifeSkillsTraining',
      );
    if (data.includeComments)
      addSection(
        'COMMENTS AND RECOMMENDATIONS',
        data.commentsAndRecommendations,
        'commentsAndRecommendations',
        true,
      );
  } else {
    // APR logic
    if (data.includeBackground)
      addSection(
        'BACKGROUND INFORMATION',
        data.backgroundInformation,
        'backgroundInformation',
      );

    if (data.includeResultsOfBehavioral) {
      addSection(
        'RESULTS OF BEHAVIORAL INTERVENTION',
        data.resultsOfBehavioralIntervention,
        'resultsOfBehavioralIntervention',
      );
    }

    if (data.includeProgressLifeSkills) {
      addSection(
        'PROGRESS ON LIFE SKILLS TRAINING',
        data.progressOnLifeSkills,
        'progressOnLifeSkills',
      );
    }

    if (data.includeProgressSelfControl) {
      addSection(
        'PROGRESS ON SELF-CONTROL AND INTERPERSONAL SKILLS',
        data.progressOnSelfControl,
        'progressOnSelfControl',
      );
    }

    if (data.includeComments)
      addSection(
        'COMMENTS AND RECOMMENDATIONS',
        data.commentsAndRecommendations,
        'commentsAndRecommendations',
        true,
      );
  }

  // Footer
  cursorY += 0.5;
  if (cursorY + 0.5 > pageHeight - margin) {
    doc.addPage();
    cursorY = margin + 0.6;
  }
  addText('_________________________________________', 11);
  addText(`${data.printName || 'Name'}, ${data.position || 'Position'}`, 11);

  // Add Headers to pages 2+
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    const headerTitle =
      data.documentType === 'ISP'
        ? 'Individual Service Plan'
        : 'Annual Progress Report';
    doc.text(headerTitle, pageWidth - margin, margin, { align: 'right' });
    doc.text(`Re: ${data.name || ''}`, pageWidth - margin, margin + 0.15, {
      align: 'right',
    });
    doc.text(`Page ${i}`, pageWidth - margin, margin + 0.3, { align: 'right' });
  }

  doc.save(
    `${data.documentType}_${data.name.replace(/\\s+/g, '_')}_${dayjs().format('YYYYMMDD')}.pdf`,
  );
};
