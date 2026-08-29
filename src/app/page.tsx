import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { CalendarDays, ClipboardCheck, ClipboardList, FileText, FileSpreadsheet, Files, ListChecks, MessageSquareText, Users } from 'lucide-react';
import AuthControls from '@/components/authControls';
import { requirePageAccess } from '@/lib/authorization';
import { getVisibleDashboardModules, type DashboardModuleKey } from '@/lib/dashboardModules';

export default async function AdminDashboard() {
  const { session, isAdmin } = await requirePageAccess();
  const visibleModules = getVisibleDashboardModules(isAdmin);
  const isModuleVisible = (module: DashboardModuleKey) => visibleModules.includes(module);

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

        <AuthControls email={session.user.email} />

        <div className='grid md:grid-cols-3 gap-6'>
          {isModuleVisible('invoice-generator') ? <Link href='/invoice-generator' className='block group'>
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
          </Link> : null}

          <Link href='/grooming-checklist' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-teal-100 text-teal-600 rounded-lg group-hover:bg-teal-600 group-hover:text-white transition-colors'>
                    <ListChecks className='w-6 h-6' />
                  </div>
                  <CardTitle>Grooming Checklist</CardTitle>
                </div>
                <CardDescription>
                  Complete a monthly client grooming checklist and export it.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-500'>
                  Edit checklist items, dates, ratings, and progress notes before downloading.
                </p>
              </CardContent>
            </Card>
          </Link>

          {isModuleVisible('monthly-questionnaire') ? <Link href='/monthly-questionnaire' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-indigo-100 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors'>
                    <MessageSquareText className='w-6 h-6' />
                  </div>
                  <CardTitle>Monthly Questionnaire</CardTitle>
                </div>
                <CardDescription>
                  Complete the page-six monthly questionnaire packet.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-500'>
                  Edit topics, prompts, answers, job coach, and month before downloading.
                </p>
              </CardContent>
            </Card>
          </Link> : null}

          <Link href='/weekly-schedule' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-cyan-100 text-cyan-600 rounded-lg group-hover:bg-cyan-600 group-hover:text-white transition-colors'>
                    <CalendarDays className='w-6 h-6' />
                  </div>
                  <CardTitle>Weekly Schedule</CardTitle>
                </div>
                <CardDescription>
                  Create a weekly schedule with daily activities and client notes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-500'>
                  Edit staff, pickup/drop-off, schedule rows, purposes, and client input.
                </p>
              </CardContent>
            </Card>
          </Link>

          {isModuleVisible('behavioral-assessment') ? <Link href='/behavioral-assessment' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-orange-100 text-orange-600 rounded-lg group-hover:bg-orange-600 group-hover:text-white transition-colors'>
                    <ClipboardCheck className='w-6 h-6' />
                  </div>
                  <CardTitle>ABC Behavioral Assessment</CardTitle>
                </div>
                <CardDescription>
                  Create the editable monthly behavioral assessment form.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-500'>
                  Select a client, complete the assessment fields, and download a PDF.
                </p>
              </CardContent>
            </Card>
          </Link> : null}

          <Link href='/activity-summary' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-purple-100 text-purple-600 rounded-lg group-hover:bg-purple-600 group-hover:text-white transition-colors'>
                    <ClipboardList className='w-6 h-6' />
                  </div>
                  <CardTitle>Activity Data Summary</CardTitle>
                </div>
                <CardDescription>
                  Track client-specific goals and download calendar-based PDFs.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-500'>
                  Add daily activities, manage goals, and export a full month or
                  the current month through today.
                </p>
              </CardContent>
            </Card>
          </Link>

          {isModuleVisible('account-management') ? <Link href='/account-management' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-rose-100 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors'>
                    <Users className='w-6 h-6' />
                  </div>
                  <CardTitle>Account Access</CardTitle>
                </div>
                <CardDescription>Manage allowed signup emails and account types.</CardDescription>
              </CardHeader>
              <CardContent><p className='text-sm text-gray-500'>Add users, review signup status, change roles, or remove signup access.</p></CardContent>
            </Card>
          </Link> : null}

          {isModuleVisible('reference-pdfs') ? <Link href='/reference-pdfs' className='block group'>
            <Card className='h-full transition-all hover:shadow-md hover:border-primary'>
              <CardHeader>
                <div className='flex items-center space-x-3 mb-2'>
                  <div className='p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-600 group-hover:text-white transition-colors'>
                    <Files className='w-6 h-6' />
                  </div>
                  <CardTitle>Reference PDFs</CardTitle>
                </div>
                <CardDescription>
                  Download or print selected HDS policy and staff documents.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-gray-500'>
                  Access grouped policy, training, and staff documents as separate PDFs.
                </p>
              </CardContent>
            </Card>
          </Link> : null}

          {isModuleVisible('document-generator') ? <Link href='/document-generator' className='block group'>
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
          </Link> : null}
        </div>
      </div>
    </div>
  );
}
