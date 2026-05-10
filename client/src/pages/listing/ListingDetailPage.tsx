import { useEffect, useState } from 'react';
import {
  Building2,
  CalendarDays,
  FileText,
  MapPin,
  Phone,
  X,
} from 'lucide-react';
import { Header } from '../../components/Header';
import { fleetTypes, specOptions } from '../../lib/fleet-options';
import { supabase } from '../../lib/supabase';

type ListingDetail = {
  id: string;
  category: string;
  sub_type: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  location_city: string;
  daily_rate_omr: number;
  weekly_rate_omr: number;
  monthly_rate_omr: number;
  hours_used: number | null;
  photos: string[];
  description: string | null;
  lift_capacity_tons: number | null;
  boom_length_meters: number | null;
  deck_length_ft: number | null;
  load_capacity_tons: number | null;
  max_height_meters: number | null;
  axle_count: number | null;
  additional_specs: Record<string, string | number>;
  created_at: string;
  seller_profiles?: {
    company_name?: string;
    phone?: string;
    location_city?: string;
    profiles?: {
      country?: string;
      city?: string;
    };
  };
};

const searchableSpecLabels: Record<string, string> = {
  lift_capacity_tons: 'Lift Capacity',
  boom_length_meters: 'Boom Length',
  deck_length_ft: 'Deck Length',
  load_capacity_tons: 'Load Capacity',
  max_height_meters: 'Max Height',
  axle_count: 'Axle Count',
};

