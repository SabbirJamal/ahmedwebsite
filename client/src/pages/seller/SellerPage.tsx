import { useEffect, useState } from 'react';
import { Edit3, MapPin, Trash2 } from 'lucide-react';
import { Header } from '../../components/Header';
import { fleetTypes } from '../../lib/fleet-options';
import { supabase } from '../../lib/supabase';
import type { SellerListing } from './types';

export function SellerPage() {
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  useEffect(() => {
    async function loadListings() {
      if (!supabase) {
        setErrorMessage('Supabase is not configured.');
        setIsLoading(false);
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.assign('/login');
        return;
      }

      try {
        const response = await fetch(`${apiUrl}/api/fleet/listings/mine`, {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        const result = (await response.json()) as {
          listings?: SellerListing[];
          message?: string;
        };

        if (!response.ok) {
          throw new Error(result.message || 'Could not load listings.');
        }

        setListings(result.listings || []);
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'Could not load listings.',
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadListings();
  }, [apiUrl]);

  async function updateListingStatus(listingId: string, isActive: boolean) {
    if (!supabase) {
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      window.location.assign('/login');
      return;
    }

    const previousListings = listings;
    setListings((currentListings) =>
      currentListings.map((listing) =>
        listing.id === listingId ? { ...listing, is_active: isActive } : listing,
      ),
    );

    try {
      const response = await fetch(
        `${apiUrl}/api/fleet/listings/${listingId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isActive }),
        },
      );
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || 'Could not update status.');
      }
    } catch (error) {
      setListings(previousListings);
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not update status.',
      );
    }
  }

  return (
    <main className="app-shell seller-home-shell">
      <Header />
      <section className="seller-dashboard">
        <div className="seller-dashboard-heading">
          <div>
            <h1>My Listings</h1>
            <p>Manage your equipment and transport listings</p>
          </div>
          <a className="add-item-link dashboard-add-link" href="/seller/add-item">
            <span aria-hidden="true">+</span>
            Add New Listing
          </a>
        </div>

        {errorMessage && <p className="form-message error">{errorMessage}</p>}
        {isLoading && <p className="seller-empty">Loading listings...</p>}
        {!isLoading && listings.length === 0 && (
          <p className="seller-empty">No listings added yet.</p>
        )}

        <div className="listing-table">
          <div className="listing-table-head">
            <span>Listing</span>
            <span>Type</span>
            <span>Location</span>
            <span>Daily Rate</span>
            <span>Status</span>
            <span>Date</span>
            <span>Actions</span>
          </div>
          {listings.map((listing) => {
            const typeLabel =
              fleetTypes.find((item) => item.value === listing.sub_type)?.label ||
              listing.sub_type;

            return (
              <article className="listing-row" key={listing.id}>
                <div className="listing-name-cell">
                  <img alt={listing.name} src={listing.photos[0]} />
                  <div>
                    <strong>{listing.name}</strong>
                    <span>
                      {listing.brand} {listing.model} {listing.year}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="type-badge">{typeLabel}</span>
                </div>
                <div className="location-cell">
                  <MapPin aria-hidden="true" />
                  {listing.location_city}
                </div>
                <strong className="daily-rate">{listing.daily_rate_omr} OMR</strong>
                <div>
                  <select
                    aria-label="Listing status"
                    className={`status-select ${
                      listing.is_active ? 'active' : 'inactive'
                    }`}
                    value={listing.is_active ? 'active' : 'inactive'}
                    onChange={(event) =>
                      void updateListingStatus(
                        listing.id,
                        event.target.value === 'active',
                      )
                    }
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Not Active</option>
                  </select>
                </div>
                <span className="date-cell">
                  {new Intl.DateTimeFormat('en', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(listing.created_at))}
                </span>
                <div className="table-actions">
                  <button aria-label="Edit listing" type="button">
                    <Edit3 aria-hidden="true" />
                  </button>
                  <button aria-label="Delete listing" type="button">
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
