'use client';

import { authClient } from '@/lib/auth-client';

interface AuthControlsProps {
  email: string;
}

const AuthControls = ({ email }: AuthControlsProps) => {
  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.assign('/sign-in');
  };

  return (
    <div className='flex items-center justify-between gap-4 rounded-lg border bg-white px-4 py-3 text-sm'>
      <span className='truncate text-gray-600'>{email}</span>
      <button type='button' onClick={handleSignOut} className='shrink-0 font-medium text-gray-900 hover:text-gray-600'>
        Sign out
      </button>
    </div>
  );
};

export default AuthControls;