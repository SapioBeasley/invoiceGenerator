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
import { generateWeeklySchedulePDF } from '@/lib/weeklySchedulePdf';
import { ClientData } from '@/types/documentGenerator';
import { WeeklyScheduleData, WeeklyScheduleEntry } from '@/types/weeklySchedule';

const fallbackClients = clientsData as ClientData[];

const createEntry = (date: string, time: string): WeeklyScheduleEntry => ({
  date,
  time,
  location: '',
  purpose: '',
  clientInput: '',
});

const createInitialForm = (client: ClientData): WeeklyScheduleData => {
  const firstDay = dayjs().startOf('week').add(1, 'day');
  return {
    primaryClientId: client.id,
    primaryClientName: client.name,
    additionalClients: [],
    staff: '',
    firstDayOfWeek: firstDay.format('YYYY-MM-DD'),
    weekLabel: 'Week 3',
    pickupDropoff: ['', '', ''],
    copyNotes: 'Keep it brief and short. Highlight one thing on each client. Describe client interactions, body language, thoughts, dialogue, personality, interests, actions, or responses.',
    entries: [
      createEntry(firstDay.format('YYYY-MM-DD'), '9:00 AM'),
      createEntry(firstDay.format('YYYY-MM-DD'), '10:00 AM'),
      createEntry(firstDay.format('YYYY-MM-DD'), '11:00 AM'),
      createEntry(firstDay.format('YYYY-MM-DD'), '12:00 PM'),
      createEntry(firstDay.add(1, 'day').format('YYYY-MM-DD'), '9:00 AM'),
      createEntry(firstDay.add(1, 'day').format('YYYY-MM-DD'), '10:00 AM'),
      createEntry(firstDay.add(1, 'day').format('YYYY-MM-DD'), '11:00 AM'),
      createEntry(firstDay.add(1, 'day').format('YYYY-MM-DD'), '12:00 PM'),
    ],
  };
};

