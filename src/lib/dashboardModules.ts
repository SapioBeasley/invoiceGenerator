export const dashboardModules = [
  { key: 'account-management', fullAccessOnly: true },
  { key: 'invoice-generator', fullAccessOnly: true },
  { key: 'grooming-checklist', fullAccessOnly: false },
  { key: 'monthly-questionnaire', fullAccessOnly: true },
  { key: 'weekly-schedule', fullAccessOnly: false },
  { key: 'behavioral-assessment', fullAccessOnly: true },
  { key: 'activity-summary', fullAccessOnly: false },
  { key: 'reference-pdfs', fullAccessOnly: true },
  { key: 'document-generator', fullAccessOnly: true },
] as const;

export type DashboardModuleKey = (typeof dashboardModules)[number]['key'];

export const getVisibleDashboardModules = (hasFullAccess: boolean): DashboardModuleKey[] =>
  dashboardModules
    .filter(({ fullAccessOnly }) => !fullAccessOnly || hasFullAccess)
    .map(({ key }) => key);