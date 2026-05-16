import { supabaseAdmin } from './supabase.js';

export type AccountStatus = 'active' | 'suspended' | 'banned';

type AccountProfile = {
  id: string;
  is_seller: boolean;
  status: AccountStatus | null;
};

export function getAccountStatusMessage(status: AccountStatus) {
  if (status === 'suspended') {
    return 'Your account is suspended. Please contact Trex-O support for help.';
  }

  if (status === 'banned') {
    return 'Your account is banned and cannot use Trex-O services.';
  }

  return '';
}

export async function getAuthenticatedProfile(token?: string) {
  if (!supabaseAdmin) {
    return {
      error: 'Supabase service role key is not configured on the server.',
      statusCode: 500,
    };
  }

  if (!token) {
    return { error: 'Please sign in first.', statusCode: 401 };
  }

  const { data: userData, error: userError } =
    await supabaseAdmin.auth.getUser(token);

  if (userError || !userData.user) {
    return { error: 'Your session has expired.', statusCode: 401 };
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, is_seller, status')
    .eq('id', userData.user.id)
    .single<AccountProfile>();

  if (profileError || !profile) {
    return { error: 'User profile was not found.', statusCode: 404 };
  }

  return {
    profile: {
      ...profile,
      status: profile.status || 'active',
    },
    userId: userData.user.id,
  };
}

export async function getActiveProfile(token?: string) {
  const result = await getAuthenticatedProfile(token);

  if (!result.profile) {
    return result;
  }

  if (result.profile.status !== 'active') {
    return {
      error: getAccountStatusMessage(result.profile.status),
      profile: result.profile,
      statusCode: 403,
      userId: result.userId,
    };
  }

  return result;
}
