import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BehavioralAssessment from '@/components/behavioralAssessment';
import { requirePageAccess } from '@/lib/authorization';

export default async function BehavioralAssessmentPage() {
  await requirePageAccess(true);

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='max-w-5xl mx-auto mb-6'>
        <Link
          href='/'
          className='inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors'
        >
          <ArrowLeft className='w-4 h-4 mr-2' />
          Back to Dashboard
        </Link>
      </div>
      <BehavioralAssessment />
    </div>
  );
}