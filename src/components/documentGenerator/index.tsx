import React, { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import clientsData from '@/data/clients.json';
import {
  DocumentFormData,
  ClientData,
  createDefaultTable,
} from '@/types/documentGenerator';
import { generateDocumentPDF } from '@/lib/pdfGenerator';
import { FileDown } from 'lucide-react';
import { SectionTableEditor } from './SectionTableEditor';

export default function DocumentGenerator() {
  const [selectedClient, setSelectedClient] = useState<string>('');

  const methods = useForm<DocumentFormData>({
    defaultValues: {
      documentType: 'ISP',
      includeRationale: true,
      includeBackground: true,
      includeMotivational: true,
      includeSelfControlObjectives: true,
      includeSelfControlBarriers: true,
      includeServiceStrategies: true,
      includeIntervention: true,
      includeLifeSkills: true,
      includeComments: true,
      includeResultsOfBehavioral: true,
      includeProgressLifeSkills: true,
      includeProgressSelfControl: true,
      sectionTables: {
        rationaleForServices: createDefaultTable(),
        backgroundInformation: createDefaultTable(),
        motivationalAnalysis: createDefaultTable(),
        selfControlObjectives: createDefaultTable(),
        selfControlBarriers: createDefaultTable(),
        serviceStrategies: createDefaultTable(),
        interventionRecommendations: createDefaultTable(),
        lifeSkillsTraining: createDefaultTable(),
        commentsAndRecommendations: createDefaultTable(),
        resultsOfBehavioralIntervention: {
          ...createDefaultTable([
            'Month of Services',
            'Agitation',
            'Physical Aggression',
            'Property Destruction',
          ]),
          enabled: true,
        },
        progressOnLifeSkills: {
          ...createDefaultTable([
            'Month of Service',
            'Exercise 45 min.',
            'Small Purchase',
          ]),
          enabled: true,
        },
        progressOnSelfControl: {
          ...createDefaultTable([
            'Month of service',
            'Emotional Outbursts',
            'Elopement',
            'Resistiveness',
          ]),
          enabled: true,
        },
      },
    },
  });

  const { register, handleSubmit, watch, setValue } = methods;

  const documentType = watch('documentType');

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    setValue('clientId', clientId);

    const client = (clientsData as ClientData[]).find((c) => c.id === clientId);
    if (client) {
      setValue('name', client.name);
      setValue('uciNumber', client.uciNumber);
      setValue('dob', client.dob);
      setValue('address', client.address);
      setValue('referralSource', client.referralSource);
      setValue('cordinatorName', client.cordinatorName);
    }
  };

  const onSubmit = async (data: DocumentFormData) => {
    await generateDocumentPDF(data);
  };

  const renderSectionToggle = (
    title: string,
    toggleName: keyof DocumentFormData,
    textName: keyof DocumentFormData,
  ) => (
    <div className='border p-4 rounded-md'>
      <div className='flex items-center gap-2 mb-2'>
        <input
          type='checkbox'
          {...register(toggleName as any)}
          className='w-4 h-4'
        />
        <label className='font-medium'>{title}</label>
      </div>
      {watch(toggleName as any) && (
        <div className='space-y-4'>
          <textarea
            {...register(textName as any)}
            className='w-full border rounded-md p-2 h-32'
            placeholder={`Enter content for ${title.toLowerCase()}...`}
          />
          <SectionTableEditor sectionKey={textName} />
        </div>
      )}
    </div>
  );

  return (
    <div className='max-w-4xl mx-auto py-8'>
      <Card>
        <CardHeader>
          <CardTitle>Generate Document</CardTitle>
          <CardDescription>
            Select a document type and client to generate a report.
            <div className='mt-4 p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200 text-sm'>
              <p className='font-semibold mb-1'>How to use this module:</p>
              <ul className='list-disc pl-5 space-y-1'>
                <li>
                  <strong>Select Document Type:</strong> Choose between ISP or
                  APR. This changes the sections that are available to fill out.
                </li>
                <li>
                  <strong>Select Client:</strong> Picking a client from the
                  dropdown will auto-populate their identifying information.
                </li>
                <li>
                  <strong>Toggle Sections:</strong> Use the checkboxes next to
                  section titles to include or exclude them from the final PDF.
                </li>
                <li>
                  <strong>Tables:</strong> In sections with tables, the
                  &quot;Average&quot; row calculates automatically based on the
                  column values above it. Add or remove columns/rows as needed.
                </li>
                <li>
                  <strong>Export:</strong> Click the &quot;Export to PDF&quot;
                  button at the bottom to generate the final document. The
                  layout is automatically formatted.
                </li>
              </ul>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              {/* Top Selection Area */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Document Type
                  </label>
                  <select
                    {...register('documentType')}
                    className='w-full border rounded-md p-2'
                  >
                    <option value='ISP'>Individual Service Plan (ISP)</option>
                    <option value='APR'>Annual Progress Report (APR)</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Select Client
                  </label>
                  <select
                    value={selectedClient}
                    onChange={handleClientChange}
                    className='w-full border rounded-md p-2'
                  >
                    <option value=''>-- Select a Client --</option>
                    {clientsData.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* General Info */}
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Report Date
                  </label>
                  <input
                    type='date'
                    {...register('reportDate')}
                    className='w-full border rounded-md p-2'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Report Period
                  </label>
                  <input
                    type='text'
                    {...register('reportPeriod')}
                    placeholder='e.g. Q1 2024'
                    className='w-full border rounded-md p-2'
                  />
                </div>
              </div>

              <div className='grid grid-cols-2 gap-4 border-t pt-4'>
                <div className='col-span-2'>
                  <h3 className='font-semibold text-lg'>
                    Identifying Information
                  </h3>
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>Name</label>
                  <input
                    type='text'
                    {...register('name')}
                    className='w-full border rounded-md p-2 bg-gray-50'
                    readOnly
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>UCI#</label>
                  <input
                    type='text'
                    {...register('uciNumber')}
                    className='w-full border rounded-md p-2 bg-gray-50'
                    readOnly
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Date of Birth
                  </label>
                  <input
                    type='date'
                    {...register('dob')}
                    className='w-full border rounded-md p-2 bg-gray-50'
                    readOnly
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Address
                  </label>
                  <input
                    type='text'
                    {...register('address')}
                    className='w-full border rounded-md p-2 bg-gray-50'
                    readOnly
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Referral Source
                  </label>
                  <input
                    type='text'
                    {...register('referralSource')}
                    className='w-full border rounded-md p-2 bg-gray-50'
                    readOnly
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Service Coordinator
                  </label>
                  <input
                    type='text'
                    {...register('cordinatorName')}
                    className='w-full border rounded-md p-2 bg-gray-50'
                    readOnly
                  />
                </div>
              </div>

              <div className='border-t pt-4 space-y-4'>
                <h3 className='font-semibold text-lg'>
                  {documentType} Sections
                </h3>

                {documentType === 'ISP' && (
                  <>
                    {renderSectionToggle(
                      'RATIONALE FOR SERVICES',
                      'includeRationale',
                      'rationaleForServices',
                    )}
                    {renderSectionToggle(
                      'BACKGROUND INFORMATION',
                      'includeBackground',
                      'backgroundInformation',
                    )}
                    {renderSectionToggle(
                      'MOTIVATIONAL ANALYSIS',
                      'includeMotivational',
                      'motivationalAnalysis',
                    )}
                    {renderSectionToggle(
                      'SELF-CONTROL AND INTERPERSONAL SKILL OBJECTIVES',
                      'includeSelfControlObjectives',
                      'selfControlObjectives',
                    )}
                    {renderSectionToggle(
                      'SELF-CONTROL AND INTERPERSONAL SKILLS: BARRIERS TO PROGRESS',
                      'includeSelfControlBarriers',
                      'selfControlBarriers',
                    )}
                    {renderSectionToggle(
                      'SERVICE STRATEGIES',
                      'includeServiceStrategies',
                      'serviceStrategies',
                    )}
                    {renderSectionToggle(
                      'INTERVENTION RECOMMENDATIONS',
                      'includeIntervention',
                      'interventionRecommendations',
                    )}
                    {renderSectionToggle(
                      'LIFE SKILLS TRAINING',
                      'includeLifeSkills',
                      'lifeSkillsTraining',
                    )}
                    {renderSectionToggle(
                      'COMMENTS AND RECOMMENDATIONS',
                      'includeComments',
                      'commentsAndRecommendations',
                    )}
                  </>
                )}

                {documentType === 'APR' && (
                  <>
                    {renderSectionToggle(
                      'BACKGROUND INFORMATION',
                      'includeBackground',
                      'backgroundInformation',
                    )}
                    {renderSectionToggle(
                      'RESULTS OF BEHAVIORAL INTERVENTION',
                      'includeResultsOfBehavioral',
                      'resultsOfBehavioralIntervention',
                    )}
                    {renderSectionToggle(
                      'PROGRESS ON LIFE SKILLS TRAINING',
                      'includeProgressLifeSkills',
                      'progressOnLifeSkills',
                    )}
                    {renderSectionToggle(
                      'PROGRESS ON SELF-CONTROL AND INTERPERSONAL SKILLS',
                      'includeProgressSelfControl',
                      'progressOnSelfControl',
                    )}
                    {renderSectionToggle(
                      'COMMENTS AND RECOMMENDATIONS',
                      'includeComments',
                      'commentsAndRecommendations',
                    )}
                  </>
                )}
              </div>

              <div className='grid grid-cols-2 gap-4 border-t pt-4'>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Signer Name (Print Name)
                  </label>
                  <input
                    type='text'
                    {...register('printName')}
                    className='w-full border rounded-md p-2'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-1'>
                    Signer Position
                  </label>
                  <input
                    type='text'
                    {...register('position')}
                    className='w-full border rounded-md p-2'
                  />
                </div>
              </div>

              <button
                type='submit'
                className='w-full bg-blue-600 text-white rounded-md py-2 flex justify-center items-center gap-2'
              >
                <FileDown size={20} />
                Download {documentType} PDF
              </button>
            </form>
          </FormProvider>
        </CardContent>
      </Card>
    </div>
  );
}
