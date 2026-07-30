import assert from 'node:assert/strict';
import test from 'node:test';
import dayjs from 'dayjs';
import {
  getActivitiesForDate,
  getDatesInRange,
  getMonthDateRange,
  removeExpiredActivities,
} from './activitySummary';

test('past month exports every calendar date', () => {
  const range = getMonthDateRange('2026-10', dayjs('2026-07-27'));

  assert.deepEqual(range, { start: '2026-10-01', end: '2026-10-31' });
  assert.equal(getDatesInRange(range).length, 31);
  assert.equal(getDatesInRange(range).at(-1), '2026-10-31');
});

test('current month ends today instead of using a rolling month', () => {
  const range = getMonthDateRange('2026-07', dayjs('2026-07-27'));

  assert.deepEqual(range, { start: '2026-07-01', end: '2026-07-27' });
  assert.equal(getDatesInRange(range).length, 27);
});

test('activities are scoped to the selected client and date', () => {
  const activities = [
    {
      id: 'activity-1',
      clientId: 'client-1',
      date: '2026-07-10',
      activity: 'Fitness walk',
      goalValues: { Agitation: '0' },
    },
  ];

  assert.equal(getActivitiesForDate(activities, 'client-1', '2026-07-10').length, 1);
  assert.equal(getActivitiesForDate(activities, 'client-2', '2026-07-10').length, 0);
  assert.equal(getActivitiesForDate(activities, 'client-1', '2026-07-11').length, 0);
});

test('activities older than one year are removed while the cutoff date is retained', () => {
  const activities = [
    {
      id: 'expired',
      clientId: 'client-1',
      date: '2025-07-26',
      activity: 'Expired activity',
      goalValues: {},
    },
    {
      id: 'cutoff',
      clientId: 'client-1',
      date: '2025-07-27',
      activity: 'Retained activity',
      goalValues: {},
    },
  ];

  assert.deepEqual(
    removeExpiredActivities(activities, dayjs('2026-07-27')).map((activity) => activity.id),
    ['cutoff'],
  );
});