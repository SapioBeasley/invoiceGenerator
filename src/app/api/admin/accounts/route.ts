import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/authorization';
import {
  getAdminUserCount,
  getManagedAccounts,
  removeManagedAccount,
  upsertManagedAccount,
} from '@/lib/accountManagement';
import {
  isAccountRole,
  isValidAccountEmail,
  normalizeAccountEmail,
  type AccountRole,
} from '@/lib/accountManagementRules';

export const runtime = 'nodejs';

const getAccessResponse = async (request: Request): Promise<NextResponse | null> => {
  const { session, isAdmin } = await getAuthContext(request.headers);
  if (!session) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  if (!isAdmin) return NextResponse.json({ error: 'Administrator access required.' }, { status: 403 });
  return null;
};

const getRequestBody = async (request: Request): Promise<Record<string, unknown> | null> => {
  try {
    const body = await request.json();
    return typeof body === 'object' && body !== null ? body as Record<string, unknown> : null;
  } catch {
    return null;
  }
};

const getEmailAndRole = (body: Record<string, unknown> | null): { email: string; role: AccountRole } | null => {
  const email = typeof body?.email === 'string' ? normalizeAccountEmail(body.email) : '';
  const role = body?.role;
  if (!isValidAccountEmail(email) || !isAccountRole(role)) return null;
  return { email, role };
};

export async function GET(request: Request) {
  const accessResponse = await getAccessResponse(request);
  if (accessResponse) return accessResponse;

  try {
    return NextResponse.json({ accounts: await getManagedAccounts() });
  } catch (error) {
    console.error('Failed to load managed accounts', error);
    return NextResponse.json({ error: 'Unable to load account access.' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  return updateManagedAccount(request, 201);
}

export async function PATCH(request: Request) {
  return updateManagedAccount(request, 200);
}

const updateManagedAccount = async (request: Request, successStatus: number) => {
  const accessResponse = await getAccessResponse(request);
  if (accessResponse) return accessResponse;

  const account = getEmailAndRole(await getRequestBody(request));
  if (!account) {
    return NextResponse.json({ error: 'A valid email and account type are required.' }, { status: 400 });
  }

  try {
    const accounts = await getManagedAccounts();
    const existing = accounts.find((entry) => entry.email === account.email);
    if (existing?.accountType === 'admin' && account.role === 'user' && await getAdminUserCount() <= 1) {
      return NextResponse.json({ error: 'At least one administrator account must remain.' }, { status: 409 });
    }

    await upsertManagedAccount(account.email, account.role);
    return NextResponse.json({ accounts: await getManagedAccounts() }, { status: successStatus });
  } catch (error) {
    console.error('Failed to update managed account', error);
    return NextResponse.json({ error: 'Unable to update account access.' }, { status: 500 });
  }
};

export async function DELETE(request: Request) {
  const accessResponse = await getAccessResponse(request);
  if (accessResponse) return accessResponse;

  const body = await getRequestBody(request);
  const email = typeof body?.email === 'string' ? normalizeAccountEmail(body.email) : '';
  if (!isValidAccountEmail(email)) {
    return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
  }

  try {
    const removed = await removeManagedAccount(email);
    if (!removed) return NextResponse.json({ error: 'Allowed email not found.' }, { status: 404 });
    return NextResponse.json({ accounts: await getManagedAccounts() });
  } catch (error) {
    console.error('Failed to remove managed account', error);
    return NextResponse.json({ error: 'Unable to remove signup access.' }, { status: 500 });
  }
}