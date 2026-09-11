export interface InvoiceLineItemAmount {
  cost: number;
}

export const toCurrencyCents = (amount: number): number =>
  Math.round((amount + Number.EPSILON) * 100);

export const fromCurrencyCents = (cents: number): number => cents / 100;

export const calculateLineItemCost = (quantity: number, rate: number): number =>
  fromCurrencyCents(toCurrencyCents(quantity * rate));

export const calculateInvoiceTotal = (lineItems: InvoiceLineItemAmount[]): number =>
  fromCurrencyCents(lineItems.reduce((totalCents, item) => totalCents + toCurrencyCents(item.cost), 0));