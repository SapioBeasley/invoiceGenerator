'use client';

import { useState } from 'react';
import { Download, Files, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { referencePdfRanges, ReferencePdfRange } from '@/lib/referencePdf';

const ReferencePdfs = () => {
  const [workingId, setWorkingId] = useState('');
  const [error, setError] = useState('');

  const getPdfUrl = async (range: ReferencePdfRange): Promise<string> => {
    const directory = range.directory ?? 'generated';
    const response = await fetch(`/reference-pdfs/${directory}/${range.filename}`);
    if (!response.ok) throw new Error('Unable to load the HillTop-branded PDF.');
    return URL.createObjectURL(await response.blob());
  };

  const handleDownload = async (range: ReferencePdfRange) => {
    setWorkingId(`${range.id}-download`);
    setError('');
    try {
      const url = await getPdfUrl(range);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = range.filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : 'Unable to create the PDF.');
    } finally {
      setWorkingId('');
    }
  };

  const handlePrint = async (range: ReferencePdfRange) => {
    setWorkingId(`${range.id}-print`);
    setError('');
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      setError('Allow pop-ups to print this PDF.');
      setWorkingId('');
      return;
    }

    try {
      const url = await getPdfUrl(range);
      printWindow.document.write('<title>Print PDF</title><iframe id="pdf-frame" style="width:100%;height:100%;border:0"></iframe>');
      printWindow.document.close();
      const frame = printWindow.document.getElementById('pdf-frame') as HTMLIFrameElement | null;
      if (frame) {
        frame.onload = () => frame.contentWindow?.print();
        frame.src = url;
      }
    } catch (printError) {
      printWindow.close();
      setError(printError instanceof Error ? printError.message : 'Unable to prepare the PDF for printing.');
    } finally {
      setWorkingId('');
    }
  };

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Reference PDFs</h1>
        <p className='mt-2 text-gray-600'>Download or print HillTop-branded grouped documents from the HDS reference packets.</p>
        {error && <p className='mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        {referencePdfRanges.map((range) => (
          <Card key={range.id} className='flex h-full flex-col'>
            <CardHeader>
              <Files className='mb-2 h-6 w-6 text-blue-600' />
              <CardTitle>{range.title}</CardTitle>
              <CardDescription>{range.description}</CardDescription>
            </CardHeader>
            <CardContent className='mt-auto space-y-3'>
              <p className='text-sm font-medium text-gray-700'>Pages {range.pages.join('–')}</p>
              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  onClick={() => handleDownload(range)}
                  disabled={workingId !== ''}
                >
                  <Download /> Download
                </Button>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => handlePrint(range)}
                  disabled={workingId !== ''}
                >
                  <Printer /> Print
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReferencePdfs;