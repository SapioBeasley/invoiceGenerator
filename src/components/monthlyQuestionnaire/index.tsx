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
import { generateMonthlyQuestionnairePDF } from '@/lib/monthlyQuestionnairePdf';
import { ClientData } from '@/types/documentGenerator';
import { MonthlyQuestionnaireData, QuestionnaireQuestion } from '@/types/monthlyQuestionnaire';

const fallbackClients = clientsData as ClientData[];

const defaultTopics = [
  {
    title: 'Resuming Activities',
    questions: [
      {
        prompt: 'Describe this person’s general attitude/mood about returning to program. If you are familiar with this person, do they seem the same as before the stay-at-home orders, or do they seem different?',
        answer: '',
      },
      {
        prompt: 'Describe how you are providing services to this person. Are you serving them one-on-one, or alongside another client? How long each day do you spend with them?',
        answer: '',
      },
      {
        prompt: 'Many locations are closed to our program. Please describe locations that the person is content to visit, and what the person does there.',
        answer: '',
      },
    ],
  },
  {
    title: 'Social/Behavioral',
    questions: [
      {
        prompt: 'What does this person talk about when they are with you? If another client is present, does this person speak to the other client? What do they talk about?',
        answer: '',
      },
      {
        prompt: 'Does this person express concerns or feelings that require a careful, supportive response from you? How do you handle what they share with you?',
        answer: '',
      },
      {
        prompt: 'Has this person expressed any frustrations or behaviors that you feel others, such as home or office staff, should be made aware of?',
        answer: '',
      },
    ],
  },
  {
    title: 'COVID-19 Hygiene, General Health & Exercise',
    questions: [
      {
        prompt: 'Describe how cooperative this person is with: a) wearing a face mask; b) washing their hands well; and c) keeping 6 ft. apart from others. What have you found encourages them to protect themselves and others with these methods?',
        answer: '',
      },
      {
        prompt: 'How would you describe their physical health and stamina? Any changes from before?',
        answer: '',
      },
      {
        prompt: 'Are you able to help this person exercise? What activities are they able to do currently to be physically active, and for how long?',
        answer: '',
      },
    ],
  },
  {
    title: 'Recreational Activities',
    questions: [
      {
        prompt: 'What activities have you tried with this person that they seem to enjoy? Which activities do they not like? What do you do when they refuse to participate in an activity? How do you handle this?',
        answer: '',
      },
      {
        prompt: 'What locations or activities work best to help them get relaxed?',
        answer: '',
      },
      {
        prompt: 'Describe an activity that you feel shows the person’s personality, abilities, and interests.',
        answer: '',
      },
    ],
  },
  {
    title: 'Self-Advocacy',
    questions: [
      {
        prompt: 'Give examples of choices that you offer the person and describe how they indicate their preferences?',
        answer: '',
      },
      {
        prompt: 'How does the person show that they are uncomfortable or do not like an activity? What do you do when this happens?',
        answer: '',
      },
      {
        prompt: 'Can the person be flexible if the activity that they prefer is not done that day? What type of support do they need from you to handle change or disappointment?',
        answer: '',
      },
      {
        prompt: 'Given that program is different than before, what does this person talk about missing about how things were before?',
        answer: '',
      },
    ],
  },
];

const createInitialForm = (client: ClientData): MonthlyQuestionnaireData => ({
  clientId: client.id,
  clientName: client.name,
  jobCoach: '',
  month: dayjs().format('YYYY-MM'),
  packetTitle: 'Monthly Questionnaire Packet',
  topics: defaultTopics,
});

