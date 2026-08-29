const getConfiguredEmails = (value: string | undefined): Set<string> =>
  new Set(
    (value ?? '')
      .split(',')
      .map((configuredEmail) => configuredEmail.trim().toLowerCase())
      .filter(Boolean),
  );

export const isApprovedSignupEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;

  return getConfiguredEmails(process.env.APPROVED_SIGNUP_EMAILS).has(email.trim().toLowerCase());
};

export const isFullAccessEmail = (email: string | null | undefined): boolean => {
  if (!email) return false;

  return getConfiguredEmails(process.env.FULL_ACCESS_EMAILS).has(email.trim().toLowerCase());
};

export const getSignupRole = (email: string): 'admin' | 'user' =>
  isFullAccessEmail(email) ? 'admin' : 'user';