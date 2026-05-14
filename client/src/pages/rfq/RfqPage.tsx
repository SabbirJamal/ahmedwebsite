import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../../components/Header';
import { apiFetch } from '../../lib/api';
import {
  fleetTypes,
  specOptions,
  type FleetCategory,
  type SpecOption,
} from '../../lib/fleet-options';
import { supabase } from '../../lib/supabase';

type ProfileSnapshot = {
  country: string;
  email: string;
  full_name: string;
  phone: string;
};

type RfqSpecRow = {
  key: string;
  value: string;
};

type RfqItem = {
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
  };
  rfq_quotes?: Array<{
    id: string;
    price_amount: number;
    price_period: 'day' | 'week' | 'month';
    hours_used: number;
    photos: string[];
    notes: string | null;
    status: 'submitted' | 'withdrawn' | 'accepted' | 'rejected';
    created_at: string;
    seller_name?: string | null;
    seller_profiles?: {
      company_name?: string | null;
      location_city?: string | null;
      phone?: string | null;
    } | null;
  }>;
};

const emptySpecRow: RfqSpecRow = { key: '', value: '' };
const commonRfqSpecs: SpecOption[] = [
  { key: 'brand', label: 'Brand', unit: '', type: 'text' },
  { key: 'model_number', label: 'Model Number', unit: '', type: 'text' },
  { key: 'year', label: 'Year', unit: '', type: 'number' },
];
const gccCountryOptions = [
  'Oman',
  'Saudi Arabia',
  'Qatar',
  'Kuwait',
  'Bahrain',
  'Abu Dhabi',
];

