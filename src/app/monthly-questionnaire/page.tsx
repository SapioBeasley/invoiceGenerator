'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MonthlyQuestionnaire from '@/components/monthlyQuestionnaire';

export default function MonthlyQuestionnairePage() {
  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-6xl mx-auto mb-6'>
        <Link
          href='/'
          className='inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Dashboard
        </Link>
      </div>
      <MonthlyQuestionnaire />
    </div>
  );
}