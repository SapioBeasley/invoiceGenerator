'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { ClipboardCheck, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import clientsData from '@/data/clients.json';
import { generateBehavioralAssessmentPDF } from '@/lib/behavioralAssessmentPdf';
import { ClientData } from '@/types/documentGenerator';
import { BehavioralAssessmentData } from '@/types/behavioralAssessment';

const fallbackClients = clientsData as ClientData[];

const initialForm = (client: ClientData): BehavioralAssessmentData => ({
  clientId: client.id,
  clientName: client.name,
  month: dayjs().format('YYYY-MM'),
  when: '',
  antecedents: '',
  consequences: '',
  summary: '',
});

const BehavioralAssessment = () => {
  const [clients, setClients] = useState<ClientData[]>(fallbackClients);
  const [form, setForm] = useState<BehavioralAssessmentData>(
    initialForm(fallbackClients[0]),
  );
  const [error, setError] = useState('');

  useEffect(() => {
    const loadClients = async () => {
      try {
        const response = await fetch('/api/activity-data');
        if (!response.ok) return;
        const data = (await response.json()) as { clients?: ClientData[] };
        if (!data.clients?.length) return;
        setClients(data.clients);
        const selectedClient = data.clients.find((client) => client.id === form.clientId) ?? data.clients[0];
        setForm((current) => ({ ...current, clientId: selectedClient.id, clientName: selectedClient.name }));
      } catch {
        // Keep the seeded client list available if the database is temporarily unavailable.
      }
    };

    void loadClients();
  }, [form.clientId]);

  const updateField = (field: keyof BehavioralAssessmentData, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    if (client) {
      setForm((current) => ({
        ...current,
        clientId: client.id,
        clientName: client.name,
      }));
    }
  };

  const handleDownload = () => {
    if (!form.clientId || !form.clientName) {
      setError('Select a client before downloading the assessment.');
      return;
    }
    setError('');
    generateBehavioralAssessmentPDF(form);
  };

  return (
    <div className='max-w-5xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900'>
          ABC Behavioral Assessment
        </h1>
        <p className='mt-2 text-gray-600'>Create a page-two assessment PDF with editable fields.</p>
        {error && <p className='mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <ClipboardCheck className='h-5 w-5' />
            Assessment details
          </CardTitle>
          <CardDescription>
            Client name is selected from the client list. Every other field can be edited.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-4 md:grid-cols-2'>
            <div>
              <Label htmlFor='assessmentClient'>Client name</Label>
              <select
                id='assessmentClient'
                value={form.clientId}
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
            <div>
              <Label htmlFor='assessmentMonth'>Month</Label>
              <Input
                id='assessmentMonth'
                type='month'
                value={form.month}
                onChange={(event) => updateField('month', event.target.value)}
                className='mt-2'
              />
            </div>
          </div>

          <div className='grid gap-5 md:grid-cols-3'>
            <div>
              <Label htmlFor='assessmentWhen'>When</Label>
              <p className='mt-1 text-xs text-gray-500'>Date, time of day, duration</p>
              <Textarea id='assessmentWhen' value={form.when} onChange={(event) => updateField('when', event.target.value)} className='mt-2' />
            </div>
            <div>
              <Label htmlFor='assessmentAntecedents'>Antecedents</Label>
              <p className='mt-1 text-xs text-gray-500'>Where, who, what, why</p>
              <Textarea id='assessmentAntecedents' value={form.antecedents} onChange={(event) => updateField('antecedents', event.target.value)} className='mt-2' />
            </div>
            <div>
              <Label htmlFor='assessmentConsequences'>Consequences</Label>
              <p className='mt-1 text-xs text-gray-500'>Staff response and client reaction</p>
              <Textarea id='assessmentConsequences' value={form.consequences} onChange={(event) => updateField('consequences', event.target.value)} className='mt-2' />
            </div>
          </div>

          <div>
            <Label htmlFor='assessmentSummary'>Monthly summary</Label>
            <Textarea
              id='assessmentSummary'
              value={form.summary}
              onChange={(event) => updateField('summary', event.target.value)}
              className='mt-2 min-h-[220px]'
              placeholder='Enter the monthly behavioral assessment narrative.'
            />
          </div>

          <Button type='button' onClick={handleDownload}>
            <Download />
            Download ABC Assessment PDF
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default BehavioralAssessment;