export function RfqPage() {
  const navigate = useNavigate();
  const [rfqs, setRfqs] = useState<RfqItem[]>([]);
  const [profile, setProfile] = useState<ProfileSnapshot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRfq, setSelectedRfq] = useState<RfqItem | null>(null);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [category, setCategory] = useState<FleetCategory>('equipment');
  const [subType, setSubType] = useState('');
  const [specRows, setSpecRows] = useState<RfqSpecRow[]>([{ ...emptySpecRow }]);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [updatingQuoteId, setUpdatingQuoteId] = useState('');
  const [updatingRfqId, setUpdatingRfqId] = useState('');

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data } = await supabase
        .from('profiles')
        .select('full_name, email, phone, country')
        .eq('id', user.id)
        .single();

      setProfile(data);
    }

    try {
      const response = await apiFetch('/api/rfqs', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const result = (await response.json()) as {
        message?: string;
        rfqs?: RfqItem[];
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

  const itemOptions = useMemo(
    () => fleetTypes.filter((item) => item.category === category),
    [category],
  );
  const currentSpecOptions = subType
    ? [...commonRfqSpecs, ...(specOptions[subType] || [])]
    : [];

  function resetModal(nextCategory = category) {
    setCategory(nextCategory);
    setSubType('');
    setSpecRows([{ ...emptySpecRow }]);
    setErrorMessage('');
    setSuccessMessage('');
  }

  function updateSpecRow(index: number, field: keyof RfqSpecRow, value: string) {
    setSpecRows((rows) =>
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    );
  }

  function addSpecRow() {
    setSpecRows((rows) => [...rows, { ...emptySpecRow }]);
  }

  function removeSpecRow(index: number) {
    setSpecRows((rows) =>
      rows.length === 1 ? [{ ...emptySpecRow }] : rows.filter((_, i) => i !== index),
    );
  }

  async function handleCreateRfq(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const formData = new FormData(event.currentTarget);
    const companyName = String(formData.get('companyName') || '').trim();
    const contactPerson = String(formData.get('contactPerson') || '').trim();
    const mobileNumber = String(formData.get('mobileNumber') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const vatNumber = String(formData.get('vatNumber') || '').trim();
    const country = String(formData.get('country') || '').trim();
    const additionalNotes = String(formData.get('additionalNotes') || '').trim();
    const durationType = String(formData.get('durationType') || '');
    const durationValue = Number(formData.get('durationValue') || 0);
    const destinationCountry = String(formData.get('destinationCountry') || '').trim();
    const destinationFrom = String(formData.get('destinationFrom') || '').trim();
    const destinationTo = String(formData.get('destinationTo') || '').trim();
    const numberOfTrips = Number(formData.get('numberOfTrips') || 0);
    const numberOfUnits = Number(formData.get('numberOfUnits') || 0);

    if (!contactPerson || !mobileNumber || !email || !country) {
      setErrorMessage('Please fill the required customer information.');
      return;
    }

    if (!subType) {
      setErrorMessage('Please choose an item.');
      return;
    }

    if (
      !['day', 'week', 'month'].includes(durationType) ||
      !Number.isInteger(durationValue) ||
      durationValue < 1
    ) {
      setErrorMessage('Please select a valid time period.');
      return;
    }

    if (
      !Number.isInteger(numberOfTrips) ||
      numberOfTrips < 1 ||
      !Number.isInteger(numberOfUnits) ||
      numberOfUnits < 1 ||
      !destinationCountry ||
      !destinationFrom ||
      !destinationTo
    ) {
      setErrorMessage('Please fill the trips, quantity, and destination details.');
      return;
    }

    const incompleteSpec = specRows.some(
      (row) => (row.key && !row.value.trim()) || (!row.key && row.value.trim()),
    );

    if (incompleteSpec) {
      setErrorMessage('Please complete each specification row or remove it.');
      return;
    }

    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    const selectedSpecs = specRows
      .filter((row) => row.key && row.value.trim())
      .map((row) => {
        const definition = currentSpecOptions.find((spec) => spec.key === row.key);

        return {
          key: row.key,
          label: definition?.label || row.key,
          unit: definition?.unit || '',
          value: row.value,
        };
      });

    setIsSaving(true);

    try {
      const response = await apiFetch('/api/rfqs', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          additionalNotes,
          category,
          customerInfo: {
            companyName,
            contactPerson,
            country,
            email,
            mobileNumber,
            vatNumber,
          },
          durationType,
          durationValue,
          routeInfo: {
            country: destinationCountry,
            from: destinationFrom,
            to: destinationTo,
          },
          requestInfo: {
            numberOfTrips,
            numberOfUnits,
          },
          specs: selectedSpecs,
          subType,
        }),
      });
      const result = (await response.json()) as { message?: string };

      if (!response.ok) {
        throw new Error(result.message || 'Could not create RFQ.');
      }

      setIsModalOpen(false);
      resetModal();
      setSuccessMessage('RFQ created successfully.');
      void loadRfqs();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not create RFQ.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleQuoteAction(quoteId: string, action: 'accept' | 'reject') {
    setErrorMessage('');
    setSuccessMessage('');

    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    setUpdatingQuoteId(quoteId);

    try {
      const response = await apiFetch(`/api/rfqs/quotes/${quoteId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as {
        message?: string;
        quote?: { id: string; status: 'accepted' | 'rejected' };
      };

      if (!response.ok || !result.quote) {
        throw new Error(result.message || 'Could not update offer.');
      }

      setRfqs((items) =>
        items.map((rfq) => ({
          ...rfq,
          rfq_quotes: rfq.rfq_quotes
            ?.map((quote) =>
              quote.id === quoteId
                ? { ...quote, status: result.quote?.status || quote.status }
                : quote,
            )
            .filter((quote) => quote.status !== 'rejected'),
        })),
      );

      setSelectedRfq((rfq) =>
        rfq
          ? {
              ...rfq,
              rfq_quotes: rfq.rfq_quotes
                ?.map((quote) =>
                  quote.id === quoteId
                    ? { ...quote, status: result.quote?.status || quote.status }
                    : quote,
                )
                .filter((quote) => quote.status !== 'rejected'),
            }
          : rfq,
      );

      setSuccessMessage(
        action === 'accept' ? 'Offer accepted successfully.' : 'Offer rejected.',
      );
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Could not update offer.');
    } finally {
      setUpdatingQuoteId('');
    }
  }

  async function handleRfqStatusChange(rfqId: string, status: 'open' | 'cancelled') {
    setErrorMessage('');
    setSuccessMessage('');

    if (!supabase) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate('/login');
      return;
    }

    setUpdatingRfqId(rfqId);

    try {
      const response = await apiFetch(`/api/rfqs/${rfqId}/status`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: status === 'open' ? 'activate' : 'deactivate',
        }),
      });
      const result = (await response.json()) as {
        message?: string;
        rfq?: { id: string; status: 'open' | 'closed' | 'cancelled' };
      };

      if (!response.ok || !result.rfq) {
        throw new Error(result.message || 'Could not update RFQ status.');
      }

      setRfqs((items) =>
        items.map((rfq) =>
          rfq.id === rfqId ? { ...rfq, status: result.rfq?.status || rfq.status } : rfq,
        ),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : 'Could not update RFQ status.',
      );
    } finally {
      setUpdatingRfqId('');
    }
  }

  return (
    <main className="app-shell rfq-shell">
      <Header />
      <section className="rfq-page">
        <div className="rfq-heading">
          <div>
            <h1>RFQ</h1>
            <p>Manage rental quotation requests for equipment and transport.</p>
          </div>
          <button
            className="rfq-new-button"
            type="button"
            onClick={() => {
              resetModal('equipment');
              setIsModalOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            New RFQ
          </button>
        </div>

        {errorMessage && !isModalOpen && <p className="form-message error">{errorMessage}</p>}
        {successMessage && <p className="form-message success">{successMessage}</p>}
        {isLoading && <p className="seller-empty">Loading RFQs...</p>}
        {!isLoading && rfqs.length === 0 && (
          <p className="seller-empty">No RFQs posted yet.</p>
        )}

        <div className="rfq-list">
          {rfqs.map((rfq) => {
            const itemLabel =
              fleetTypes.find((item) => item.value === rfq.sub_type)?.label ||
              rfq.sub_type;

            return (
              <article
                className="rfq-card clickable-rfq-card"
                key={rfq.id}
                role="button"
                tabIndex={0}
                onClick={() => setSelectedRfq(rfq)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedRfq(rfq);
                  }
                }}
              >
                <div className="rfq-card-main">
                  <h2>
                    {itemLabel}{' '}
                    <span>{rfq.category === 'equipment' ? 'Equipment' : 'Transport'}</span>
                  </h2>
                  <p>
                    Duration: {rfq.duration_value}{' '}
                    {rfq.duration_type}
                    {rfq.duration_value === 1 ? '' : 's'}
                  </p>
                  <p>{rfq.rfq_quotes?.length || 0} offers received</p>
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
                <div className="rfq-card-side">
                  <time>
                    {new Intl.DateTimeFormat('en', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }).format(new Date(rfq.created_at))}
                  </time>
                  <select
                    className={`rfq-status-select ${rfq.status === 'open' ? 'active' : 'deactive'}`}
                    disabled={updatingRfqId === rfq.id}
                    value={rfq.status === 'open' ? 'open' : 'cancelled'}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) =>
                      void handleRfqStatusChange(
                        rfq.id,
                        event.target.value as 'open' | 'cancelled',
                      )
                    }
                  >
                    <option value="open">Active</option>
                    <option value="cancelled">Deactive</option>
                  </select>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {selectedRfq && (
        <div className="rfq-modal-backdrop">
          <div className="rfq-modal rfq-offers-modal" role="dialog" aria-modal="true">
            <div className="rfq-modal-heading">
              <div>
                <h2>
                  Offers for{' '}
                  {fleetTypes.find((item) => item.value === selectedRfq.sub_type)?.label ||
                    selectedRfq.sub_type}
                </h2>
                <p>{selectedRfq.rfq_quotes?.length || 0} offers received</p>
              </div>
              <button type="button" onClick={() => setSelectedRfq(null)}>
                <X aria-hidden="true" />
              </button>
            </div>

            {selectedRfq.rfq_quotes?.length ? (
              <div className="rfq-offers-table-wrap">
                <table className="rfq-offers-table">
                  <thead>
                    <tr>
                      <th>Seller Name</th>
                      <th>Company Name</th>
                      <th>Cost</th>
                      <th>Total Hours Used</th>
                      <th>Phone Number</th>
                      <th>Notes</th>
                      <th>Images</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRfq.rfq_quotes.map((quote) => (
                      <tr key={quote.id}>
                        <td>{quote.seller_name || 'Seller'}</td>
                        <td>{quote.seller_profiles?.company_name || 'Company'}</td>
                        <td>
                          {quote.price_amount} OMR / {quote.price_period}
                        </td>
                        <td>{quote.hours_used}</td>
                        <td>{quote.seller_profiles?.phone || 'Not provided'}</td>
                        <td className="rfq-offer-notes-cell">
                          {quote.notes || 'No notes'}
                        </td>
                        <td>
                          {quote.photos?.[0] ? (
                            <button
                              className="rfq-offer-image-button"
                              type="button"
                              onClick={() => {
                                setPreviewImages(quote.photos);
                                setPreviewIndex(0);
                              }}
                            >
                              <img
                                alt={quote.seller_profiles?.company_name || 'Offer'}
                                src={quote.photos[0]}
                              />
                            </button>
                          ) : (
                            <span>No images</span>
                          )}
                        </td>
                        <td>
                          {quote.status === 'submitted' ? (
                            <div className="rfq-offer-actions">
                              <button
                                className="quote-accept-button"
                                disabled={updatingQuoteId === quote.id}
                                type="button"
                                onClick={() => void handleQuoteAction(quote.id, 'accept')}
                              >
                                Accept
                              </button>
                              <button
                                className="quote-reject-button"
                                disabled={updatingQuoteId === quote.id}
                                type="button"
                                onClick={() => void handleQuoteAction(quote.id, 'reject')}
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="rfq-status">{quote.status}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="seller-empty">No offers received yet.</p>
            )}
          </div>
        </div>
      )}

      {previewImages.length > 0 && (
        <div className="rfq-image-preview" role="dialog" aria-modal="true">
          <button
            aria-label="Close image preview"
            className="rfq-image-close"
            type="button"
            onClick={() => {
              setPreviewImages([]);
              setPreviewIndex(0);
            }}
          >
            <X aria-hidden="true" />
          </button>
          {previewImages.length > 1 && (
            <button
              aria-label="Previous image"
              className="rfq-image-nav previous"
              type="button"
              onClick={() =>
                setPreviewIndex((index) =>
                  index === 0 ? previewImages.length - 1 : index - 1,
                )
              }
            >
              <ChevronLeft aria-hidden="true" />
            </button>
          )}
          <img alt="Offer preview" src={previewImages[previewIndex]} />
          {previewImages.length > 1 && (
            <button
              aria-label="Next image"
              className="rfq-image-nav next"
              type="button"
              onClick={() =>
                setPreviewIndex((index) =>
                  index === previewImages.length - 1 ? 0 : index + 1,
                )
              }
            >
              <ChevronRight aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {isModalOpen && (
        <div className="rfq-modal-backdrop">
          <form className="rfq-modal" noValidate onSubmit={handleCreateRfq}>
            <div className="rfq-modal-heading">
              <h2>New RFQ</h2>
              <button type="button" onClick={() => setIsModalOpen(false)}>
                <X aria-hidden="true" />
              </button>
            </div>

            <section className="rfq-form-section">
              <h3>Customer Information</h3>
              <div className="rfq-form-grid">
                <label>
                  <span>Company Name</span>
                  <input name="companyName" placeholder="Company name" />
                </label>
                <label>
                  <span>Contact Person</span>
                  <input
                    name="contactPerson"
                    defaultValue={profile?.full_name || ''}
                    required
                  />
                </label>
                <label>
                  <span>Mobile Number</span>
                  <input name="mobileNumber" defaultValue={profile?.phone || ''} required />
                </label>
                <label>
                  <span>Email Address</span>
                  <input
                    name="email"
                    defaultValue={profile?.email || ''}
                    required
                    type="email"
                  />
                </label>
                <label>
                  <span>VAT Number</span>
                  <input name="vatNumber" placeholder="Optional" />
                </label>
                <label>
                  <span>Country</span>
                  <input name="country" defaultValue={profile?.country || 'Oman'} required />
                </label>
              </div>
            </section>

            <section className="rfq-form-section">
              <h3>Request Details</h3>
              <div className="rfq-category-toggle">
                <button
                  className={category === 'equipment' ? 'selected' : ''}
                  type="button"
                  onClick={() => resetModal('equipment')}
                >
                  Equipment
                </button>
                <button
                  className={category === 'transport' ? 'selected' : ''}
                  type="button"
                  onClick={() => resetModal('transport')}
                >
                  Transport
                </button>
              </div>

              <label className="rfq-wide-field">
                <span>Item</span>
                <select
                  required
                  value={subType}
                  onChange={(event) => {
                    setSubType(event.target.value);
                    setSpecRows([{ ...emptySpecRow }]);
                  }}
                >
                  <option value="">Choose item</option>
                  {itemOptions.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rfq-duration-row">
                <label>
                  <span>Select time period</span>
                  <select name="durationType" required defaultValue="">
                    <option value="">Choose period</option>
                    <option value="day">Day</option>
                    <option value="week">Week</option>
                    <option value="month">Month</option>
                  </select>
                </label>
                <label>
                  <span>Duration</span>
                  <input
                    min="1"
                    name="durationValue"
                    placeholder="Enter number"
                    required
                    step="1"
                    type="number"
                  />
                </label>
              </div>

              <div className="rfq-duration-row">
                <label>
                  <span>Number of trips</span>
                  <input
                    min="1"
                    name="numberOfTrips"
                    placeholder="Enter trips"
                    required
                    step="1"
                    type="number"
                  />
                </label>
                <label>
                  <span>Number of equipment/transport</span>
                  <input
                    min="1"
                    name="numberOfUnits"
                    placeholder="Enter quantity"
                    required
                    step="1"
                    type="number"
                  />
                </label>
              </div>

              <label className="rfq-wide-field">
                <span>Destination country</span>
                <select name="destinationCountry" required defaultValue="">
                  <option value="">Choose GCC country</option>
                  {gccCountryOptions.map((countryOption) => (
                    <option key={countryOption} value={countryOption}>
                      {countryOption}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rfq-duration-row">
                <label>
                  <span>From</span>
                  <input name="destinationFrom" placeholder="Pickup location" required />
                </label>
                <label>
                  <span>To</span>
                  <input name="destinationTo" placeholder="Drop-off location" required />
                </label>
              </div>

              {subType && (
                <div className="rfq-spec-builder">
                  {specRows.map((row, index) => {
                    const selectedKeys = new Set(
                      specRows
                        .filter((_, rowIndex) => rowIndex !== index)
                        .map((specRow) => specRow.key)
                        .filter(Boolean),
                    );
                    const availableSpecs = currentSpecOptions.filter(
                      (spec) => !selectedKeys.has(spec.key),
                    );
                    const selectedSpec = currentSpecOptions.find(
                      (spec) => spec.key === row.key,
                    );

                    return (
                      <div className="rfq-spec-row" key={`${row.key}-${index}`}>
                        <label>
                          <span>Specification</span>
                          <select
                            value={row.key}
                            onChange={(event) =>
                              updateSpecRow(index, 'key', event.target.value)
                            }
                          >
                            <option value="">Choose specification</option>
                            {availableSpecs.map((spec) => (
                              <option key={spec.key} value={spec.key}>
                                {spec.label}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label>
                          <span>Value</span>
                          <input
                            disabled={!row.key}
                            placeholder={selectedSpec?.unit || 'Enter value'}
                            type={selectedSpec?.type === 'number' ? 'number' : 'text'}
                            value={row.value}
                            onChange={(event) =>
                              updateSpecRow(index, 'value', event.target.value)
                            }
                          />
                        </label>
                        <button
                          aria-label="Remove specification"
                          className="rfq-remove-spec"
                          type="button"
                          onClick={() => removeSpecRow(index)}
                        >
                          <X aria-hidden="true" />
                        </button>
                      </div>
                    );
                  })}

                  {specRows.length < currentSpecOptions.length && (
                    <button
                      className="rfq-add-spec"
                      type="button"
                      onClick={addSpecRow}
                    >
                      <Plus aria-hidden="true" />
                      Add specification
                    </button>
                  )}
                </div>
              )}

              <label className="rfq-wide-field">
                <span>Additional Notes</span>
                <textarea
                  name="additionalNotes"
                  placeholder="Mention any special instructions, site requirements, or rental needs."
                />
              </label>
            </section>

            {errorMessage && <p className="form-message error">{errorMessage}</p>}

            <button className="rfq-submit-button" disabled={isSaving} type="submit">
              {isSaving ? 'Adding RFQ...' : 'Add'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
