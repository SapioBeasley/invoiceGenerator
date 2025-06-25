'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Download, FileText, Plus, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { autoTable } from 'jspdf-autotable';

dayjs.extend(utc);

const loadImageAsBase64 = (url: string) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous'; // Required if image is from a different origin
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx!.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

interface LineItem {
  serviceCode: string;
  date: string;
  description: string;
  time: number;
  rate: number;
  cost: number;
}

interface ClientDetails {
  name: string;
  address: string;
  uci: string;
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  clientDetails: ClientDetails;
  lineItems: LineItem[];
  notes?: string;
  logoUrl?: string;
}

const InvoiceGenerator = () => {
  // Types for our invoice data

  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    invoiceNumber: 'INV-001',
    invoiceDate: dayjs.utc().toISOString().split('T')[0],
    dueDate: dayjs.utc().add(30, 'days').toISOString().split('T')[0],
    clientDetails: {
      name: 'Client Name',
      address: '456 Client Ave\nClient City, State 67890',
      uci: '123XYZ',
    },
    lineItems: [],
    notes: 'Payment due within 30 days. Thank you for your business!',
  });

  const addLineItem = () => {
    setInvoiceData((prev) => ({
      ...prev,
      lineItems: [
        ...prev.lineItems,
        {
          serviceCode: '',
          date: dayjs.utc().toISOString().split('T')[0],
          description: '',
          time: 0,
          rate: 0,
          cost: 0,
        },
      ],
    }));
  };

  const removeLineItem = (index: number) => {
    setInvoiceData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index),
    }));
  };

  const updateLineItem = (
    index: number,
    field: keyof LineItem,
    value: string | number
  ) => {
    setInvoiceData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => {
        if (i === index) {
          const updated = { ...item, [field]: value };
          // Auto-calculate cost when time or rate changes
          if (field === 'time' || field === 'rate') {
            updated.cost = updated.time * updated.rate;
          }
          return updated;
        }
        return item;
      }),
    }));
  };

  const generatePDF = async (data: InvoiceData) => {
    data.logoUrl = '/logo.png';

    // Dynamic import to avoid SSR issues
    const jsPDF = (await import('jspdf')).default;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Colors
    const primaryColor = [41, 128, 185]; // Blue
    const secondaryColor = [52, 73, 94]; // Dark gray
    const lightGray = [236, 240, 241];

    // Helper function to add text with word wrapping
    const addWrappedText = (
      text: string,
      x: number,
      y: number,
      maxWidth: number,
      lineHeight = 6
    ) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y);
      return y + lines.length * lineHeight;
    };

    // Logo placeholder (you can replace this with actual logo loading)
    try {
      let logoBase64: string | null = null;

      if (data.logoUrl) {
        logoBase64 = (await loadImageAsBase64(data.logoUrl)) as string;
      }

      // Header with logo placeholder and business info
      doc.setFillColor(...[255, 255, 255]);
      doc.rect(0, 0, pageWidth, 50, 'F');

      if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 15, 10, 50, 30);
      }

      let yPosition = 20;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const businessLines = '3675 Glenrose Ave\nAltadena , Ca 91001'.split(
        '\n'
      );
      let businessY = 15;
      businessLines.forEach((line) => {
        doc.text(line, pageWidth - 15, businessY, { align: 'right' });
        businessY += 4;
      });

      yPosition = 50;

      // Invoice title and details
      doc.setTextColor(...secondaryColor);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth - 15, yPosition, { align: 'right' });

      yPosition += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - 15, yPosition, {
        align: 'right',
      });
      yPosition += 6;
      doc.text(
        `Date: ${dayjs.utc(data.invoiceDate).format('MM/DD/YYYY')}`,
        pageWidth - 15,
        yPosition,
        { align: 'right' }
      );
      yPosition += 6;
      doc.text(
        `Due Date: ${dayjs.utc(data.dueDate).format('MM/DD/YYYY')}`,
        pageWidth - 15,
        yPosition,
        { align: 'right' }
      );

      yPosition += 20;

      // Bill To section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text('BILL TO:', 15, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...secondaryColor);
      doc.text(data.clientDetails.name, 15, yPosition);

      yPosition += 6;
      doc.setFont('helvetica', 'normal');
      const clientLines = data.clientDetails.address.split('\n');
      clientLines.forEach((line) => {
        doc.text(line, 15, yPosition);
        yPosition += 4;
      });
      doc.text(`UCI# ${data.clientDetails.uci}`, 15, yPosition);

      // Line items table

      yPosition += 10;

      // Table rows
      doc.setTextColor(...secondaryColor);
      doc.setFont('helvetica', 'normal');

      autoTable(doc, {
        startY: yPosition,
        head: [
          ['Service Code', 'Date', 'Description', 'Hours', 'Rate', 'Amount'],
        ],
        body: data.lineItems.map((obj) =>
          Object.entries(obj).map(([key, value]) => {
            if (
              ['rate', 'cost', 'amount'].includes(key) &&
              typeof value === 'number'
            ) {
              return value.toFixed(2); // format as string with 2 decimal places
            }
            return String(value); // convert all other values to string
          })
        ),
      });

      yPosition += data.lineItems.length * 12 + 10;

      // Totals
      const subtotal = data.lineItems.reduce((sum, item) => sum + item.cost, 0);
      // const tax = subtotal * 0.1; // 10% tax example
      // const total = subtotal + tax;
      const total = subtotal;

      doc.setFont('helvetica', 'bold');
      const totalsX = pageWidth - 60;

      doc.text('Subtotal:', totalsX, yPosition);
      doc.text(`$${subtotal.toFixed(2)}`, pageWidth - 15, yPosition, {
        align: 'right',
      });
      yPosition += 8;

      // doc.text('Tax (10%):', totalsX, yPosition);
      // doc.text(`$${tax.toFixed(2)}`, pageWidth - 15, yPosition, {
      //   align: 'right',
      // });
      // yPosition += 8;

      doc.setFontSize(12);
      doc.setTextColor(...primaryColor);
      doc.text('TOTAL:', totalsX, yPosition);
      doc.text(`$${total.toFixed(2)}`, pageWidth - 15, yPosition, {
        align: 'right',
      });

      // Notes section
      if (data.notes) {
        yPosition += 20;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...secondaryColor);
        doc.text('Notes:', 15, yPosition);

        yPosition += 8;
        doc.setFont('helvetica', 'normal');
        addWrappedText(data.notes, 15, yPosition, pageWidth - 30);
      }

      // Footer
      const footerY = pageHeight - 20;
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(
        `${'310.853.0824'} | ${'info@hilltopconstructionservices.com'}`,
        pageWidth / 2,
        footerY,
        {
          align: 'center',
        }
      );

      doc.text('hilltopconstructionservices.com', pageWidth / 2, footerY + 4, {
        align: 'center',
      });

      // Save the PDF
      doc.save(`invoice-${data.invoiceNumber.toLowerCase()}.pdf`);
    } catch (error) {
      console.log('Logo loading failed:', error);
    }
  };

  const totalAmount = invoiceData.lineItems.reduce(
    (sum, item) => sum + item.cost,
    0
  );

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5' />
            Invoice Generator
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Invoice Details */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div>
              <Label htmlFor='invoiceNumber'>Invoice Number</Label>
              <Input
                id='invoiceNumber'
                value={invoiceData.invoiceNumber}
                onChange={(e) =>
                  setInvoiceData((prev) => ({
                    ...prev,
                    invoiceNumber: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor='invoiceDate'>Invoice Date</Label>
              <Input
                id='invoiceDate'
                type='date'
                value={invoiceData.invoiceDate}
                onChange={(e) =>
                  setInvoiceData((prev) => ({
                    ...prev,
                    invoiceDate: e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor='dueDate'>Due Date</Label>
              <Input
                id='dueDate'
                type='date'
                value={invoiceData.dueDate}
                onChange={(e) =>
                  setInvoiceData((prev) => ({
                    ...prev,
                    dueDate: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Client Details */}
          <div>
            <h3 className='text-lg font-semibold mb-3'>Client Details</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <Label htmlFor='clientName'>Client Name</Label>
                <Input
                  id='clientName'
                  value={invoiceData.clientDetails.name}
                  onChange={(e) =>
                    setInvoiceData((prev) => ({
                      ...prev,
                      clientDetails: {
                        ...prev.clientDetails,
                        name: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor='clientUCI'>Client UCI#</Label>
                <Input
                  id='clientUCI'
                  type='uci'
                  value={invoiceData.clientDetails.uci}
                  onChange={(e) =>
                    setInvoiceData((prev) => ({
                      ...prev,
                      clientDetails: {
                        ...prev.clientDetails,
                        uci: e.target.value,
                      },
                    }))
                  }
                />
              </div>
              <div className='md:col-span-2'>
                <Label htmlFor='clientAddress'>Client Address</Label>
                <Textarea
                  id='clientAddress'
                  value={invoiceData.clientDetails.address}
                  onChange={(e) =>
                    setInvoiceData((prev) => ({
                      ...prev,
                      clientDetails: {
                        ...prev.clientDetails,
                        address: e.target.value,
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          {/* Line Items */}
          <div>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='text-lg font-semibold'>Line Items</h3>
              <Button onClick={addLineItem} size='sm'>
                <Plus className='h-4 w-4 mr-2' />
                Add Item
              </Button>
            </div>

            <div className='space-y-4'>
              {invoiceData.lineItems.map((item, index) => (
                <div
                  key={index}
                  className='grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-lg'
                >
                  <div>
                    <Label>Service Code</Label>
                    <Input
                      value={item.serviceCode}
                      onChange={(e) =>
                        updateLineItem(index, 'serviceCode', e.target.value)
                      }
                      placeholder='SVC-001'
                    />
                  </div>
                  <div>
                    <Label>Date</Label>
                    <Input
                      type='date'
                      value={item.date}
                      onChange={(e) =>
                        updateLineItem(index, 'date', e.target.value)
                      }
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={item.description}
                      onChange={(e) =>
                        updateLineItem(index, 'description', e.target.value)
                      }
                      placeholder='Service description'
                    />
                  </div>
                  <div>
                    <Label>Hours</Label>
                    <Input
                      type='number'
                      step='0.5'
                      value={item.time}
                      onChange={(e) =>
                        updateLineItem(
                          index,
                          'time',
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label>Rate ($)</Label>
                    <Input
                      type='number'
                      step='0.01'
                      value={item.rate}
                      onChange={(e) =>
                        updateLineItem(
                          index,
                          'rate',
                          Number.parseFloat(e.target.value) || 0
                        )
                      }
                    />
                  </div>
                  <div className='flex items-end gap-2'>
                    <div className='flex-1'>
                      <Label>Cost ($)</Label>
                      <Input
                        value={item.cost.toFixed(2)}
                        readOnly
                        className='bg-gray-50'
                      />
                    </div>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => removeLineItem(index)}
                      className='mb-0'
                    >
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className='text-right mt-4'>
              <p className='text-lg font-semibold'>
                Total: ${totalAmount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor='notes'>Notes</Label>
            <Textarea
              id='notes'
              value={invoiceData.notes}
              onChange={(e) =>
                setInvoiceData((prev) => ({ ...prev, notes: e.target.value }))
              }
              placeholder='Payment terms, thank you message, etc.'
            />
          </div>

          {/* Generate PDF Button */}
          <div className='flex justify-center'>
            <Button
              onClick={() => generatePDF(invoiceData)}
              size='lg'
              className='w-full md:w-auto'
            >
              <Download className='h-4 w-4 mr-2' />
              Generate PDF Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceGenerator;