export function ListingDetailPage({ listingId }: { listingId: string }) {
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
  const [isBookingFormOpen, setIsBookingFormOpen] = useState(false);
  const [bookingMessage, setBookingMessage] = useState('');
  const [isSendingBooking, setIsSendingBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    async function loadListing() {
      try {
        const response = await fetch(`${apiUrl}/api/fleet/listings/${listingId}`);
        const result = (await response.json()) as {
          listing?: ListingDetail;
          message?: string;
        };

        if (!response.ok || !result.listing) {
          throw new Error(result.message || 'Listing was not found.');
        }

        setListing(result.listing);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Listing was not found.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadListing();
  }, [apiUrl, listingId]);

  if (isLoading) {
    return (
      <main className="app-shell listing-detail-shell">
        <Header />
        <p className="seller-empty">Loading listing...</p>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="app-shell listing-detail-shell">
        <Header />
        <p className="form-message error">{errorMessage}</p>
      </main>
    );
  }

  const typeLabel =
    fleetTypes.find((item) => item.value === listing.sub_type)?.label ||
    listing.sub_type;
  const specRows = buildSpecRows(listing);

  return (
    <main className="app-shell listing-detail-shell">
      <Header />
      <section className="listing-detail-page">
        <div className="listing-gallery">
          <img alt={listing.name} src={listing.photos[0]} />
          {listing.photos.length > 1 && (
            <div className="listing-thumbs">
              {listing.photos.slice(1).map((photo) => (
                <img alt={listing.name} key={photo} src={photo} />
              ))}
            </div>
          )}
        </div>

        <article className="listing-detail-content">
          <span className="detail-type-badge">{typeLabel}</span>
          <h1>{listing.name}</h1>

          <div className="detail-facts">
            <Fact label="Brand" value={listing.brand} />
            <Fact label="Model" value={listing.model} />
            <Fact label="Year" value={listing.year} />
            <Fact label="Hours Used" value={listing.hours_used ?? 'Not specified'} />
          </div>

          <p className="detail-location">
            <MapPin aria-hidden="true" />
            {listing.location_city}
          </p>

          <div className="rate-card">
            <div>
              <strong>{listing.daily_rate_omr}</strong>
              <span>OMR / day</span>
            </div>
            <div>
              <span>Weekly</span>
              <strong>{listing.weekly_rate_omr} OMR</strong>
            </div>
            <div>
              <span>Monthly</span>
              <strong>{listing.monthly_rate_omr} OMR</strong>
            </div>
          </div>

          {specRows.length > 0 && (
            <section className="detail-section">
              <h2>Specifications</h2>
              <div className="spec-grid">
                {specRows.map((row) => (
                  <div key={row.label}>
                    <span>{row.label}</span>
                    <strong>{row.value}</strong>
                  </div>
                ))}
              </div>
            </section>
          )}

          {listing.description && (
            <section className="detail-section">
              <h2>Notes</h2>
              <p>{listing.description}</p>
            </section>
          )}

          <button
            className="request-item-button"
            type="button"
            onClick={async () => {
              const {
                data: { session },
              } = supabase
                ? await supabase.auth.getSession()
                : { data: { session: null } };

              if (!session) {
                setIsLoginPromptOpen(true);
                return;
              }

              setBookingMessage('');
              setIsBookingFormOpen(true);
            }}
          >
            Request This Item
          </button>

          <section className="detail-section seller-detail-card">
            <h2>About the Seller</h2>
            <div>
              <p>
                <Building2 aria-hidden="true" />
                <strong>{listing.seller_profiles?.company_name || 'Equipara Seller'}</strong>
              </p>
              <p>
                <MapPin aria-hidden="true" />
                {listing.seller_profiles?.location_city ||
                  listing.seller_profiles?.profiles?.city ||
                  listing.location_city}
              </p>
              <p>
                <Phone aria-hidden="true" />
                {listing.seller_profiles?.phone || 'Phone not available'}
              </p>
            </div>
          </section>

          <p className="posted-date">
            <CalendarDays aria-hidden="true" />
            Posted on{' '}
            {new Intl.DateTimeFormat('en', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            }).format(new Date(listing.created_at))}
          </p>
        </article>
      </section>

      {isLoginPromptOpen && (
        <div className="login-prompt-backdrop" role="presentation">
          <div aria-modal="true" className="login-prompt" role="dialog">
            <h2>You need to log in to request order.</h2>
            <div className="login-prompt-actions">
              <a href="/login">Login</a>
              <button type="button" onClick={() => setIsLoginPromptOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isBookingFormOpen && (
        <div className="request-modal-backdrop" role="presentation">
          <form
            aria-label="Request this item"
            className="request-modal"
            noValidate
            onSubmit={async (event) => {
              event.preventDefault();
              setBookingMessage('');
              const form = event.currentTarget;
              const formData = new FormData(form);
              const startDate = String(formData.get('startDate') || '');
              const endDate = String(formData.get('endDate') || '');
              const pickupLocation = String(formData.get('pickupLocation') || '').trim();
              const notes = String(formData.get('notes') || '');

              if (!startDate || !endDate || !pickupLocation) {
                setBookingMessage('Please fill all required fields.');
                return;
              }

              if (new Date(endDate) < new Date(startDate)) {
                setBookingMessage('End date must be after the start date.');
                return;
              }

              if (!supabase) {
                setBookingMessage('Supabase is not configured.');
                return;
              }

              const {
                data: { session },
              } = await supabase.auth.getSession();

              if (!session) {
                setIsBookingFormOpen(false);
                setIsLoginPromptOpen(true);
                return;
              }

              setIsSendingBooking(true);

              try {
                const response = await fetch(`${apiUrl}/api/bookings`, {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    listingId: listing.id,
                    startDate,
                    endDate,
                    pickupLocation,
                    notes,
                  }),
                });
                const result = (await response.json()) as { message?: string };

                if (!response.ok) {
                  throw new Error(result.message || 'Could not send request.');
                }

                setIsBookingFormOpen(false);
                setBookingMessage('Request sent successfully.');
              } catch (error) {
                setBookingMessage(
                  error instanceof Error ? error.message : 'Could not send request.',
                );
              } finally {
                setIsSendingBooking(false);
              }
            }}
          >
            <div className="request-modal-heading">
              <h2>Request This Item</h2>
              <button
                aria-label="Close request form"
                type="button"
                onClick={() => setIsBookingFormOpen(false)}
              >
                <X aria-hidden="true" />
              </button>
            </div>

            <div className="request-item-strip">
              <FileText aria-hidden="true" />
              <span>{listing.name}</span>
            </div>

            <div className="request-grid">
              <label>
                <span>Start Date *</span>
                <input name="startDate" required type="date" />
              </label>
              <label>
                <span>End Date *</span>
                <input name="endDate" required type="date" />
              </label>
              <label>
                <span>Pickup Location *</span>
                <input
                  name="pickupLocation"
                  placeholder="e.g., Sohar Industrial Area"
                  required
                />
              </label>
            </div>

            <label className="request-notes">
              <span>Notes</span>
              <textarea name="notes" placeholder="Any special requirements..." />
            </label>

            <button
              className="send-request-button"
              disabled={isSendingBooking}
              type="submit"
            >
              {isSendingBooking ? 'Sending...' : 'Send Request'}
            </button>
            {bookingMessage && <p className="form-message error">{bookingMessage}</p>}
          </form>
        </div>
      )}

      {bookingMessage && !isBookingFormOpen && (
        <p className="booking-toast form-message success">{bookingMessage}</p>
      )}
    </main>
  );
}

function Fact({ label, value }: { label: string; value: number | string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function buildSpecRows(listing: ListingDetail) {
  const rows: Array<{ label: string; value: string | number }> = [];
  const specDefinitions = specOptions[listing.sub_type] || [];

  Object.entries(searchableSpecLabels).forEach(([key, label]) => {
    const value = listing[key as keyof ListingDetail];

    if (value !== null && value !== undefined) {
      rows.push({ label, value: String(value) });
    }
  });

  Object.entries(listing.additional_specs || {}).forEach(([key, value]) => {
    const definition = specDefinitions.find((spec) => spec.key === key);
    rows.push({
      label: definition?.label || key.replace(/_/g, ' '),
      value: definition?.unit ? `${value} ${definition.unit}` : value,
    });
  });

  return rows;
}
