import assert from 'node:assert/strict';
import test from 'node:test';
import { isAccountRole, isValidAccountEmail, normalizeAccountEmail } from './accountManagementRules';

test('account email values are normalized and validated', () => {
  assert.equal(normalizeAccountEmail(' Admin@Example.com '), 'admin@example.com');
  assert.equal(isValidAccountEmail('admin@example.com'), true);
  assert.equal(isValidAccountEmail('not-an-email'), false);
});

test('only supported account roles are accepted', () => {
  assert.equal(isAccountRole('admin'), true);
  assert.equal(isAccountRole('user'), true);
  assert.equal(isAccountRole('owner'), false);
  assert.equal(isAccountRole(undefined), false);
});