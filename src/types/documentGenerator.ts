export type DocumentType = 'ISP' | 'APR';

export interface ClientData {
  id: string;
  name: string;
  uciNumber: string;
  dob: string;
  address: string;
  referralSource: string;
  cordinatorName: string;
}

export interface TableCell {
  value: string;
}

export interface TableRow {
  cols: TableCell[];
}

export interface TableData {
  enabled: boolean;
  headers: TableCell[];
  rows: TableRow[];
  averages: TableCell[];
  objectives: TableCell[];
}

export const createDefaultTable = (
  colNames: string[] = ['Header 1', 'Header 2', 'Header 3'],
): TableData => ({
  enabled: false,
  headers: colNames.map((name) => ({ value: name })),
  rows: [{ cols: colNames.map(() => ({ value: '' })) }],
  averages: colNames.map((_, i) => ({ value: i === 0 ? 'Average' : '' })),
  objectives: colNames.map((_, i) => ({
    value: i === 0 ? 'Objective Criteria' : '',
  })),
});

export interface DocumentFormData {
  documentType: DocumentType;
  clientId: string;

  // Identifying Information
  reportDate: Date | null;
  reportPeriod: string;
  name: string;
  uciNumber: string;
  dob: string;
  address: string;
  referralSource: string;
  cordinatorName: string;
  printName: string;
  position: string;

  // ISP Sections (Toggles & Content)
  includeRationale: boolean;
  rationaleForServices: string;

  includeBackground: boolean;
  backgroundInformation: string;

  includeMotivational: boolean;
  motivationalAnalysis: string;

  includeSelfControlObjectives: boolean;
  selfControlObjectives: string;

  includeSelfControlBarriers: boolean;
  selfControlBarriers: string;

  includeServiceStrategies: boolean;
  serviceStrategies: string;

  includeIntervention: boolean;
  interventionRecommendations: string;

  includeLifeSkills: boolean;
  lifeSkillsTraining: string;

  includeComments: boolean;
  commentsAndRecommendations: string;

  // APR specific
  includeResultsOfBehavioral: boolean;
  resultsOfBehavioralIntervention: string;

  includeProgressLifeSkills: boolean;
  progressOnLifeSkills: string;

  includeProgressSelfControl: boolean;
  progressOnSelfControl: string;

  sectionTables: Record<string, TableData>;
}
