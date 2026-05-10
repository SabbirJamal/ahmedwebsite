import { useState } from 'react';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Eye,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Truck,
  User,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { supabase } from '../../lib/supabase';
import { middleEastCountries } from './countries';

export function RegisterPage() {
  const [selectedCountry, setSelectedCountry] = useState(middleEastCountries[0]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const passwordsDoNotMatch =
    confirmPassword.length > 0 && password !== confirmPassword;
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  return (
    <main className="app-shell register-shell">
      <Header />

      <section className="register-page">
        <div className="register-intro">
          <div className="register-intro-content">
            <span className="register-kicker">Supplier and buyer access</span>
            <h1>Build your construction business network across the region.</h1>
            <p>
              Create your Equipara account to rent, purchase, sell, and move
              construction equipment with trusted companies.
            </p>
            <div className="register-stats" aria-hidden="true">
              <span>
                <Building2 />
                Companies
              </span>
              <span>
                <Truck />
                Transport
              </span>
              <span>
                <ShieldCheck />
                Verified access
              </span>
            </div>
          </div>
        </div>

        <div className="register-panel-wrap">
          <form
            className="register-panel"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = event.currentTarget;
              setErrorMessage('');
              setStatusMessage('');

              if (password !== confirmPassword) {
                setErrorMessage('Passwords must match.');
                return;
              }

              const formData = new FormData(form);
              setIsSubmitting(true);

              try {
                const response = await fetch(`${apiUrl}/api/auth/register`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    fullName: formData.get('fullName'),
                    email: formData.get('email'),
                    country: selectedCountry.name,
                    phoneCode: selectedCountry.code,
                    phoneNumber: formData.get('phone'),
                    city: formData.get('city'),
                    password,
                    confirmPassword,
                    termsAccepted: formData.get('terms') === 'on',
                  }),
                });
                const result = (await response.json()) as { message?: string };

                if (!response.ok) {
                  throw new Error(result.message || 'Could not create account.');
                }

                const email = String(formData.get('email') || '');

                if (supabase) {
                  await supabase.auth.signInWithPassword({
                    email,
                    password,
                  });
                }

                setStatusMessage('Account created successfully. You are now registered as a buyer.');
                form.reset();
                setPassword('');
                setConfirmPassword('');
                setSelectedCountry(middleEastCountries[0]);
                window.location.assign('/');
              } catch (error) {
                setErrorMessage(
                  error instanceof Error
                    ? error.message
                    : 'Could not create account.',
                );
              } finally {
                setIsSubmitting(false);
              }
            }}
          >
            <div className="register-heading">
              <p>Create Account</p>
              <h2>Register with Equipara</h2>
            </div>

            <label className="register-field">
              <span>Full name</span>
              <div className="register-input">
                <User aria-hidden="true" />
                <input
                  autoComplete="name"
                  name="fullName"
                  placeholder="Enter your full name"
                  required
                  type="text"
                />
              </div>
            </label>

            <label className="register-field">
              <span>Email address</span>
              <div className="register-input">
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

            <label className="register-field">
              <span>Country</span>
              <div className="register-input select-input">
                <MapPin aria-hidden="true" />
                <select
                  name="country"
                  required
                  value={selectedCountry.name}
                  onChange={(event) => {
                    const country = middleEastCountries.find(
                      (item) => item.name === event.target.value,
                    );

                    if (country) {
                      setSelectedCountry(country);
                    }
                  }}
                >
                  {middleEastCountries.map((country) => (
                    <option key={country.name} value={country.name}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" />
              </div>
            </label>

            <label className="register-field">
              <span>City</span>
              <div className="register-input">
                <MapPin aria-hidden="true" />
                <input
                  autoComplete="address-level2"
                  name="city"
                  placeholder="Enter your city"
                  required
                  type="text"
                />
              </div>
            </label>

            <label className="register-field">
              <span>Phone number</span>
              <div className="register-input phone-input">
                <Phone aria-hidden="true" />
                <span className="phone-code">{selectedCountry.code}</span>
                <input
                  autoComplete="tel-national"
                  inputMode="tel"
                  name="phone"
                  placeholder="Enter phone number"
                  required
                  type="tel"
                />
              </div>
            </label>

            <label className="register-field">
              <span>Password</span>
              <div className="register-input">
                <LockKeyhole aria-hidden="true" />
                <input
                  autoComplete="new-password"
                  name="password"
                  placeholder="Create a password"
                  required
                  type={isPasswordVisible ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
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

            <label className="register-field">
              <span>Confirm password</span>
              <div
                className={`register-input ${
                  passwordsDoNotMatch ? 'input-error' : ''
                }`}
              >
                <LockKeyhole aria-hidden="true" />
                <input
                  autoComplete="new-password"
                  name="confirmPassword"
                  placeholder="Confirm your password"
                  required
                  type={isConfirmPasswordVisible ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
                <button
                  aria-label={
                    isConfirmPasswordVisible ? 'Hide password' : 'Show password'
                  }
                  type="button"
                  onClick={() =>
                    setIsConfirmPasswordVisible((isVisible) => !isVisible)
                  }
                >
                  <Eye aria-hidden="true" />
                </button>
              </div>
              {passwordsDoNotMatch && (
                <strong className="field-error">Passwords must match.</strong>
              )}
            </label>

            <label className="terms-option">
              <input name="terms" required type="checkbox" />
              <span>
                I agree to the <a href="/terms">Terms of Service</a> and{' '}
                <a href="/privacy">Privacy Policy</a>.
              </span>
            </label>

            <button className="register-submit" disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
              <ArrowRight aria-hidden="true" />
            </button>

            {errorMessage && <p className="form-message error">{errorMessage}</p>}
            {statusMessage && <p className="form-message success">{statusMessage}</p>}

            <p className="login-link">
              Already have an account? <a href="/login">Sign In</a>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
