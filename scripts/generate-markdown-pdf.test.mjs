import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { PDFDocument } from 'pdf-lib';
import { parseDocument, renderMarkdownPdf, reflowMarkdownLines } from './generate-markdown-pdf.mjs';

test('reflows hard-wrapped Markdown paragraphs into full-width text', () => {
  const { lines } = parseDocument([
    '---',
    'title: test',
    '---',
    '# Heading',
    '',
    'The first line of the paragraph',
    'continues on the next source line.',
  ].join('\n'));

  assert.deepEqual(reflowMarkdownLines(lines), [
    '# Heading',
    '',
    'The first line of the paragraph continues on the next source line.',
  ]);
});

test('keeps wrapped numbered items in a single paragraph', () => {
  assert.deepEqual(reflowMarkdownLines([
    '1. Job Coaches will provide supervision and support to their clients in community',
    'settings during day program service hours. Supervision means that you can see them',
    'and get to them quickly to offer support and/or keep them safe.',
    '2. Clients will be supported to be as independent as possible.',
  ]), [
    '1. Job Coaches will provide supervision and support to their clients in community settings during day program service hours. Supervision means that you can see them and get to them quickly to offer support and/or keep them safe.',
    '2. Clients will be supported to be as independent as possible.',
  ]);
});

test('joins text after a standalone numbered marker', () => {
  assert.deepEqual(reflowMarkdownLines([
    '1.',
    'Maintain care and safety of consumers.',
    '2.',
    'Conduct annual preparedness training.',
  ]), [
    '1. Maintain care and safety of consumers.',
    '2. Conduct annual preparedness training.',
  ]);
});

test('keeps wrapped bullet items in a single paragraph', () => {
  assert.deepEqual(reflowMarkdownLines([
    '- Effective communication: from the person with ASD and to them by their',
    'caregivers. “PLEASE USE YOUR WORDS!” This gives people warning about what is about to happen,',
    'provides comfort and coping benefits and provides a functional alternative to severe conduct.',
  ]), [
    '- Effective communication: from the person with ASD and to them by their caregivers. “PLEASE USE YOUR WORDS!” This gives people warning about what is about to happen, provides comfort and coping benefits and provides a functional alternative to severe conduct.',
  ]);
});

test('preserves nested numeric, lettered, and bullet list structure', () => {
  assert.deepEqual(reflowMarkdownLines([
    '1. Main item',
    '    A. Lettered child',
    '        - Bullet child',
    '            -- Nested bullet child',
    '    B. Second lettered child',
  ]), [
    '1. Main item',
    '    A. Lettered child',
    '        - Bullet child',
    '            -- Nested bullet child',
    '    B. Second lettered child',
  ]);
});

test('allows a long paragraph to continue onto subsequent pages', async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), 'markdown-pdf-test-'));
  const markdownPath = path.join(temporaryDirectory, 'long-paragraph.md');
  const pdfPath = path.join(temporaryDirectory, 'long-paragraph.pdf');
  const paragraph = Array.from({ length: 180 }, (_, index) =>
    `Sentence ${index + 1} contains enough text to exercise natural paragraph wrapping and page flow.`,
  ).join(' ');

  try {
    await writeFile(markdownPath, [
      '---',
      'title: long paragraph',
      'format: letter-portrait',
      'logo: public/logo.png',
      '---',
      '',
      '# Long paragraph',
      '',
      paragraph,
    ].join('\n'));
    await renderMarkdownPdf(markdownPath, pdfPath);

    const pdf = await PDFDocument.load(await readFile(pdfPath));
    assert.ok(pdf.getPageCount() >= 3);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});