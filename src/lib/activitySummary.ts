import dayjs, { Dayjs } from 'dayjs';
import type { ActivityDateRange, ClientActivity } from '@/types/activitySummary';

export const ACTIVITY_STORAGE_KEY = 'invoice-generator-client-activities';
export const CLIENT_STORAGE_KEY = 'invoice-generator-clients';

export const getMonthDateRange = (
  month: string,
  today: Dayjs = dayjs(),
): ActivityDateRange => {
  const currentMonth = today.format('YYYY-MM');
  const selectedMonth = /^\d{4}-\d{2}$/.test(month) ? month : currentMonth;
  const firstDay = dayjs(`${selectedMonth}-01`);
  const start = firstDay.isValid() ? firstDay.startOf('month') : today.startOf('month');
  const end = start.format('YYYY-MM') === currentMonth ? today : start.endOf('month');

  return {
    start: start.format('YYYY-MM-DD'),
    end: end.format('YYYY-MM-DD'),
  };
};

export const getDatesInRange = (range: ActivityDateRange): string[] => {
  const dates: string[] = [];
  let current = dayjs(range.start);
  const end = dayjs(range.end);

  while (current.isValid() && end.isValid() && current.isBefore(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'));
    current = current.add(1, 'day');
  }

  if (current.isValid() && end.isValid() && current.isSame(end, 'day')) {
    dates.push(current.format('YYYY-MM-DD'));
  }

  return dates;
};

export const getActivitiesForDate = (
  activities: ClientActivity[],
  clientId: string,
  date: string,
): ClientActivity[] =>
  activities.filter(
    (activity) => activity.clientId === clientId && activity.date === date,
  );

export const removeExpiredActivities = (
  activities: ClientActivity[],
  today: Dayjs = dayjs(),
): ClientActivity[] => {
  const cutoff = today.subtract(1, 'year').startOf('day');

  return activities.filter((activity) => {
    const activityDate = dayjs(activity.date);
    return activityDate.isValid() && !activityDate.isBefore(cutoff, 'day');
  });
};