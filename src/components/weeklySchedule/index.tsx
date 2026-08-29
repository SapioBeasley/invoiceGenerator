'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import clientsData from '@/data/clients.json';
import { getMonthDateRange } from '@/lib/activitySummary';
import { getScheduleEntriesForRange } from '@/lib/loggerData';
import { generateWeeklySchedulePDF } from '@/lib/weeklySchedulePdf';
import type { ClientData } from '@/types/documentGenerator';
import type { ScheduleEntry, WeeklyScheduleExportOptions } from '@/types/weeklySchedule';

const fallbackClients = clientsData as ClientData[];
const createId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const WeeklySchedule = () => {
  const [clients, setClients] = useState<ClientData[]>(fallbackClients);
  const [entries, setEntries] = useState<ScheduleEntry[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(fallbackClients[0]?.id ?? '');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [entryDate, setEntryDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [entryTime, setEntryTime] = useState('');
  const [location, setLocation] = useState('');
  const [purpose, setPurpose] = useState('');
  const [clientInput, setClientInput] = useState('');
  const [staff, setStaff] = useState('');
  const [additionalClients, setAdditionalClients] = useState('');
  const [pickupDropoff, setPickupDropoff] = useState('');
  const [copyNotes, setCopyNotes] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const dateRange = useMemo(() => getMonthDateRange(selectedMonth), [selectedMonth]);
  const monthEntries = useMemo(
    () => getScheduleEntriesForRange(entries, selectedClientId, dateRange),
    [dateRange, entries, selectedClientId],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/activity-data');
        if (!response.ok) throw new Error('Unable to load schedule data.');
        const data = (await response.json()) as {
          clients?: ClientData[];
          scheduleEntries?: ScheduleEntry[];
        };
        if (data.clients?.length) {
          setClients(data.clients);
          setSelectedClientId((current) => data.clients?.some((client) => client.id === current)
            ? current
            : data.clients?.[0]?.id ?? '');
        }
        setEntries(data.scheduleEntries ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load schedule data.');
      }
    };
    void loadData();
  }, []);

  const handleAddEntry = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClient || !entryDate || (!entryTime && !location && !purpose && !clientInput)) return;
    setIsSaving(true);
    setError('');
    const payload = {
      type: 'schedule',
      id: createId(),
      clientId: selectedClient.id,
      date: entryDate,
      time: entryTime,
      location,
      purpose,
      clientInput,
      staff,
    };
    try {
      const response = await fetch('/api/activity-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await response.json()) as { entry?: ScheduleEntry; error?: string };
      if (!response.ok || !data.entry) throw new Error(data.error ?? 'Unable to save schedule entry.');
      setEntries((current) => [data.entry as ScheduleEntry, ...current]);
      setEntryTime('');
      setLocation('');
      setPurpose('');
      setClientInput('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save schedule entry.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch('/api/activity-data', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'schedule', id }),
    });
    if (response.ok) setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const handleDownload = () => {
    if (!selectedClient) return;
    const options: WeeklyScheduleExportOptions = {
      additionalClients: additionalClients.split(',').map((value) => value.trim()).filter(Boolean),
      pickupDropoff: pickupDropoff.split(',').map((value) => value.trim()),
      copyNotes,
    };
    generateWeeklySchedulePDF(selectedClient, monthEntries, dateRange, options);
  };

  if (!selectedClient) return <p className='text-gray-600'>No clients are available.</p>;

  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Weekly Schedule Logger</h1>
        <p className='mt-2 text-gray-600'>Log each schedule activity as it happens, then export a month of weekly pages.</p>
        {error && <p className='mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      </div>

      <Card>
        <CardHeader><CardTitle>Log schedule activity</CardTitle><CardDescription>Each submission saves one dated schedule row for the selected client.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleAddEntry} className='space-y-5'>
            <div className='grid gap-4 md:grid-cols-3'>
              <div><Label htmlFor='scheduleClient'>Client</Label><select id='scheduleClient' value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2'>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
              <div><Label htmlFor='scheduleDate'>Date</Label><Input id='scheduleDate' type='date' value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className='mt-2' required /></div>
              <div><Label htmlFor='scheduleTime'>Time</Label><Input id='scheduleTime' value={entryTime} onChange={(event) => setEntryTime(event.target.value)} placeholder='9:00 AM' className='mt-2' /></div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div><Label htmlFor='scheduleLocation'>Location</Label><Input id='scheduleLocation' value={location} onChange={(event) => setLocation(event.target.value)} className='mt-2' /></div>
              <div><Label htmlFor='scheduleStaff'>Staff</Label><Input id='scheduleStaff' value={staff} onChange={(event) => setStaff(event.target.value)} className='mt-2' /></div>
              <div><Label htmlFor='schedulePurpose'>Purpose</Label><Textarea id='schedulePurpose' value={purpose} onChange={(event) => setPurpose(event.target.value)} className='mt-2' /></div>
              <div><Label htmlFor='scheduleClientInput'>Client input</Label><Textarea id='scheduleClientInput' value={clientInput} onChange={(event) => setClientInput(event.target.value)} className='mt-2' /></div>
            </div>
            <Button type='submit' disabled={isSaving}><Plus /> {isSaving ? 'Saving…' : 'Save schedule entry'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Saved entries for {selectedClient.name}</CardTitle><CardDescription>{monthEntries.length} entries in the selected reporting period.</CardDescription></CardHeader>
        <CardContent>{monthEntries.length === 0 ? <p className='text-sm text-gray-500'>No schedule entries have been logged for this month.</p> : <div className='space-y-3'>{monthEntries.map((entry) => <div key={entry.id} className='flex items-start justify-between gap-3 rounded-md border p-4'><div className='text-sm'><p className='font-semibold'>{dayjs(entry.date).format('ddd, MMM D, YYYY')} {entry.time && `• ${entry.time}`}</p><p>{entry.location}{entry.purpose && ` • ${entry.purpose}`}</p>{entry.clientInput && <p className='text-gray-600'>{entry.clientInput}</p>}{entry.staff && <p className='text-gray-500'>Staff: {entry.staff}</p>}</div><Button type='button' variant='ghost' size='icon' onClick={() => void handleDelete(entry.id)} aria-label='Delete schedule entry'><Trash2 /></Button></div>)}</div>}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Export monthly PDF</CardTitle><CardDescription>These optional fields are printed on each weekly page and are not required for daily logging.</CardDescription></CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div><Label htmlFor='scheduleMonth'>Report month</Label><Input id='scheduleMonth' type='month' value={selectedMonth} onChange={(event) => { setSelectedMonth(event.target.value); setEntryDate(`${event.target.value}-01`); }} className='mt-2' /></div>
            <div><Label htmlFor='scheduleAdditionalClients'>Additional clients</Label><Input id='scheduleAdditionalClients' value={additionalClients} onChange={(event) => setAdditionalClients(event.target.value)} placeholder='Comma-separated names' className='mt-2' /></div>
            <div><Label htmlFor='schedulePickupDropoff'>Pickup/dropoff</Label><Input id='schedulePickupDropoff' value={pickupDropoff} onChange={(event) => setPickupDropoff(event.target.value)} placeholder='Comma-separated times' className='mt-2' /></div>
            <div><Label htmlFor='scheduleCopyNotes'>Copy notes</Label><Textarea id='scheduleCopyNotes' value={copyNotes} onChange={(event) => setCopyNotes(event.target.value)} className='mt-2' /></div>
          </div>
          <Button type='button' onClick={handleDownload}><Download /> Export monthly PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WeeklySchedule;