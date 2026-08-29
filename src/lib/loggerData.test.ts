import assert from 'node:assert/strict';
import test from 'node:test';
import { getGroomingEntriesForMonth, getScheduleEntriesForRange, mergeGroomingEntries } from './loggerData';

const scheduleEntry = (id: string, clientId: string, date: string, time: string) => ({
  id, clientId, date, time, location: 'Office', purpose: 'Support', clientInput: 'Participated', staff: 'Alex',
});

test('weekly schedule logging is scoped to client and monthly export range', () => {
  const entries = [
    scheduleEntry('later', 'client-1', '2026-07-20', '10:00 AM'),
    scheduleEntry('other-client', 'client-2', '2026-07-10', '9:00 AM'),
    scheduleEntry('outside-range', 'client-1', '2026-08-01', '9:00 AM'),
    scheduleEntry('earlier', 'client-1', '2026-07-10', '9:00 AM'),
  ];
  const result = getScheduleEntriesForRange(entries, 'client-1', { start: '2026-07-01', end: '2026-07-31' });
  assert.deepEqual(result.map((entry) => entry.id), ['later', 'earlier']);
});

test('grooming logging is scoped to client and selected month', () => {
  const entries = [
    { id: 'november', clientId: 'client-1', date: '2026-11-01', itemLabel: 'Hair', rating: '1' },
    { id: 'october', clientId: 'client-1', date: '2026-10-31', itemLabel: 'Teeth', rating: '0' },
    { id: 'other-client', clientId: 'client-2', date: '2026-10-15', itemLabel: 'Hair', rating: '1' },
  ];
  assert.deepEqual(getGroomingEntriesForMonth(entries, 'client-1', '2026-10').map((entry) => entry.id), ['october']);
});

test('grooming logging replaces an existing date/item rating without duplicating it', () => {
  const current = [{ id: 'same', clientId: 'client-1', date: '2026-10-10', itemLabel: 'Hair', rating: '0' }];
  const incoming = [{ id: 'same', clientId: 'client-1', date: '2026-10-10', itemLabel: 'Hair', rating: '1' }];
  assert.deepEqual(mergeGroomingEntries(current, incoming), incoming);
});