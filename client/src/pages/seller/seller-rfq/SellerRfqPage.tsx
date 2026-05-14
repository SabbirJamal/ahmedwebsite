import { useCallback, useEffect, useState } from 'react';
import { ImagePlus, Send, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../../components/Header';
import { apiFetch } from '../../../lib/api';
import { fleetTypes, type FleetCategory } from '../../../lib/fleet-options';
import { supabase } from '../../../lib/supabase';
import {
  removeUploadedRfqQuotePhotos,
  uploadRfqQuotePhotos,
} from './rfqQuotePhotoUpload';

type SellerRfqItem = {
  id: string;
  category: FleetCategory;
  sub_type: string;
  duration_type: 'day' | 'week' | 'month';
  duration_value: number;
  specs: Array<{ key: string; label: string; unit: string; value: string }>;
  additional_notes: string | null;
  status: 'open' | 'closed' | 'cancelled';
  created_at: string;
  customer_info?: {
    companyName?: string | null;
    contactPerson?: string;
    country?: string;
    email?: string;
    mobileNumber?: string;
  };
  seller_quote?: {
    id: string;
    status: 'submitted' | 'withdrawn' | 'accepted' | 'rejected';
  } | null;
};

export function SellerRfqPage() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<SellerRfqItem[]>([]);
  const [activeRfq, setActiveRfq] = useState<SellerRfqItem | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [quoteErrorMessage, setQuoteErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSendingOffer, setIsSendingOffer] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);

  const loadRfqs = useCallback(async () => {
    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      setIsLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    try {
      const response = await apiFetch('/api/rfqs/open', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const result = (await response.json()) as {
        message?: string;
        rfqs?: SellerRfqItem[];
      };

      if (!response.ok) {
        throw new Error(result.message || 'Could not load RFQs.');
      }

      setRfqs(result.rfqs || []);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not load RFQs.');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void loadRfqs();
  }, [loadRfqs]);

  async function handleSendOffer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setQuoteErrorMessage('');
    setSuccessMessage('');

    if (!activeRfq) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const priceAmount = Number(formData.get('priceAmount') || 0);
    const hoursUsed = Number(formData.get('hoursUsed') || 0);
    const notes = String(formData.get('notes') || '').trim();

    if (!Number.isFinite(priceAmount) || priceAmount <= 0) {
      setQuoteErrorMessage('Please enter a valid price.');
      return;
    }

    if (!Number.isInteger(hoursUsed) || hoursUsed < 0) {
      setQuoteErrorMessage('Please enter valid hours used.');
      return;
    }

    if (photoFiles.length < 1 || photoFiles.length > 4) {
      setQuoteErrorMessage('Please upload between 1 and 4 photos.');
      return;
    }

    if (!supabase) {
      setQuoteErrorMessage('Supabase is not configured.');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    setIsSendingOffer(true);
    let uploadedPhotos: Array<{ path: string; publicUrl: string }> = [];

    try {
      uploadedPhotos = await uploadRfqQuotePhotos(photoFiles, session.user.id);

      const response = await apiFetch(`/api/rfqs/${activeRfq.id}/quotes`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hoursUsed,
          notes,
          photos: uploadedPhotos.map((photo) => photo.publicUrl),
          priceAmount,
        }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        await removeUploadedRfqQuotePhotos(uploadedPhotos.map((photo) => photo.path));
        throw new Error(result.message || 'Could not send offer.');
      }

      setActiveRfq(null);
      setPhotoFiles([]);
      setSuccessMessage('Offer sent successfully.');
      void loadRfqs();
    } catch (error) {
      setQuoteErrorMessage(
        error instanceof Error ? error.message : 'Could not send offer.',
      );
    } finally {
      setIsSendingOffer(false);
    }
  }

  return (
    <main className="app-shell rfq-shell">
      <Header />
      <section className="rfq-page seller-rfq-page">
        <div className="rfq-heading">
          <div>
            <h1>RFQs</h1>
            <p>Browse open rental quotation requests from buyers.</p>
          </div>
        </div>

        {errorMessage && <p className="form-message error">{errorMessage}</p>}
        {successMessage && <p className="form-message success">{successMessage}</p>}
        {isLoading && <p className="seller-empty">Loading RFQs...</p>}
        {!isLoading && rfqs.length === 0 && (
          <p className="seller-empty">No open RFQs available.</p>
        )}

        <div className="rfq-list">
          {rfqs.map((rfq) => {
            const itemLabel =
              fleetTypes.find((item) => item.value === rfq.sub_type)?.label ||
              rfq.sub_type;

            return (
              <article className="rfq-card seller-rfq-card" key={rfq.id}>
                <div>
                  <h2>{itemLabel}</h2>
                  <p>{rfq.category === 'equipment' ? 'Equipment' : 'Transport'}</p>
                  <p>
                    Duration: {rfq.duration_value} {rfq.duration_type}
                    {rfq.duration_value === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="rfq-spec-preview">
                  {rfq.specs?.length ? (
                    rfq.specs.map((spec) => (
                      <span key={spec.key}>
                        {spec.label}: {spec.value}
                        {spec.unit ? ` ${spec.unit}` : ''}
                      </span>
                    ))
                  ) : (
                    <span>No specifications added</span>
                  )}
                </div>

                <div className="seller-rfq-meta">
                  <strong>{rfq.customer_info?.companyName || 'Buyer RFQ'}</strong>
                  <span>{rfq.customer_info?.contactPerson || 'Contact not provided'}</span>
                  <span>{rfq.customer_info?.country || 'Country not provided'}</span>
                  <time>
                    {new Intl.DateTimeFormat('en', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(rfq.created_at))}
                  </time>
                  <button
                    disabled={Boolean(rfq.seller_quote)}
                    type="button"
                    onClick={() => {
                      setQuoteErrorMessage('');
                      setPhotoFiles([]);
                      setActiveRfq(rfq);
                    }}
                  >
                    <Send aria-hidden="true" />
                    {rfq.seller_quote ? 'Offer Sent' : 'Send Offer'}
                  </button>
                </div>

                {rfq.additional_notes && (
                  <p className="seller-rfq-notes">{rfq.additional_notes}</p>
                )}
              </article>
            );
          })}
        </div>
      </section>

      {activeRfq && (
        <div className="rfq-modal-backdrop">
          <form className="rfq-modal quote-modal" noValidate onSubmit={handleSendOffer}>
            <div className="rfq-modal-heading">
              <div>
                <h2>Send Offer</h2>
                <p>
                  {fleetTypes.find((item) => item.value === activeRfq.sub_type)?.label ||
                    activeRfq.sub_type}
                </p>
              </div>
              <button type="button" onClick={() => setActiveRfq(null)}>
                <X aria-hidden="true" />
              </button>
            </div>

            <section className="rfq-form-section">
              <div className="rfq-form-grid">
                <label>
                  <span>Price per {activeRfq.duration_type}</span>
                  <input
                    min="0"
                    name="priceAmount"
                    placeholder={`Enter price per ${activeRfq.duration_type}`}
                    required
                    step="0.001"
                    type="number"
                  />
                </label>
                <label>
                  <span>Hours Used</span>
                  <input
                    min="0"
                    name="hoursUsed"
                    placeholder="Enter hours used"
                    required
                    step="1"
                    type="number"
                  />
                </label>
              </div>

              <label className="quote-photo-upload">
                <ImagePlus aria-hidden="true" />
                <span>Upload 1 to 4 photos</span>
                <input
                  accept="image/*"
                  multiple
                  type="file"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []).slice(0, 4);
                    setPhotoFiles(files);
                  }}
                />
              </label>
              <p className="photo-count">{photoFiles.length} photos selected</p>

              <label className="rfq-wide-field">
                <span>Notes</span>
                <textarea
                  name="notes"
                  placeholder="Add any offer notes or included rental terms."
                />
              </label>
            </section>

            {quoteErrorMessage && (
              <p className="form-message error">{quoteErrorMessage}</p>
            )}

            <button className="rfq-submit-button" disabled={isSendingOffer} type="submit">
              {isSendingOffer ? 'Sending Offer...' : 'Send Offer'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
