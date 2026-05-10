import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Building2,
  MapPin,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { supabase } from '../../lib/supabase';

export function BecomeSellerPage() {
  const [sellerPhone, setSellerPhone] = useState('');
  const [sellerCity, setSellerCity] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    async function loadProfileDefaults() {
      if (!supabase) {
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.assign('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('phone, city, is_seller')
        .eq('id', user.id)
        .single();

      if (data?.is_seller) {
        window.location.assign('/seller');
        return;
      }

      setSellerPhone(data?.phone || '');
      setSellerCity(data?.city || '');
    }

    void loadProfileDefaults();
  }, []);

  return (
    <main className="app-shell seller-shell">
      <Header />
      <section className="seller-page">
        <div className="seller-copy">
          <span className="register-kicker">Seller access</span>
          <h1>Start selling equipment and transport services.</h1>
          <p>
            Add your company details and commercial registration information to
            unlock seller tools on Equipara.
          </p>
        </div>

        <form
          className="seller-panel"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            setErrorMessage('');
            setStatusMessage('');

            if (!supabase) {
              setErrorMessage('Supabase is not configured.');
              return;
            }

            const {
              data: { session },
            } = await supabase.auth.getSession();

            if (!session) {
              window.location.assign('/login');
              return;
            }

            const formData = new FormData(form);
            setIsSubmitting(true);

            try {
              const response = await fetch(`${apiUrl}/api/sellers/profile`, {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  companyName: formData.get('companyName'),
                  crNumber: formData.get('crNumber'),
                  phone: formData.get('phone'),
                  locationCity: formData.get('locationCity'),
                }),
              });
              const result = (await response.json()) as { message?: string };

              if (!response.ok) {
                throw new Error(
                  result.message || 'Could not create seller profile.',
                );
              }

              setStatusMessage('Seller profile created successfully.');
              window.location.assign('/seller');
            } catch (error) {
              setErrorMessage(
                error instanceof Error
                  ? error.message
                  : 'Could not create seller profile.',
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <div className="register-heading">
            <p>Seller Profile</p>
            <h2>Company details</h2>
          </div>

          <label className="register-field">
            <span>Company name</span>
            <div className="register-input">
              <Building2 aria-hidden="true" />
              <input
                name="companyName"
                placeholder="Enter company name"
                required
                type="text"
              />
            </div>
          </label>

          <label className="register-field">
            <span>CR number</span>
            <div className="register-input">
              <ShieldCheck aria-hidden="true" />
              <input
                name="crNumber"
                placeholder="Enter commercial registration number"
                required
                type="text"
              />
            </div>
          </label>

          <label className="register-field">
            <span>Phone</span>
            <div className="register-input">
              <Phone aria-hidden="true" />
              <input
                name="phone"
                placeholder="Enter seller phone"
                required
                type="tel"
                value={sellerPhone}
                onChange={(event) => setSellerPhone(event.target.value)}
              />
            </div>
          </label>

          <label className="register-field">
            <span>Location city</span>
            <div className="register-input">
              <MapPin aria-hidden="true" />
              <input
                name="locationCity"
                placeholder="Enter seller city"
                required
                type="text"
                value={sellerCity}
                onChange={(event) => setSellerCity(event.target.value)}
              />
            </div>
          </label>

          <button className="register-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Creating Seller Profile...' : 'Create Seller Profile'}
            <ArrowRight aria-hidden="true" />
          </button>

          {errorMessage && <p className="form-message error">{errorMessage}</p>}
          {statusMessage && <p className="form-message success">{statusMessage}</p>}
        </form>
      </section>
    </main>
  );
}
