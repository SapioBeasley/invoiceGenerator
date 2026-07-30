'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import { ClipboardList, Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import clientsData from '@/data/clients.json';
import { getMonthDateRange } from '@/lib/activitySummary';
import { generateActivitySummaryPDF } from '@/lib/activitySummaryPdf';
import { ClientActivity } from '@/types/activitySummary';
import { ClientData } from '@/types/documentGenerator';

type ActivityClient = ClientData;

const initialClients = clientsData as ActivityClient[];
const defaultClientId = initialClients[0]?.id ?? '';

const createGoalValues = (goals: string[]): Record<string, string> =>
  Object.fromEntries(goals.map((goal) => [goal, '']));

const createActivityId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

interface ActivityApiData {
  clients: ActivityClient[];
  activities: ClientActivity[];
}

interface ActivityApiResponse {
  activity: ClientActivity;
}

const apiRequest = async <T,>(
  url: string,
  options?: RequestInit,
): Promise<T> => {
  const response = await fetch(url, options);
  const payload = (await response.json()) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || 'The request failed.');
  return payload;
};

const ActivitySummary = () => {
  const [clients, setClients] = useState<ActivityClient[]>(initialClients);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(defaultClientId);
  const [activityDate, setActivityDate] = useState(dayjs().format('YYYY-MM-DD'));
  const [activityDescription, setActivityDescription] = useState('');
  const [activityNotes, setActivityNotes] = useState('');
  const [goalValues, setGoalValues] = useState<Record<string, string>>(
    createGoalValues(initialClients[0]?.goals ?? []),
  );
  const [newGoal, setNewGoal] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(dayjs().format('YYYY-MM'));
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const selectedClient = clients.find((client) => client.id === selectedClientId);
  const dateRange = useMemo(() => getMonthDateRange(selectedMonth), [selectedMonth]);
  const clientActivities = useMemo(
    () =>
      activities
        .filter((activity) => activity.clientId === selectedClientId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [activities, selectedClientId],
  );

  useEffect(() => {
    const loadActivityData = async () => {
      try {
        const data = await apiRequest<ActivityApiData>('/api/activity-data');
        const nextSelectedClientId = data.clients.some(
          (client) => client.id === defaultClientId,
        )
          ? defaultClientId
          : data.clients[0]?.id ?? '';
        const nextSelectedClient = data.clients.find(
          (client) => client.id === nextSelectedClientId,
        );

        setClients(data.clients);
        setActivities(data.activities);
        setSelectedClientId(nextSelectedClientId);
        setGoalValues(createGoalValues(nextSelectedClient?.goals ?? []));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Unable to load activity data.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadActivityData();
  }, []);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((item) => item.id === clientId);
    setGoalValues(createGoalValues(client?.goals ?? []));
    setActivityDescription('');
    setActivityNotes('');
  };

  const handleAddGoal = async () => {
    const goal = newGoal.trim();
    if (!selectedClient || !goal || selectedClient.goals.includes(goal)) return;

    setIsSaving(true);
    setError('');
    try {
      await apiRequest('/api/activity-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'goal', clientId: selectedClient.id, goal }),
      });
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.id === selectedClient.id
            ? { ...client, goals: [...client.goals, goal] }
            : client,
        ),
      );
      setGoalValues((currentValues) => ({ ...currentValues, [goal]: '' }));
      setNewGoal('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the goal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveGoal = async (goalToRemove: string) => {
    if (!selectedClient) return;

    setIsSaving(true);
    setError('');
    try {
      await apiRequest('/api/activity-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'goal', clientId: selectedClient.id, goal: goalToRemove }),
      });
      setClients((currentClients) =>
        currentClients.map((client) =>
          client.id === selectedClient.id
            ? { ...client, goals: client.goals.filter((goal) => goal !== goalToRemove) }
            : client,
        ),
      );
      setGoalValues((currentValues) => {
        const nextValues = { ...currentValues };
        delete nextValues[goalToRemove];
        return nextValues;
      });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to remove the goal.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddActivity = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedClient || (!activityDescription.trim() && !Object.values(goalValues).some(Boolean))) {
      return;
    }

    const activity: ClientActivity = {
      id: createActivityId(),
      clientId: selectedClient.id,
      date: activityDate,
      activity: activityDescription.trim(),
      goalValues: { ...goalValues },
      notes: activityNotes.trim() || undefined,
    };

    setIsSaving(true);
    setError('');
    try {
      const result = await apiRequest<ActivityApiResponse>('/api/activity-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'activity', ...activity }),
      });
      setActivities((currentActivities) => [...currentActivities, result.activity]);
      setActivityDescription('');
      setActivityNotes('');
      setGoalValues(createGoalValues(selectedClient.goals));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the activity.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    setIsSaving(true);
    setError('');
    try {
      await apiRequest('/api/activity-data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'activity', id: activityId }),
      });
      setActivities((currentActivities) =>
        currentActivities.filter((activity) => activity.id !== activityId),
      );
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete the activity.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownload = () => {
    if (selectedClient) generateActivitySummaryPDF(selectedClient, activities, dateRange);
  };

  if (isLoading) {
    return <p className='text-gray-600'>Loading activity data…</p>;
  }

  if (!selectedClient) {
    return <p className='text-gray-600'>No clients are available.</p>;
  }

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900'>
          Individual Activity Data Summary
        </h1>
        <p className='mt-2 text-gray-600'>
          Track a client&apos;s goals and export a calendar-based summary form.
        </p>
        {error && (
          <p className='mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
            {error}
          </p>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client and goals</CardTitle>
          <CardDescription>
            Goals belong to the selected client and can be different for every client.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div>
            <Label htmlFor='activityClient'>Select client</Label>
            <select
              id='activityClient'
              value={selectedClientId}
              onChange={(event) => handleClientChange(event.target.value)}
              className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2'
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>

          <div className='rounded-md bg-gray-50 p-4 text-sm text-gray-600'>
            <span className='font-semibold text-gray-900'>{selectedClient.name}</span>
            <span className='mx-2'>•</span>
            UCI# {selectedClient.uciNumber}
          </div>

          <div className='space-y-3'>
            <Label>Tracked goals</Label>
            <div className='space-y-2'>
              {selectedClient.goals.map((goal) => (
                <div key={goal} className='flex items-center gap-2'>
                  <Input value={goal} readOnly aria-label={`Goal ${goal}`} />
                  <Button
                    type='button'
                    variant='outline'
                    size='icon'
                    onClick={() => handleRemoveGoal(goal)}
                    disabled={isSaving}
                    aria-label={`Remove ${goal}`}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
            </div>
            <div className='flex gap-2'>
              <Input
                value={newGoal}
                onChange={(event) => setNewGoal(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleAddGoal();
                  }
                }}
                placeholder='Add a goal for this client'
                aria-label='New goal'
              />
              <Button type='button' variant='outline' onClick={handleAddGoal} disabled={isSaving}>
                <Plus />
                Add goal
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Add activity</CardTitle>
          <CardDescription>
            Add one entry to this client&apos;s activity array. Use 0 and 1 to match the source form.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddActivity} className='space-y-5'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='activityDate'>Date</Label>
                <Input
                  id='activityDate'
                  type='date'
                  value={activityDate}
                  onChange={(event) => setActivityDate(event.target.value)}
                  className='mt-2'
                  required
                />
              </div>
              <div>
                <Label htmlFor='activityDescription'>Activity</Label>
                <Input
                  id='activityDescription'
                  value={activityDescription}
                  onChange={(event) => setActivityDescription(event.target.value)}
                  placeholder='Fitness walk — 50 minutes'
                  className='mt-2'
                />
              </div>
            </div>

            <div className='grid gap-4 md:grid-cols-3'>
              {selectedClient.goals.map((goal) => (
                <div key={goal}>
                  <Label htmlFor={`goal-${goal}`}>{goal}</Label>
                  <select
                    id={`goal-${goal}`}
                    value={goalValues[goal] ?? ''}
                    onChange={(event) =>
                      setGoalValues((currentValues) => ({
                        ...currentValues,
                        [goal]: event.target.value,
                      }))
                    }
                    className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2'
                  >
                    <option value=''>Not recorded</option>
                    <option value='0'>0</option>
                    <option value='1'>1</option>
                  </select>
                </div>
              ))}
            </div>

            <div>
              <Label htmlFor='activityNotes'>Notes</Label>
              <Textarea
                id='activityNotes'
                value={activityNotes}
                onChange={(event) => setActivityNotes(event.target.value)}
                placeholder='Optional notes about this activity'
                className='mt-2'
              />
            </div>

            <Button type='submit' disabled={isSaving}>
              <Plus />
              Add activity
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Saved activities</CardTitle>
          <CardDescription>
            Activities are saved in Neon Postgres and remain tied to {selectedClient.name}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clientActivities.length === 0 ? (
            <p className='text-sm text-gray-500'>No activities have been added yet.</p>
          ) : (
            <div className='space-y-3'>
              {clientActivities.map((activity) => {
                const recordedGoals = selectedClient.goals
                  .map((goal) => `${goal}: ${activity.goalValues[goal]}`)
                  .filter((value) => !value.endsWith(': '));
                return (
                  <div
                    key={activity.id}
                    className='flex flex-col gap-3 rounded-md border p-4 md:flex-row md:items-start md:justify-between'
                  >
                    <div className='space-y-1 text-sm'>
                      <p className='font-semibold text-gray-900'>
                        {dayjs(activity.date).format('dddd, MMMM D, YYYY')}
                      </p>
                      {activity.activity && <p>{activity.activity}</p>}
                      {recordedGoals.length > 0 && (
                        <p className='text-gray-600'>{recordedGoals.join(' • ')}</p>
                      )}
                      {activity.notes && <p className='text-gray-500'>{activity.notes}</p>}
                    </div>
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => handleDeleteActivity(activity.id)}
                      disabled={isSaving}
                      aria-label={`Delete activity from ${activity.date}`}
                    >
                      <Trash2 />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Download PDF</CardTitle>
          <CardDescription>
            Select a calendar month. Past months include every date in the month; the current
            month runs from the first through today.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex flex-col gap-4 md:flex-row md:items-end'>
            <div className='flex-1'>
              <Label htmlFor='reportMonth'>Report month</Label>
              <Input
                id='reportMonth'
                type='month'
                value={selectedMonth}
                onChange={(event) => setSelectedMonth(event.target.value)}
                className='mt-2'
              />
            </div>
            <Button type='button' variant='outline' onClick={() => setSelectedMonth(dayjs().format('YYYY-MM'))}>
              Use current month
            </Button>
            <Button type='button' onClick={handleDownload}>
              <Download />
              Download PDF
            </Button>
          </div>
          <p className='text-sm text-gray-500'>
            This download will contain {dayjs(dateRange.start).format('MMM D, YYYY')} through{' '}
            {dayjs(dateRange.end).format('MMM D, YYYY')}, including dates with no recorded activity.
          </p>
        </CardContent>
      </Card>

      <div className='flex items-center gap-2 text-sm text-gray-500'>
        <ClipboardList className='h-4 w-4' />
        Data is stored in Neon Postgres and is available across devices.
      </div>
    </div>
  );
};

export default ActivitySummary;