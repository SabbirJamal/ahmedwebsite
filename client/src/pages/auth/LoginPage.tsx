import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { supabase } from '../../lib/supabase';

export function LoginPage() {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <main className="app-shell login-shell">
      <Header />

      <section className="login-page">
        <div className="login-visual" aria-hidden="true">
          <div className="visual-content">
            <div className="visual-badge">
              <Truck />
              Equipment and transport network
            </div>
            <h1>Manage construction deals from one trusted workspace.</h1>
            <div className="visual-points">
              <span>
                <CheckCircle2 />
                Verified supplier access
              </span>
              <span>
                <CheckCircle2 />
                Rental and purchase ready
              </span>
              <span>
                <CheckCircle2 />
                Transport partners in one place
              </span>
            </div>
          </div>
        </div>

        <div className="login-panel-wrap">
          <form
            className="login-panel"
            onSubmit={async (event) => {
              event.preventDefault();
              setErrorMessage('');
              setStatusMessage('');

              if (!supabase) {
                setErrorMessage('Supabase is not configured.');
                return;
              }

              const formData = new FormData(event.currentTarget);
              const email = String(formData.get('email') || '').trim();
              const passwordValue = String(formData.get('password') || '');

              if (!email || !passwordValue) {
                setErrorMessage('Please enter your email and password.');
                return;
              }

              setIsSubmitting(true);

              try {
                const { data, error } = await supabase.auth.signInWithPassword({
                  email,
                  password: passwordValue,
                });

                if (error) {
                  throw error;
                }

                const { data: profile } = await supabase
                  .from('profiles')
                  .select('full_name')
                  .eq('id', data.user.id)
                  .single();

                setStatusMessage(
                  profile?.full_name
                    ? `Signed in successfully. Welcome, ${profile.full_name}.`
                    : 'Signed in successfully.',
                );
                window.location.assign('/');
              } catch (error) {
                setErrorMessage(
                  error instanceof Error ? error.message : 'Could not sign in.',
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="form-heading">
              <span className="form-icon">
                <ShieldCheck aria-hidden="true" />
              </span>
              <p>Welcome back</p>
              <h2>Sign in to Trex-O</h2>
            </div>

            <label className="field">
              <span>Email address</span>
              <div className="input-wrap">
                <Mail aria-hidden="true" />
                <input
                  autoComplete="email"
                  name="email"
                  placeholder="name@company.com"
                  required
                  type="email"
                />
              </div>
            </label>

            <label className="field">
              <span>Password</span>
              <div className="input-wrap">
                <LockKeyhole aria-hidden="true" />
                <input
                  autoComplete="current-password"
                  name="password"
                  placeholder="Enter your password"
                  required
                  type={isPasswordVisible ? 'text' : 'password'}
                />
                <button
                  aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
                  type="button"
                  onClick={() => setIsPasswordVisible((isVisible) => !isVisible)}
                >
                  <Eye aria-hidden="true" />
                </button>
              </div>
            </label>

            <div className="form-row">
              <label className="remember-option">
                <input name="remember" type="checkbox" />
                <span>Remember me</span>
              </label>
              <a href="/forgot-password">Forgot password?</a>
            </div>

            <button className="login-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Signing In...' : 'Sign In'}
              <ArrowRight aria-hidden="true" />
            </button>

            {errorMessage && <p className="form-message error">{errorMessage}</p>}
            {statusMessage && <p className="form-message success">{statusMessage}</p>}

            <p className="signup-text">
              Don't have an account? <a href="/register">Create Account</a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