const MonthlyQuestionnaire = () => {
  const [clients, setClients] = useState<ClientData[]>(fallbackClients);
  const [form, setForm] = useState<MonthlyQuestionnaireData>(
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

  const updateForm = <K extends keyof MonthlyQuestionnaireData>(
    field: K,
    value: MonthlyQuestionnaireData[K],
  ) => setForm((current) => ({ ...current, [field]: value }));

  const handleClientChange = (clientId: string) => {
    const client = clients.find((item) => item.id === clientId);
    if (client) setForm((current) => ({ ...current, clientId: client.id, clientName: client.name }));
  };

  const updateTopicTitle = (topicIndex: number, title: string) => {
    setForm((current) => ({
      ...current,
      topics: current.topics.map((topic, index) => index === topicIndex ? { ...topic, title } : topic),
    }));
  };

  const updateQuestion = (
    topicIndex: number,
    questionIndex: number,
    field: keyof QuestionnaireQuestion,
    value: string,
  ) => {
    setForm((current) => ({
      ...current,
      topics: current.topics.map((topic, currentTopicIndex) =>
        currentTopicIndex === topicIndex
          ? {
              ...topic,
              questions: topic.questions.map((question, currentQuestionIndex) =>
                currentQuestionIndex === questionIndex ? { ...question, [field]: value } : question,
              ),
            }
          : topic,
      ),
    }));
  };

  const addQuestion = (topicIndex: number) => {
    setForm((current) => ({
      ...current,
      topics: current.topics.map((topic, index) =>
        index === topicIndex
          ? { ...topic, questions: [...topic.questions, { prompt: '', answer: '' }] }
          : topic,
      ),
    }));
  };

  const removeQuestion = (topicIndex: number, questionIndex: number) => {
    setForm((current) => ({
      ...current,
      topics: current.topics.map((topic, index) =>
        index === topicIndex
          ? { ...topic, questions: topic.questions.filter((_, itemIndex) => itemIndex !== questionIndex) }
          : topic,
      ),
    }));
  };

  const getQuestionNumber = (topicIndex: number, questionIndex: number): number =>
    form.topics.slice(0, topicIndex).reduce((total, topic) => total + topic.questions.length, 0) + questionIndex + 1;

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight text-gray-900'>Monthly Questionnaire Packet</h1>
        <p className='mt-2 text-gray-600'>Create an editable questionnaire PDF based on page 6.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Packet details</CardTitle>
          <CardDescription>Client name is the only dropdown. All other fields are editable.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-5'>
          <div className='grid gap-4 md:grid-cols-4'>
            <div>
              <Label htmlFor='questionnaireClient'>Client name</Label>
              <select
                id='questionnaireClient'
                value={form.clientId}
                onChange={(event) => handleClientChange(event.target.value)}
                className='mt-2 w-full rounded-md border border-input bg-background px-3 py-2'
              >
                {clients.map((client) => <option key={client.id} value={client.id}>{client.name}</option>)}
              </select>
            </div>
            <div>
              <Label htmlFor='questionnaireCoach'>Job Coach</Label>
              <Input id='questionnaireCoach' value={form.jobCoach} onChange={(event) => updateForm('jobCoach', event.target.value)} className='mt-2' />
            </div>
            <div>
              <Label htmlFor='questionnaireMonth'>Month</Label>
              <Input id='questionnaireMonth' type='month' value={form.month} onChange={(event) => updateForm('month', event.target.value)} className='mt-2' />
            </div>
            <div>
              <Label htmlFor='questionnaireTitle'>Packet title</Label>
              <Input id='questionnaireTitle' value={form.packetTitle} onChange={(event) => updateForm('packetTitle', event.target.value)} className='mt-2' />
            </div>
          </div>
        </CardContent>
      </Card>

      {form.topics.map((topic, topicIndex) => (
        <Card key={`topic-${topicIndex}`}>
          <CardHeader>
            <div className='flex items-center justify-between gap-4'>
              <Input value={topic.title} onChange={(event) => updateTopicTitle(topicIndex, event.target.value)} className='text-lg font-semibold' aria-label={`Topic ${topicIndex + 1}`} />
              <Button type='button' variant='outline' size='sm' onClick={() => addQuestion(topicIndex)}><Plus /> Add question</Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-5'>
              {topic.questions.map((question, questionIndex) => (
              <div key={`question-${topicIndex}-${questionIndex}`} className='rounded-md border p-4'>
                <div className='flex items-start gap-3'>
                  <span className='pt-2 font-semibold'>{getQuestionNumber(topicIndex, questionIndex)}.</span>
                  <Textarea value={question.prompt} onChange={(event) => updateQuestion(topicIndex, questionIndex, 'prompt', event.target.value)} className='min-h-[100px]' aria-label={`Question ${getQuestionNumber(topicIndex, questionIndex)}`} />
                  <Button type='button' variant='ghost' size='icon' onClick={() => removeQuestion(topicIndex, questionIndex)} aria-label={`Remove question ${getQuestionNumber(topicIndex, questionIndex)}`}><Trash2 /></Button>
                </div>
                <Textarea value={question.answer} onChange={(event) => updateQuestion(topicIndex, questionIndex, 'answer', event.target.value)} className='mt-3 min-h-[140px]' placeholder='Enter the answer for this question.' aria-label={`Answer ${questionIndex + 1}`} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <Button type='button' onClick={() => generateMonthlyQuestionnairePDF(form)}><Download /> Download Monthly Questionnaire PDF</Button>
    </div>
  );
};

export default MonthlyQuestionnaire;