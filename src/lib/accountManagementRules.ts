export type AccountRole = 'admin' | 'user';

export const normalizeAccountEmail = (email: string): string => email.trim().toLowerCase();

export const isValidAccountEmail = (email: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export const isAccountRole = (role: unknown): role is AccountRole =>
  role === 'admin' || role === 'user';