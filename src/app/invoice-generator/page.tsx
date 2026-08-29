import InvoiceGenerator from '@/components/invoiceGenerator';
import { requirePageAccess } from '@/lib/authorization';

export default async function InvoiceGeneratorPage() {
  await requirePageAccess(true);

  return <InvoiceGenerator />;
}
