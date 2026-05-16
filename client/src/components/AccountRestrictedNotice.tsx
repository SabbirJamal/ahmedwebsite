import { Header } from './Header';
import { getAccountStatusMessage } from '../lib/accountStatus';

export function AccountRestrictedNotice({
  status,
}: {
  status?: string | null;
}) {
  return (
    <main className="app-shell account-restricted-shell">
      <Header />
      <section className="account-restricted-card">
        <span>Account restricted</span>
        <h1>{status === 'banned' ? 'Account banned' : 'Account suspended'}</h1>
        <p>{getAccountStatusMessage(status)}</p>
      </section>
    </main>
  );
}
