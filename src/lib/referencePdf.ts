import { PDFDocument } from 'pdf-lib';

export interface ReferencePdfRange {
  id: string;
  sourcePath: string;
  title: string;
  description: string;
  pages: number[];
  filename: string;
  directory?: 'hilltop' | 'generated';
}

export const referencePdfRanges: ReferencePdfRange[] = [
  {
    id: 'rights-supervision',
    sourcePath: '/HDS%20docs%202%2007-21-2026_15-51-01-546.pdf',
    title: 'Rights and General Supervision Requirements',
    description: 'Rights of the intellectually disabled and general supervision requirements.',
    pages: [16, 17],
    filename: 'rights-and-supervision-requirements.pdf',
  },
  {
    id: 'zero-tolerance-policy',
    sourcePath: '/HDS%20docs%202%2007-21-2026_15-51-01-546.pdf',
    title: 'Zero Tolerance Abuse and Neglect Policy',
    description: 'Zero tolerance policy regarding abuse or neglect of individuals with developmental disabilities.',
    pages: [18, 19],
    filename: 'zero-tolerance-abuse-and-neglect-policy.pdf',
  },
  {
    id: 'job-description',
    sourcePath: '/HDS%20docs%202%2007-21-2026_15-51-01-546.pdf',
    title: 'Job Description and Specifications During SOE',
    description: 'Job Coach responsibilities, job summary, context, and minimum employment requirements.',
    pages: [21, 22],
    filename: 'job-description-and-soe-specifications.pdf',
    directory: 'generated',
  },
  {
    id: 'heat-and-smog',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: "Managing Consumers' Health in the Heat and Smog",
    description: 'Heat, smog, medical concerns, and policies for supporting consumers during higher temperatures.',
    pages: [1, 2, 3, 4],
    filename: 'managing-health-in-heat-and-smog.pdf',
  },
  {
    id: 'language-issues',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Expressive and Receptive Language Issues',
    description: 'Communication, social language, speech therapy, and practical language support.',
    pages: [5, 6, 7, 8],
    filename: 'expressive-and-receptive-language-issues.pdf',
  },
  {
    id: 'rule-governed-behavior',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Establishing Rule-Governed Behavior',
    description: 'ABA rule-governed behavior, visual supports, reinforcement, modeling, and generalization.',
    pages: [9, 10, 11, 12],
    filename: 'establishing-rule-governed-behavior.pdf',
  },
  {
    id: 'special-incident-report',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Special Incident Report Preparation',
    description: 'When and how staff prepare, document, review, and follow up on special incident reports.',
    pages: [13, 14],
    filename: 'special-incident-report-preparation.pdf',
  },
  {
    id: 'supervision-autonomy',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Supervision, Support and Participant Autonomy',
    description: 'Supervision, support, privacy, independence, and participant autonomy in community settings.',
    pages: [15, 16],
    filename: 'supervision-support-and-participant-autonomy.pdf',
  },
  {
    id: 'transitions',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Transitions',
    description: 'Transition challenges, causes, treatment approaches, and support strategies.',
    pages: [17, 18, 19, 20],
    filename: 'transitions.pdf',
  },
  {
    id: 'intellectual-disability-rights',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Rights of the Intellectually Disabled',
    description: 'Client rights and the associated rights review material.',
    pages: [21, 22],
    filename: 'rights-of-the-intellectually-disabled.pdf',
  },
  {
    id: 'personal-community',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Personal Community and Five Valued Experiences',
    description: 'Belonging, being respected, contributing, choosing, sharing, and ordinary places.',
    pages: [23, 24, 25, 26, 27, 28],
    filename: 'personal-community-and-valued-experiences.pdf',
  },
  {
    id: 'bloodborne-pathogens',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Bloodborne Pathogens',
    description: 'Bloodborne disease risks, standard precautions, exposure procedures, and safety rules.',
    pages: [29, 30, 31, 32, 33],
    filename: 'bloodborne-pathogens.pdf',
  },
  {
    id: 'injury-illness-prevention',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Injury and Illness Prevention Program',
    description: 'Program introduction, safety priorities, and employee training responsibilities.',
    pages: [34],
    filename: 'injury-and-illness-prevention-program.pdf',
  },
  {
    id: 'emergency-preparedness',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Emergency Preparedness Policies and Procedures',
    description: 'Emergency drills, supplies, locations, communication, and disaster response procedures.',
    pages: [35, 36, 37, 38, 39, 40],
    filename: 'emergency-preparedness-policies-and-procedures.pdf',
  },
  {
    id: 'autism-service-tips',
    sourcePath: '/HDS%20docs%2007-21-2026_15-47-07-313.pdf',
    title: 'Serving People with Autism Spectrum Disorder',
    description: 'Autism service tips, routines, transitions, anxiety, communication, and behavioral support.',
    pages: [41, 42, 43, 44, 45, 46],
    filename: 'serving-people-with-autism-spectrum-disorder.pdf',
  },
];

export const createReferencePdf = async (sourcePath: string, pages: number[]): Promise<Blob> => {
  const response = await fetch(sourcePath);
  if (!response.ok) throw new Error('Unable to load the source PDF.');

  const sourcePdf = await PDFDocument.load(await response.arrayBuffer());
  const outputPdf = await PDFDocument.create();
  const copiedPages = await outputPdf.copyPages(sourcePdf, pages.map((page) => page - 1));
  copiedPages.forEach((page) => outputPdf.addPage(page));

  return new Blob([await outputPdf.save()], { type: 'application/pdf' });
};