'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import clientsData from '@/data/clients.json';
import { generateGroomingChecklistPDF } from '@/lib/groomingChecklistPdf';
import { ClientData } from '@/types/documentGenerator';
import { GroomingChecklistData } from '@/types/groomingChecklist';

const fallbackClients = clientsData as ClientData[];
const defaultItems = [
  'Hair Combed',
  'Teeth Brushed',
  'Face and Hands Washed',
  'Clean Shaven',
  'Clean Smell',
  'Clean Shirt',
  'Clean Pants',
  'Coordinated Colors',
  'Fastened Pants',
  'Tied Shoes',
  'Weather Appropriate (Coat, Sweater)',
];

const defaultDates = (month: string): string[] => {
  const start = dayjs(`${month}-01`);
  return [0, 3, 7, 10, 17, 20].map((offset) =>
    start.add(offset, 'day').format('YYYY-MM-DD'),
  );
};

const createInitialForm = (client: ClientData): GroomingChecklistData => {
  const month = dayjs().format('YYYY-MM');
  const dates = defaultDates(month);
  return {
    clientId: client.id,
    clientName: client.name,
    task: 'Grooming Checklist',
    month,
    ratingMethod: '“1” = complete upon arrival\n“0” = not completed upon arrival',
    dates,
    items: defaultItems.map((label) => ({ label, ratings: {} })),
    barriersToProgress: '',
  };
};

const GroomingChecklist = () => {
  const [clients, setClients] = useState<ClientData[]>(fallbackClients);
  const [form, setForm] = useState<GroomingChecklistData>(
    createInitialForm(fallbackClients[0]),
  );

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch('/api/activity-data');
        if (!response.ok) return;
        const data = (await response.json()) as { clients?: ClientData[] };
        if (!data.clients?.length) return;
        setClients(data.clients);
        const client = data.clients.find((item) => item.id === form.clientId) ?? data.clients[0];
        setForm((current) => ({ ...current, clientId: client.id, clientName: client.name }));
      } catch {
        // Keep the seeded client list available if the database is unavailable.
      }
    };

    void loadClients();
  }, [form.clientId]);

  const updateForm = <K extends keyof GroomingChecklistData>(
    field: K,
    value: GroomingChecklistData[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const handleClientChange = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    if (client) setForm((current) => ({ ...current, clientId: client.id, clientName: client.name }));
  };

  const updateItemLabel = (index: number, label: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index ? { ...item, label } : item,
      ),
    }));
  };

  const updateRating = (itemIndex: number, date: string, rating: string) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, index) =>
        index === itemIndex
          ? { ...item, ratings: { ...item.ratings, [date]: rating } }
          : item,
      ),
    }));
  };

  const addDate = () => {
    const date = dayjs().format('YYYY-MM-DD');
    setForm((current) => ({
      ...current,
      dates: [...current.dates, date],
    }));
  };

  const removeDate = (dateIndex: number) => {
    setForm((current) => ({
      ...current,
      dates: current.dates.filter((_, index) => index !== dateIndex),
    }));
  };

  const addItem = () => {
    setForm((current) => ({
      ...current,
      items: [...current.items, { label: '', ratings: {} }],
    }));
  };

  const removeItem = (itemIndex: number) => {
    setForm((current) => ({
      ...current,
      items: current.items.filter((_, index) => index !== itemIndex),
    }));
  };

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Grooming Checklist</h1>
        <p className='mt-2 text-gray-600'>Create a monthly Individual Data Summary checklist PDF.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary details</CardTitle>
          <CardDescription>Client name is the only dropdown. All other fields are editable.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-4 md:grid-cols-3'>
            <div>
              <Label htmlFor='checklistClient'>Client name</Label>
              <select
                id='checklistClient'
                value={form.clientId}
                onChange={(event) => handleClientChange(event.target.value)}
                className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2'
              >
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>{client.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor='checklistTask'>Task</Label>
              <Input id='checklistTask' value={form.task} onChange={(event) => updateForm('task', event.target.value)} className='mt-2' />
            </div>
            <div>
              <Label htmlFor='checklistMonth'>Month/Year</Label>
              <Input id='checklistMonth' type='month' value={form.month} onChange={(event) => updateForm('month', event.target.value)} className='mt-2' />
            </div>
          </div>

          <div>
            <Label htmlFor='ratingMethod'>Rating method</Label>
            <Textarea id='ratingMethod' value={form.ratingMethod} onChange={(event) => updateForm('ratingMethod', event.target.value)} className='mt-2' />
          </div>

          <div className='flex items-center justify-between'>
            <Label>Dates</Label>
            <Button type='button' variant='outline' size='sm' onClick={addDate}><Plus /> Add date</Button>
          </div>
          <div className='grid gap-2 sm:grid-cols-3 md:grid-cols-6'>
            {form.dates.map((date, index) => (
              <div key={`${date}-${index}`} className='flex items-center gap-1'>
                <Input type='date' value={date} onChange={(event) => setForm((current) => ({ ...current, dates: current.dates.map((item, dateIndex) => dateIndex === index ? event.target.value : item) }))} />
                <Button type='button' variant='ghost' size='icon' onClick={() => removeDate(index)} aria-label={`Remove date ${date}`}><Trash2 /></Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <CardTitle>Checklist ratings</CardTitle>
              <CardDescription>Enter 1, 0, or any editable rating for each date.</CardDescription>
            </div>
            <Button type='button' variant='outline' size='sm' onClick={addItem}><Plus /> Add item</Button>
          </div>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full min-w-[760px] border-collapse text-sm'>
            <thead>
              <tr className='bg-blue-600 text-left text-white'>
                <th className='border p-2'>Date: Month/Day</th>
                {form.dates.map((date, index) => <th key={`${date}-head-${index}`} className='border p-2'>{dayjs(date).format('M/D')}</th>)}
                <th className='border p-2'>Remove</th>
              </tr>
            </thead>
            <tbody>
              {form.items.map((item, itemIndex) => (
                <tr key={`item-${itemIndex}`}>
                  <td className='border p-2'><Input value={item.label} onChange={(event) => updateItemLabel(itemIndex, event.target.value)} /></td>
                  {form.dates.map((date, dateIndex) => <td key={`${date}-${dateIndex}`} className='border p-2'><Input value={item.ratings[date] ?? ''} onChange={(event) => updateRating(itemIndex, date, event.target.value)} aria-label={`${item.label} ${date}`} /></td>)}
                  <td className='border p-2'><Button type='button' variant='ghost' size='icon' onClick={() => removeItem(itemIndex)} aria-label={`Remove ${item.label}`}><Trash2 /></Button></td>
                </tr>
              ))}
              <tr className='bg-gray-100 font-semibold'>
                <td className='border p-2'>Totals:</td>
                {form.dates.map((date, index) => <td key={`total-${date}-${index}`} className='border p-2'>{form.items.filter((item) => item.ratings[date]?.trim() === '1').length}</td>)}
                <td className='border p-2' />
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Barriers to progress</CardTitle></CardHeader>
        <CardContent className='space-y-4'>
          <Textarea value={form.barriersToProgress} onChange={(event) => updateForm('barriersToProgress', event.target.value)} className='min-h-[180px]' placeholder='Describe barriers to progress for the month.' />
          <Button type='button' onClick={() => generateGroomingChecklistPDF(form)}><Download /> Download Grooming Checklist PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroomingChecklist;