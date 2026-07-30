export interface GroomingChecklistItem {
  label: string;
  ratings: Record<string, string>;
}

export interface GroomingChecklistData {
  clientId: string;
  clientName: string;
  task: string;
  month: string;
  ratingMethod: string;
  dates: string[];
  items: GroomingChecklistItem[];
  barriersToProgress: string;
}