const WeeklySchedule = () => {
  const [clients, setClients] = useState<ClientData[]>(fallbackClients);
  const [form, setForm] = useState<WeeklyScheduleData>(createInitialForm(fallbackClients[0]));

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch('/api/activity-data');
        if (!response.ok) return;
        const data = (await response.json()) as { clients?: ClientData[] };
        if (!data.clients?.length) return;
        setClients(data.clients);
        const client = data.clients.find((item) => item.id === form.primaryClientId) ?? data.clients[0];
        setForm((current) => ({ ...current, primaryClientId: client.id, primaryClientName: client.name }));
      } catch {
        // Keep the seeded client list available if the database is unavailable.
      }
    };

    void loadClients();
  }, [form.primaryClientId]);

  const updateForm = <K extends keyof WeeklyScheduleData>(
    field: K,
    value: WeeklyScheduleData[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const updateEntry = (index: number, field: keyof WeeklyScheduleEntry, value: string) => {
    setForm((current) => ({
      ...current,
      entries: current.entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, [field]: value } : entry,
      ),
    }));
  };

  const addEntry = () => {
    setForm((current) => ({
      ...current,
      entries: [...current.entries, createEntry(current.firstDayOfWeek, '')],
    }));
  };

  const removeEntry = (index: number) => {
    setForm((current) => ({
      ...current,
      entries: current.entries.filter((_, entryIndex) => entryIndex !== index),
    }));
  };

  const updateArrayField = (field: 'additionalClients' | 'pickupDropoff', index: number, value: string) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  };

  const addAdditionalClient = () => {
    setForm((current) =>
      current.additionalClients.length < 2
        ? { ...current, additionalClients: [...current.additionalClients, ''] }
        : current,
    );
  };

  const removeAdditionalClient = (index: number) => {
    setForm((current) => ({
      ...current,
      additionalClients: current.additionalClients.filter((_, clientIndex) => clientIndex !== index),
    }));
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    if (client) setForm((current) => ({ ...current, primaryClientId: client.id, primaryClientName: client.name }));
  };

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Weekly Schedule</h1>
        <p className='mt-2 text-gray-600'>Create an editable weekly schedule based on page 9.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schedule details</CardTitle>
          <CardDescription>Primary client name is the only dropdown. All other fields are editable.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-4 md:grid-cols-4'>
            <div>
              <Label htmlFor='scheduleClient'>Primary client</Label>
              <select id='scheduleClient' value={form.primaryClientId} onChange={(event) => handleClientChange(event.target.value)} className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2'>
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div><Label htmlFor='scheduleStaff'>Staff</Label><Input id='scheduleStaff' value={form.staff} onChange={(event) => updateForm('staff', event.target.value)} className='mt-2' /></div>
            <div><Label htmlFor='scheduleFirstDay'>First day of work week</Label><Input id='scheduleFirstDay' type='date' value={form.firstDayOfWeek} onChange={(event) => updateForm('firstDayOfWeek', event.target.value)} className='mt-2' /></div>
            <div><Label htmlFor='scheduleWeek'>Week label</Label><Input id='scheduleWeek' value={form.weekLabel} onChange={(event) => updateForm('weekLabel', event.target.value)} className='mt-2' /></div>
          </div>

          <div>
            <div className='mb-2 flex items-center justify-between gap-4'>
              <Label>Additional clients ({form.additionalClients.length + 1}/3 total)</Label>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addAdditionalClient}
                disabled={form.additionalClients.length >= 2}
              >
                <Plus /> Add additional client
              </Button>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              {form.additionalClients.map((client, index) => (
                <div key={`client-${index}`} className='flex items-end gap-2'>
                  <div className='flex-1'>
                    <Label htmlFor={`additional-client-${index}`}>Additional client {index + 1}</Label>
                    <Input id={`additional-client-${index}`} value={client} onChange={(event) => updateArrayField('additionalClients', index, event.target.value)} className='mt-2' />
                  </div>
                  <Button type='button' variant='ghost' size='icon' onClick={() => removeAdditionalClient(index)} aria-label={`Remove additional client ${index + 1}`}><Trash2 /></Button>
                </div>
              ))}
            </div>
          </div>

          <div className='grid gap-4 md:grid-cols-3'>
            {form.pickupDropoff.map((value, index) => <div key={`pickup-${index}`}><Label htmlFor={`pickup-${index}`}>Pickup/Dropoff {index + 1}</Label><Input id={`pickup-${index}`} value={value} onChange={(event) => updateArrayField('pickupDropoff', index, event.target.value)} className='mt-2' placeholder='8:00 / 2:00' /></div>)}
          </div>

          <div><Label htmlFor='scheduleCopyNotes'>Copy notes</Label><Textarea id='scheduleCopyNotes' value={form.copyNotes} onChange={(event) => updateForm('copyNotes', event.target.value)} className='mt-2' /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div className='flex items-center justify-between gap-4'><div><CardTitle>Daily schedule entries</CardTitle><CardDescription>Enter one row for each time, location, purpose, and client input.</CardDescription></div><Button type='button' variant='outline' size='sm' onClick={addEntry}><Plus /> Add row</Button></div></CardHeader>
        <CardContent className='overflow-x-auto'>
          <table className='w-full min-w-[900px] border-collapse text-sm'>
            <thead><tr className='bg-blue-600 text-left text-white'><th className='border p-2'>Date</th><th className='border p-2'>Time</th><th className='border p-2'>Location</th><th className='border p-2'>Purpose</th><th className='border p-2'>Client input (use names)</th><th className='border p-2'>Remove</th></tr></thead>
            <tbody>{form.entries.map((entry, index) => <tr key={`entry-${index}`}><td className='border p-2'><Input type='date' value={entry.date} onChange={(event) => updateEntry(index, 'date', event.target.value)} /></td><td className='border p-2'><Input value={entry.time} onChange={(event) => updateEntry(index, 'time', event.target.value)} placeholder='9:00 AM' /></td><td className='border p-2'><Input value={entry.location} onChange={(event) => updateEntry(index, 'location', event.target.value)} /></td><td className='border p-2'><Textarea value={entry.purpose} onChange={(event) => updateEntry(index, 'purpose', event.target.value)} /></td><td className='border p-2'><Textarea value={entry.clientInput} onChange={(event) => updateEntry(index, 'clientInput', event.target.value)} /></td><td className='border p-2'><Button type='button' variant='ghost' size='icon' onClick={() => removeEntry(index)} aria-label={`Remove schedule row ${index + 1}`}><Trash2 /></Button></td></tr>)}</tbody>
          </table>
          <Button type='button' className='mt-5' onClick={() => generateWeeklySchedulePDF(form)}><Download /> Download Weekly Schedule PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklySchedule;