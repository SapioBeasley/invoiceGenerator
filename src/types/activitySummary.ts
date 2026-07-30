export interface ClientActivity {
  id: string;
  clientId: string;
  date: string;
  activity: string;
  goalValues: Record<string, string>;
  notes?: string;
}

export interface ActivityDateRange {
  start: string;
  end: string;
}