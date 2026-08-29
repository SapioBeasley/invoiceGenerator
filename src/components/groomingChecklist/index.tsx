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
import { generateGroomingChecklistPDF } from '@/lib/groomingChecklistPdf';
import { getGroomingEntriesForMonth, mergeGroomingEntries } from '@/lib/loggerData';
import type { ClientData } from '@/types/documentGenerator';
import type { GroomingEntry, GroomingExportOptions } from '@/types/groomingChecklist';

const defaultItems = [
  'Hair Combed', 'Teeth Brushed', 'Face and Hands Washed', 'Clean Shaven', 'Clean Smell',
  'Clean Shirt', 'Clean Pants', 'Coordinated Colors', 'Fastened Pants', 'Tied Shoes',
  'Weather Appropriate (Coat, Sweater)',
];
const clientsFallback = clientsData as ClientData[];
const createEntryId = (clientId: string, date: string, itemLabel: string): string =>
  `${clientId}-${date}-${itemLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

const GroomingChecklist = () => {
  const [clients, setClients] = useState<ClientData[]>(clientsFallback);
  const [entries, setEntries] = useState<GroomingEntry[]>([]);
  const [itemLabels, setItemLabels] = useState(defaultItems);
  const [selectedClientId, setSelectedClientId] = useState(clientsFallback[0]?.id ?? '');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [exportMonth, setExportMonth] = useState(dayjs().format('YYYY-MM'));
  const [entryDate, setEntryDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [ratings, setRatings] = useState<Record<string, string>>({});
  const [task, setTask] = useState('Grooming Checklist');
  const [ratingMethod, setRatingMethod] = useState('“1” = complete upon arrival\n“0” = not completed upon arrival');
  const [barriers, setBarriers] = useState('');
  const [newItem, setNewItem] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const monthEntries = useMemo(
    () => getGroomingEntriesForMonth(entries, selectedClientId, selectedMonth),
    [entries, selectedClientId, selectedMonth],
  );
  const exportEntries = useMemo(
    () => getGroomingEntriesForMonth(entries, selectedClientId, exportMonth),
    [entries, exportMonth, selectedClientId],
  );

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch('/api/activity-data');
        if (!response.ok) throw new Error('Unable to load grooming data.');
        const data = (await response.json()) as { clients?: ClientData[]; groomingEntries?: GroomingEntry[] };
        if (data.clients?.length) {
          setClients(data.clients);
          setSelectedClientId((current) => data.clients?.some((client) => client.id === current) ? current : data.clients?.[0]?.id ?? '');
        }
        setEntries(data.groomingEntries ?? []);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load grooming data.');
      }
    };
    void loadData();
  }, []);

  const handleAddRating = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClient || !entryDate) return;
    const payloadEntries = Object.entries(ratings)
      .filter(([, rating]) => rating.trim())
      .map(([itemLabel, rating]) => ({ id: createEntryId(selectedClient.id, entryDate, itemLabel), itemLabel, rating }));
    if (payloadEntries.length === 0) return;
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch('/api/activity-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'grooming', clientId: selectedClient.id, date: entryDate, entries: payloadEntries }),
      });
      const data = (await response.json()) as { entries?: GroomingEntry[]; error?: string };
      if (!response.ok || !data.entries) throw new Error(data.error ?? 'Unable to save grooming ratings.');
      setEntries((current) => mergeGroomingEntries(current, data.entries as GroomingEntry[]));
      setRatings({});
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save grooming ratings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    const response = await fetch('/api/activity-data', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'grooming', id }) });
    if (response.ok) setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const handleAddItem = () => {
    const label = newItem.trim();
    if (label && !itemLabels.includes(label)) setItemLabels((current) => [...current, label]);
    setNewItem('');
  };

  const handleDownload = () => {
    if (!selectedClient) return;
    const options: GroomingExportOptions = { task, ratingMethod, barriersToProgress: barriers };
    generateGroomingChecklistPDF(selectedClient, exportEntries, exportMonth, options);
  };

  if (!selectedClient) return <p className='text-gray-600'>No clients are available.</p>;

  return (
    <div className='mx-auto max-w-6xl space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Grooming Checklist Logger</h1>
        <p className='mt-2 text-gray-600'>Record grooming ratings for a date, then export a monthly summary.</p>
        {error && <p className='mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      </div>

      <Card>
        <CardHeader><CardTitle>Log grooming activity</CardTitle><CardDescription>Choose 1, 0, or another rating for any items completed or observed on this date.</CardDescription></CardHeader>
        <CardContent>
          <form onSubmit={handleAddRating} className='space-y-5'>
            <div className='grid gap-4 md:grid-cols-3'>
              <div><Label htmlFor='groomingClient'>Client</Label><select id='groomingClient' value={selectedClientId} onChange={(event) => setSelectedClientId(event.target.value)} className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2'>{clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}</select></div>
              <div><Label htmlFor='groomingDate'>Date</Label><Input id='groomingDate' type='date' value={entryDate} onChange={(event) => setEntryDate(event.target.value)} className='mt-2' required /></div>
              <div><Label htmlFor='groomingMonth'>Report month</Label><Input id='groomingMonth' type='month' value={selectedMonth} onChange={(event) => { setSelectedMonth(event.target.value); setEntryDate(`${event.target.value}-01`); }} className='mt-2' /></div>
            </div>
            <div className='grid gap-3 sm:grid-cols-2 md:grid-cols-3'>
              {itemLabels.map((label) => <div key={label}><Label htmlFor={`grooming-${label}`}>{label}</Label><select id={`grooming-${label}`} value={ratings[label] ?? ''} onChange={(event) => setRatings((current) => ({ ...current, [label]: event.target.value }))} className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2'><option value=''>Not recorded</option><option value='1'>1</option><option value='0'>0</option></select></div>)}
            </div>
            <div className='flex gap-2'><Input value={newItem} onChange={(event) => setNewItem(event.target.value)} placeholder='Add checklist item' aria-label='New checklist item' /><Button type='button' variant='outline' onClick={handleAddItem}><Plus /> Add item</Button></div>
            <Button type='submit' disabled={isSaving}><Plus /> {isSaving ? 'Saving…' : 'Save ratings for this date'}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Saved ratings for {selectedClient.name}</CardTitle><CardDescription>{monthEntries.length} ratings in {dayjs(`${selectedMonth}-01`).format('MMMM YYYY')}.</CardDescription></CardHeader>
        <CardContent>{monthEntries.length === 0 ? <p className='text-sm text-gray-500'>No grooming ratings have been logged for this month.</p> : <div className='space-y-2'>{monthEntries.map((entry) => <div key={entry.id} className='flex items-center justify-between rounded-md border p-3 text-sm'><span><strong>{dayjs(entry.date).format('ddd, MMM D')}</strong> • {entry.itemLabel}: {entry.rating}</span><Button type='button' variant='ghost' size='icon' onClick={() => void handleDelete(entry.id)} aria-label='Delete grooming rating'><Trash2 /></Button></div>)}</div>}</CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Export monthly PDF</CardTitle><CardDescription>Choose any month to export its saved ratings. This selector is independent of the date used for the next log entry.</CardDescription></CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid gap-4 md:grid-cols-3'><div><Label htmlFor='groomingExportMonth'>Export month</Label><Input id='groomingExportMonth' type='month' value={exportMonth} onChange={(event) => setExportMonth(event.target.value)} className='mt-2' required /></div><div><Label htmlFor='groomingTask'>Task</Label><Input id='groomingTask' value={task} onChange={(event) => setTask(event.target.value)} className='mt-2' /></div><div><Label htmlFor='groomingRatingMethod'>Rating method</Label><Textarea id='groomingRatingMethod' value={ratingMethod} onChange={(event) => setRatingMethod(event.target.value)} className='mt-2' /></div></div>
          <div><Label htmlFor='groomingBarriers'>Barriers to progress</Label><Textarea id='groomingBarriers' value={barriers} onChange={(event) => setBarriers(event.target.value)} className='mt-2' /></div>
          <p className='text-sm text-gray-500'>{exportEntries.length} saved ratings will be included for {dayjs(`${exportMonth}-01`).format('MMMM YYYY')}.</p>
          <Button type='button' onClick={handleDownload}><Download /> Export monthly PDF</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroomingChecklist;