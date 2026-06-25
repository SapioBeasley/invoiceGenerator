'use client';

import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { FileText, FileSpreadsheet } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-5xl mx-auto space-y-8'>
        <div>
          <h1 className='text-4xl font-bold tracking-tight text-gray-900'>
            Admin Dashboard
          </h1>
          <p className='mt-2 text-lg text-gray-600'>
            Select a service to get started.
          </p>
        </div>

        <div className='grid md:grid-cols-2 gap-6'>
          <Link href='/invoice-generator' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-blue-100 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors'>
                    <FileSpreadsheet className='w-6 h-6' />
                  </div>
                  <CardTitle>Invoice Generator</CardTitle>
                </div>
                <CardDescription>
                  Create, edit, and manage client invoices dynamically.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-500'>
                  Access the invoice generator tool to build custom invoices,
                  add items, and export them.
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href='/document-generator' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-green-100 text-green-600 rounded-lg group-hover:bg-green-600 group-hover:text-white transition-colors'>
                    <FileText className='w-6 h-6' />
                  </div>
                  <CardTitle>Document Generator</CardTitle>
                </div>
                <CardDescription>
                  Automate and generate dynamic documents from templates.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-500'>
                  Access document templates like Individual Service Plans (ISP)
                  and Annual Progress Reports (APR).
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
