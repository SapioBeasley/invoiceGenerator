import type { ActivityDateRange, ClientActivity } from '@/types/activitySummary';
import type { GroomingEntry } from '@/types/groomingChecklist';
import type { ScheduleEntry } from '@/types/weeklySchedule';

export const getActivitiesForClient = (
  activities: ClientActivity[],
  clientId: string,
): ClientActivity[] =>
  activities
    .filter((activity) => activity.clientId === clientId)
    .sort((a, b) => b.date.localeCompare(a.date));

export const getScheduleEntriesForRange = (
  entries: ScheduleEntry[],
  clientId: string,
  range: ActivityDateRange,
): ScheduleEntry[] =>
  entries
    .filter((entry) => entry.clientId === clientId)
    .filter((entry) => entry.date >= range.start && entry.date <= range.end)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

export const getGroomingEntriesForMonth = (
  entries: GroomingEntry[],
  clientId: string,
  month: string,
): GroomingEntry[] =>
  entries
    .filter((entry) => entry.clientId === clientId && entry.date.startsWith(month))
    .sort((a, b) => `${b.date} ${b.itemLabel}`.localeCompare(`${a.date} ${a.itemLabel}`));

export const mergeGroomingEntries = (
  current: GroomingEntry[],
  incoming: GroomingEntry[],
): GroomingEntry[] => [
  ...current.filter((entry) => !incoming.some((next) => next.id === entry.id)),
  ...incoming,
];