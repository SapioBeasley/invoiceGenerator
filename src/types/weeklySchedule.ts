export interface WeeklyScheduleEntry {
  date: string;
  time: string;
  location: string;
  purpose: string;
  clientInput: string;
}

export interface WeeklyScheduleData {
  primaryClientId: string;
  primaryClientName: string;
  additionalClients: string[];
  staff: string;
  firstDayOfWeek: string;
  weekLabel: string;
  pickupDropoff: string[];
  copyNotes: string;
  entries: WeeklyScheduleEntry[];
}