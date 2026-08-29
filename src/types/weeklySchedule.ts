export interface ScheduleEntry {
  id: string;
  clientId: string;
  date: string;
  time: string;
  location: string;
  purpose: string;
  clientInput: string;
  staff: string;
}

export interface WeeklyScheduleExportOptions {
  additionalClients: string[];
  pickupDropoff: string[];
  copyNotes: string;
}