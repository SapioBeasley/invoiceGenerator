import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllowedSignupRole } from '@/lib/accountManagement';
import type { AccountRole } from '@/lib/accountManagementRules';

export const runtime = 'nodejs';

interface SignUpRequest {
  name?: unknown;
  email?: unknown;
  password?: unknown;
}

const getString = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : '';

export async function POST(request: Request) {
  let body: SignUpRequest;

  try {
    body = (await request.json()) as SignUpRequest;
  } catch {
    return NextResponse.json({ error: 'A valid JSON body is required.' }, { status: 400 });
  }

  const name = getString(body.name);
  const email = getString(body.email).toLowerCase();
  const password = typeof body.password === 'string' ? body.password : '';

  if (!name || !email || !password) {
    return NextResponse.json({ error: 'Name, email, and password are required.' }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
  }

  let role: AccountRole | null;
  try {
    role = await getAllowedSignupRole(email);
  } catch {
    return NextResponse.json({ error: 'Signup is temporarily unavailable.' }, { status: 503 });
  }

  if (!role) {
    return NextResponse.json({ error: 'This email is not approved for signup.' }, { status: 403 });
  }

  try {
    const result = await auth.api.createUser({
      body: {
        email,
        name,
        password,
        role,
      },
    });

    return NextResponse.json({ user: result.user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: 'Unable to create the account. The email may already be registered.' },
      { status: 409 },
    );
  }
}