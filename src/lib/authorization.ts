import 'server-only';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export const getAuthContext = async (requestHeaders: Headers) => {
  const session = await auth.api.getSession({ headers: requestHeaders });
  const isAdmin = session?.user.role === 'admin';

  return {
    session,
    isAdmin,
  };
};

export const requirePageAccess = async (adminOnly = false) => {
  const context = await getAuthContext(await headers());

  if (!context.session) {
    redirect('/sign-in');
  }

  if (adminOnly && !context.isAdmin) {
    redirect('/');
  }

  return {
    session: context.session,
    isAdmin: context.isAdmin,
  };
};