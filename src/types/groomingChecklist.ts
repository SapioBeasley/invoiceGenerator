export interface GroomingEntry {
  id: string;
  clientId: string;
  date: string;
  itemLabel: string;
  rating: string;
}

export interface GroomingExportOptions {
  task: string;
  ratingMethod: string;
  barriersToProgress: string;
}