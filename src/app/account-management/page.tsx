import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import AccountManagement from '@/components/accountManagement';
import { requirePageAccess } from '@/lib/authorization';

export default async function AccountManagementPage() {
  await requirePageAccess(true);

  return (
    <div className='min-h-screen bg-gray-50 p-8'>
      <div className='mx-auto mb-6 max-w-6xl'>
        <Link href='/' className='inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-900'>
          <ArrowLeft className='mr-2 h-4 w-4' />
          Back to Dashboard
        </Link>
      </div>
      <AccountManagement />
    </div>
  );
}