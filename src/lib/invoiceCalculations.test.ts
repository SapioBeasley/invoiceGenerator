import assert from 'node:assert/strict';
import test from 'node:test';
import dayjs from 'dayjs';
import {
  calculateInvoiceTotal,
  calculateLineItemCost,
} from './invoiceCalculations';

test('invoice totals equal the sum of displayed rounded line amounts', () => {
  const weekdaysInJuly = Array.from({ length: 31 }, (_, index) => dayjs('2026-07-01').add(index, 'day'))
    .filter((date) => date.day() > 0 && date.day() < 6);
  const lineItems = weekdaysInJuly.flatMap(() => [
    { cost: calculateLineItemCost(24, 0.7) },
    { cost: calculateLineItemCost(5.4, 46.59) },
  ]);

  assert.equal(weekdaysInJuly.length, 23);
  assert.equal(lineItems[1].cost, 251.59);
  assert.equal(calculateInvoiceTotal(lineItems), 6172.97);
});