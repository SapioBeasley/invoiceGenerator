'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { AccountRole } from '@/lib/accountManagementRules';

interface ManagedAccount {
  email: string;
  name: string | null;
  status: 'pending' | 'created';
  accountType: AccountRole;
  allowedRole: AccountRole;
}

const AccountManagement = () => {
  const [accounts, setAccounts] = useState<ManagedAccount[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AccountRole>('user');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAccounts = async (): Promise<ManagedAccount[]> => {
    const response = await fetch('/api/admin/accounts');
    const result = (await response.json()) as { accounts?: ManagedAccount[]; error?: string };
    if (!response.ok) throw new Error(result.error ?? 'Unable to load account access.');
    return result.accounts ?? [];
  };

  useEffect(() => {
    let isActive = true;
    void fetchAccounts()
      .then((nextAccounts) => {
        if (!isActive) return;
        setAccounts(nextAccounts);
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (!isActive) return;
        setError(loadError instanceof Error ? loadError.message : 'Unable to load account access.');
        setIsLoading(false);
      });
    return () => {
      isActive = false;
    };
  }, []);

  const handleAdd = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      const result = (await response.json()) as { accounts?: ManagedAccount[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to add account access.');
      setAccounts(result.accounts ?? []);
      setEmail('');
      setError('');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to add account access.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRoleChange = async (accountEmail: string, nextRole: AccountRole) => {
    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail, role: nextRole }),
      });
      const result = (await response.json()) as { accounts?: ManagedAccount[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to update account type.');
      setAccounts(result.accounts ?? []);
      setError('');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update account type.');
    }
  };

  const handleRemove = async (accountEmail: string) => {
    if (!window.confirm(`Remove signup access for ${accountEmail}? Existing accounts will remain active.`)) return;

    try {
      const response = await fetch('/api/admin/accounts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: accountEmail }),
      });
      const result = (await response.json()) as { accounts?: ManagedAccount[]; error?: string };
      if (!response.ok) throw new Error(result.error ?? 'Unable to remove signup access.');
      setAccounts(result.accounts ?? []);
      setError('');
    } catch (removeError) {
      setError(removeError instanceof Error ? removeError.message : 'Unable to remove signup access.');
    }
  };

  return (
    <div className='mx-auto max-w-6xl space-y-6 p-6'>
      <Card>
        <CardHeader>
          <CardTitle>Account access</CardTitle>
          <CardDescription>Add email addresses that may create accounts. Existing accounts show their current status and role.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAdd} className='flex flex-col gap-4 md:flex-row md:items-end'>
            <div className='flex-1'>
              <Label htmlFor='allowedEmail'>Email address</Label>
              <Input id='allowedEmail' type='email' value={email} onChange={(event) => setEmail(event.target.value)} className='mt-2' required />
            </div>
            <div>
              <Label htmlFor='allowedRole'>Account type</Label>
              <select id='allowedRole' value={role} onChange={(event) => setRole(event.target.value as AccountRole)} className='mt-2 h-10 rounded-md border border-input bg-background px-3'>
                <option value='user'>User</option>
                <option value='admin'>Admin</option>
              </select>
            </div>
            <Button type='submit' disabled={isSaving}>{isSaving ? 'Saving...' : 'Allow signup'}</Button>
          </form>
          {error ? <p className='mt-4 text-sm text-red-600'>{error}</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Allowed email addresses</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <p className='text-sm text-gray-500'>Loading accounts...</p> : accounts.length === 0 ? <p className='text-sm text-gray-500'>No email addresses are currently allowed to sign up.</p> : (
            <div className='overflow-x-auto'>
              <table className='w-full text-left text-sm'>
                <thead><tr className='border-b text-gray-500'><th className='px-3 py-2 font-medium'>Email</th><th className='px-3 py-2 font-medium'>Name</th><th className='px-3 py-2 font-medium'>Signup status</th><th className='px-3 py-2 font-medium'>Account type</th><th className='px-3 py-2 font-medium'>Action</th></tr></thead>
                <tbody>{accounts.map((account) => <tr key={account.email} className='border-b last:border-0'><td className='px-3 py-3 font-medium text-gray-900'>{account.email}</td><td className='px-3 py-3 text-gray-600'>{account.name ?? '—'}</td><td className='px-3 py-3 capitalize text-gray-600'>{account.status}</td><td className='px-3 py-3'><select aria-label={`Account type for ${account.email}`} value={account.accountType} onChange={(event) => void handleRoleChange(account.email, event.target.value as AccountRole)} className='rounded-md border border-input bg-background px-2 py-1'><option value='user'>User</option><option value='admin'>Admin</option></select></td><td className='px-3 py-3'><Button type='button' variant='outline' onClick={() => void handleRemove(account.email)}>Remove signup access</Button></td></tr>)}</tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountManagement;