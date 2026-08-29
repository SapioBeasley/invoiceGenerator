import assert from 'node:assert/strict';
import test from 'node:test';
import { getVisibleDashboardModules } from './dashboardModules';

test('full-access users can see every dashboard module', () => {
  assert.deepEqual(getVisibleDashboardModules(true), [
    'account-management',
    'invoice-generator',
    'grooming-checklist',
    'monthly-questionnaire',
    'weekly-schedule',
    'behavioral-assessment',
    'activity-summary',
    'reference-pdfs',
    'document-generator',
  ]);
});

test('test@gmail.com only sees the modules available to regular users', () => {
  assert.deepEqual(getVisibleDashboardModules(false), [
    'grooming-checklist',
    'weekly-schedule',
    'activity-summary',
  ]);
});