export type AccountStatus = 'active' | 'suspended' | 'banned';

export function isRestrictedStatus(status?: string | null) {
  return status === 'suspended' || status === 'banned';
}

export function getAccountStatusMessage(status?: string | null) {
  if (status === 'suspended') {
    return 'Your account is suspended. Please contact Trex-O support before using buyer or seller actions.';
  }

  if (status === 'banned') {
    return 'Your account is banned and cannot use Trex-O buyer or seller services.';
  }

  return '';
}
