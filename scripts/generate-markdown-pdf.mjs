import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { jsPDF } from 'jspdf';
import { markdownPdfStyle } from './markdown-pdf-style.mjs';

const defaultMarkdownPath = 'public/reference-pdfs/markdown/job-description-and-soe-specifications.md';
const defaultPdfPath = 'public/reference-pdfs/generated/job-description-and-soe-specifications.pdf';

export const parseDocument = (source) => {
  const lines = source.split(/\r?\n/);
  const metadata = {};
  let contentStart = 0;
  if (lines[0] === '---') {
    const end = lines.indexOf('---', 1);
    if (end > 0) {
      lines.slice(1, end).forEach((line) => {
        const separator = line.indexOf(':');
        if (separator > 0) metadata[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
      });
      contentStart = end + 1;
    }
  }
  return { metadata, lines: lines.slice(contentStart) };
};

const plainText = (value) => value
  .replace(/\*\*|__/g, '')
  .replace(/<\/?u>/gi, '')
  .replace(/`/g, '');

const isPageHeader = (line) =>
  /^autism service tips$/i.test(line) || /^(?:.+\s+)?page\s+\d+$/i.test(line);

const isTableRow = (line) => line.trim().startsWith('|') && line.trim().endsWith('|');

const isPageBreak = (line) => /^<!--\s*pagebreak\s*-->$/i.test(line.trim());

const isOrderedListItem = (line) => /^\d+[.)](?:\s|$)/.test(line.trim());
const isLetteredListItem = (line) => /^[A-Za-z][.)](?:\s|$)/.test(line.trim());
const isUnorderedListItem = (line) => /^[-*+]+\s/.test(line.trim());
const isBareBullet = (line) => /^o(?:\s|$)/i.test(line.trim());
const isListItem = (line) => isOrderedListItem(line)
  || isLetteredListItem(line)
  || isUnorderedListItem(line)
  || isBareBullet(line);

const isBlockLine = (line) =>
  /^(#{1,3}\s)/.test(line) ||
  isListItem(line) ||
  isTableRow(line) ||
  isPageBreak(line) ||
  line.trim() === '---' ||
  (line.startsWith('**') && line.includes(':**')) ||
  (line.includes('**Date:**') && line.includes('**Signature of Employee:**'));

export const reflowMarkdownLines = (rawLines) => {
  const lines = [];
  let paragraph = [];
  let listContinuation = false;
  const flushParagraph = () => {
    if (paragraph.length > 0) lines.push(paragraph.join(' '));
    paragraph = [];
  };

  rawLines.forEach((rawLine) => {
    const sourceIndent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const line = rawLine.trim().replace(/^#{1,3}\s+(?=\d+[.)]\s)/, '');
    const headerText = line.replace(/^#{1,3}\s/, '');
    if (isPageHeader(headerText) || /^\d+$/.test(headerText)) return;
    if (line === '') {
      flushParagraph();
      lines.push('');
      listContinuation = false;
    } else if (isBlockLine(line)) {
      flushParagraph();
      lines.push(`${' '.repeat(sourceIndent)}${line}`);
      listContinuation = false;
    } else {
      const previousLine = lines[lines.length - 1];
      const startsLowercase = /^[a-z]/.test(line);
      const isEmptyOrderedListItem = previousLine && /^\d+[.)]\s*$/.test(previousLine.trim());
      if (
        paragraph.length === 0 &&
        previousLine &&
        isListItem(previousLine) &&
        (listContinuation || startsLowercase || isEmptyOrderedListItem)
      ) {
        lines[lines.length - 1] = `${previousLine} ${line}`;
        listContinuation = true;
      } else {
        paragraph.push(line);
        listContinuation = false;
      }
    }
  });
  flushParagraph();
  return lines;
};

const parseTableRow = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((cell) => cell.trim());

const isTableSeparator = (row) => row.length > 0 && row.every((cell) => /^:?-{3,}:?$/.test(cell));

const parseInlineSegments = (value, baseBold = false) => {
  const pattern = /(\*\*[^*]+\*\*|__[^_]+__|<u>[^<]+<\/u>|_[^_]+_)/gi;
  const segments = [];
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    if (match.index > cursor) segments.push({ text: value.slice(cursor, match.index), bold: baseBold, underline: false });
    const token = match[0];
    const underline = /^<u>/i.test(token) || /^_[^_]/.test(token);
    const bold = /^\*\*|^__/.test(token) || baseBold;
    segments.push({ text: plainText(token), bold, underline });
    cursor = match.index + token.length;
  }
  if (cursor < value.length) segments.push({ text: value.slice(cursor), bold: baseBold, underline: false });
  return segments.length > 0 ? segments : [{ text: value, bold: baseBold, underline: false }];
};

const wrapRichText = (doc, value, width, fontSize, baseBold = false) => {
  const lines = [[]];
  let lineWidth = 0;
  const addLine = () => {
    lines.push([]);
    lineWidth = 0;
  };

  parseInlineSegments(value, baseBold).forEach((segment) => {
    segment.text.split(/(\s+)/).filter(Boolean).forEach((text) => {
      let remaining = text;
      while (remaining.length > 0) {
        const token = { ...segment, text: remaining };
        doc.setFont('helvetica', token.bold ? 'bold' : 'normal');
        doc.setFontSize(fontSize);
        const tokenWidth = doc.getTextWidth(remaining);
        const isWhitespace = /^\s+$/.test(remaining);

        if (isWhitespace && lineWidth + tokenWidth > width) {
          remaining = '';
          continue;
        }

        if (!isWhitespace && lineWidth > 0 && lineWidth + tokenWidth > width) {
          addLine();
          continue;
        }

        if (!isWhitespace && tokenWidth > width) {
          let chunk = '';
          let chunkWidth = 0;
          for (const character of remaining) {
            const characterWidth = doc.getTextWidth(character);
            if (chunk && chunkWidth + characterWidth > width - lineWidth) break;
            chunk += character;
            chunkWidth += characterWidth;
          }
          lines[lines.length - 1].push({ ...segment, text: chunk });
          lineWidth += chunkWidth;
          remaining = remaining.slice(chunk.length);
          if (remaining.length > 0) addLine();
          continue;
        }

        lines[lines.length - 1].push(token);
        lineWidth += tokenWidth;
        remaining = '';
      }
    });
  });
  return lines;
};

const drawRichLines = (
  doc,
  lines,
  x,
  y,
  fontSize,
  lineHeight,
  width,
  justify = false,
  lineOffset = 0,
  totalLineCount = lines.length,
) => {
  lines.forEach((line, lineIndex) => {
    let cursorX = x;
    const normalizedLine = (Array.isArray(line) ? line : [line]).map((token) => ({
      text: String(token?.text ?? token ?? ''),
      bold: Boolean(token?.bold),
      underline: Boolean(token?.underline),
    }));
    const tokenWidths = normalizedLine.map((token) => {
      doc.setFont('helvetica', token.bold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      return doc.getTextWidth(token.text);
    });
    const isLastLine = lineIndex + lineOffset === totalLineCount - 1;
    const whitespaceCount = normalizedLine.filter((token) => /^\s+$/.test(token.text)).length;
    const extraSpace = justify && !isLastLine && whitespaceCount > 0
      ? Math.max(0, width - tokenWidths.reduce((total, tokenWidth) => total + tokenWidth, 0)) / whitespaceCount
      : 0;
    normalizedLine.forEach((token) => {
      doc.setFont('helvetica', token.bold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.text(token.text, cursorX, y + lineIndex * lineHeight);
      const tokenWidth = doc.getTextWidth(token.text);
      if (token.underline && token.text.trim()) doc.line(cursorX, y + lineIndex * lineHeight + 2, cursorX + tokenWidth, y + lineIndex * lineHeight + 2);
      cursorX += tokenWidth + (/^\s+$/.test(token.text) ? extraSpace : 0);
    });
  });
};

export const renderMarkdownPdf = async (markdownPath, pdfPath) => {
  const { metadata, lines: rawLines } = parseDocument(await readFile(markdownPath, 'utf8'));
  const lines = reflowMarkdownLines(rawLines);
  const showDocumentTitle = metadata['show-title'] === 'true';
  const orientation = metadata.format?.includes('landscape') ? 'landscape' : 'portrait';
  const doc = new jsPDF({ orientation, unit: 'pt', format: 'letter' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const { margin, pageBottom, logo: logoStyle } = markdownPdfStyle;
  const contentWidth = pageWidth - margin * 2;
  const logoPath = path.resolve(metadata.logo || 'public/logo.png');
  const logo = `data:image/png;base64,${(await readFile(logoPath)).toString('base64')}`;
  let y = markdownPdfStyle.firstPageTop;

  const startPage = (includeLogo = false) => {
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    if (includeLogo) {
      doc.addImage(logo, 'PNG', logoStyle.x, logoStyle.y, logoStyle.width, logoStyle.height);
    }
    y = includeLogo ? markdownPdfStyle.firstPageTop : markdownPdfStyle.followingPageTop;
  };

  const addPage = () => {
    doc.addPage();
    startPage(false);
  };

  const ensureSpace = (height) => {
    if (y + height > pageHeight - pageBottom) addPage();
  };

  const addParagraph = (text, options = {}) => {
    const fontSize = options.fontSize || markdownPdfStyle.body.fontSize;
    const lineHeight = options.lineHeight || fontSize * 1.3;
    const indent = options.indent || 0;
    const before = options.before || 0;
    const justify = options.justify ?? true;
    const linesToDraw = wrapRichText(doc, text, contentWidth - indent, fontSize, options.bold);
    let lineIndex = 0;
    let isFirstLine = true;
    while (lineIndex < linesToDraw.length) {
      if (isFirstLine) {
        if (y + before + lineHeight > pageHeight - pageBottom) addPage();
        y += before;
        isFirstLine = false;
      }

      if (y + lineHeight > pageHeight - pageBottom) addPage();
      const availableLines = Math.max(1, Math.floor((pageHeight - pageBottom - y) / lineHeight));
      const linesOnPage = Math.min(availableLines, linesToDraw.length - lineIndex);
      drawRichLines(
        doc,
        linesToDraw.slice(lineIndex, lineIndex + linesOnPage),
        margin + indent,
        y,
        fontSize,
        lineHeight,
        contentWidth - indent,
        justify,
        lineIndex,
        linesToDraw.length,
      );
      y += linesOnPage * lineHeight;
      lineIndex += linesOnPage;
      if (lineIndex < linesToDraw.length) addPage();
    }
    y += options.after ?? markdownPdfStyle.body.after;
  };

  const addTable = (tableLines) => {
    const rows = tableLines.map(parseTableRow).filter((row) => !isTableSeparator(row));
    if (rows.length === 0) return;

    const tableStyle = markdownPdfStyle.table;
    const columnCount = Math.max(...rows.map((row) => row.length));
    const firstColumnWidth = columnCount === 1 ? contentWidth : contentWidth * 0.34;
    const columnWidths = Array.from({ length: columnCount }, (_, index) => (
      index === 0 ? firstColumnWidth : (contentWidth - firstColumnWidth) / (columnCount - 1)
    ));
    const drawRow = (row, isHeader = false) => {
      const fontSize = isHeader ? tableStyle.headerFontSize : tableStyle.fontSize;
      const values = Array.from({ length: columnCount }, (_, index) => row[index] || '');
      const wrappedCells = values.map((value, index) => wrapRichText(
        doc,
        value,
        columnWidths[index] - tableStyle.padding * 2,
        fontSize,
        isHeader,
      ));
      const rowHeight = Math.max(...wrappedCells.map((cell) => cell.length), 1) * tableStyle.lineHeight + tableStyle.padding * 2;

      if (y + rowHeight > pageHeight - pageBottom) {
        addPage();
        if (!isHeader) drawRow(rows[0], true);
      }

      let cellX = margin;
      doc.setDrawColor(...tableStyle.borderColor);
      wrappedCells.forEach((cellLines, index) => {
        const cellWidth = columnWidths[index];
        if (isHeader) {
          doc.setFillColor(...tableStyle.headerFill);
          doc.rect(cellX, y, cellWidth, rowHeight, 'FD');
        } else {
          doc.rect(cellX, y, cellWidth, rowHeight, 'S');
        }
        drawRichLines(
          doc,
          cellLines,
          cellX + tableStyle.padding,
          y + tableStyle.padding + fontSize,
          fontSize,
          tableStyle.lineHeight,
          cellWidth - tableStyle.padding * 2,
          false,
        );
        cellX += cellWidth;
      });
      y += rowHeight;
    };

    drawRow(rows[0], true);
    rows.slice(1).forEach((row) => drawRow(row));
    y += tableStyle.after;
  };

  startPage(true);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const sourceIndent = line.match(/^\s*/)?.[0].length ?? 0;
    const contentLine = line.trim();
    const listIndent = Math.floor(sourceIndent / 4) * 14;
    const bulletMarker = contentLine.match(/^(?:[-*+]+\s+|o(?:\s+|$))/i)?.[0] || '';
    if (isPageBreak(contentLine)) {
      addPage();
    } else if (contentLine.startsWith('# ')) {
      if (showDocumentTitle) addParagraph(contentLine.slice(2), { ...markdownPdfStyle.h1, bold: true, justify: false });
    } else if (contentLine.startsWith('## ')) {
      addParagraph(contentLine.slice(3), { ...markdownPdfStyle.h2, bold: true, justify: false });
    } else if (contentLine.startsWith('### ')) {
      addParagraph(contentLine.slice(4), { ...markdownPdfStyle.h3, bold: true, justify: false });
    } else if (bulletMarker) {
      const bulletText = contentLine.slice(bulletMarker.length).replace(/^o\s+/i, '');
      addParagraph(`• ${bulletText}`, {
        ...markdownPdfStyle.bullet,
        indent: listIndent + markdownPdfStyle.bullet.indent,
        justify: false,
      });
    } else if (isOrderedListItem(contentLine) || isLetteredListItem(contentLine)) {
      addParagraph(contentLine, {
        indent: listIndent,
        fontSize: markdownPdfStyle.body.fontSize,
        after: markdownPdfStyle.bullet.after,
        justify: false,
      });
    } else if (isTableRow(contentLine)) {
      const tableLines = [contentLine];
      while (index + 1 < lines.length && isTableRow(lines[index + 1].trim())) {
        index += 1;
        tableLines.push(lines[index].trim());
      }
      addTable(tableLines);
    } else if (contentLine === '---') {
      ensureSpace(markdownPdfStyle.rule.height);
      doc.setDrawColor(...markdownPdfStyle.rule.color);
      doc.line(margin, y, pageWidth - margin, y);
      y += markdownPdfStyle.rule.height;
    } else if (contentLine === '') {
      y += markdownPdfStyle.body.paragraphSpacing;
    } else if ((contentLine.match(/\*\*[^*]+:\*\*/g) || []).length >= 2) {
      ensureSpace(markdownPdfStyle.signature.height);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(markdownPdfStyle.signature.fontSize);
      const fields = [...contentLine.matchAll(/\*\*([^*]+):\*\*/g)].slice(0, 2).map((match) => `${match[1]}:`);
      const secondFieldX = margin + 230;
      doc.text(fields[0], margin, y);
      doc.line(margin + doc.getTextWidth(fields[0]) + 8, y + 2, secondFieldX - 24, y + 2);
      doc.text(fields[1], secondFieldX, y);
      doc.line(secondFieldX + doc.getTextWidth(fields[1]) + 8, y + 2, pageWidth - margin, y + 2);
      y += markdownPdfStyle.signature.height;
    } else if (/^If you feel you are being denied/i.test(contentLine)) {
      addParagraph(contentLine, { before: 12, after: 12 });
    } else if (contentLine.startsWith('**') && contentLine.includes(':**')) {
      addParagraph(contentLine, {
        ...markdownPdfStyle.field,
        after: 0,
      });
    } else {
      addParagraph(contentLine);
    }
  }

  doc.setProperties({
    title: metadata.title || path.basename(markdownPath, '.md'),
    author: 'HillTop Developmental Services',
  });
  await mkdir(path.dirname(pdfPath), { recursive: true });
  await writeFile(pdfPath, Buffer.from(doc.output('arraybuffer')));
  console.log(`Created ${pdfPath}`);
};

const isMainModule = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMainModule) {
  const markdownPath = path.resolve(process.argv[2] || defaultMarkdownPath);
  const pdfPath = path.resolve(process.argv[3] || defaultPdfPath);
  await renderMarkdownPdf(markdownPath, pdfPath);
}