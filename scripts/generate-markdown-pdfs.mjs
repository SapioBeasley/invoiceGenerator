import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';
import { renderMarkdownPdf } from './generate-markdown-pdf.mjs';

const markdownDirectory = path.resolve('public/reference-pdfs/markdown');
const outputDirectory = path.resolve('public/reference-pdfs/generated');

await mkdir(outputDirectory, { recursive: true });
const markdownFiles = (await readdir(markdownDirectory))
  .filter((fileName) => fileName.endsWith('.md'))
  .sort();

for (const markdownFile of markdownFiles) {
  const markdownPath = path.join(markdownDirectory, markdownFile);
  const pdfPath = path.join(outputDirectory, markdownFile.replace(/\.md$/, '.pdf'));
  await renderMarkdownPdf(markdownPath, pdfPath);
}

console.log(`Generated ${markdownFiles.length} PDFs in ${outputDirectory}`);