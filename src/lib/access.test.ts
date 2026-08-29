import assert from 'node:assert/strict';
import test from 'node:test';
import { getSignupRole, isFullAccessEmail } from './access';

test('full access email matching is case-insensitive and trims values', () => {
  process.env.FULL_ACCESS_EMAILS = ' owner@example.com,manager@example.com ';

  assert.equal(isFullAccessEmail('OWNER@example.com'), true);
  assert.equal(isFullAccessEmail('manager@example.com'), true);
  assert.equal(isFullAccessEmail('testadmin@gmail.com'), false);
  assert.equal(isFullAccessEmail(undefined), false);
});

test('full-access signup emails are created with the admin role', () => {
  process.env.FULL_ACCESS_EMAILS = ' testadmin@gmail.com ';

  assert.equal(getSignupRole('TESTADMIN@gmail.com'), 'admin');
});