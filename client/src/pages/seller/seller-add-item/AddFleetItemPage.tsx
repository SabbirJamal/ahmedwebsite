import { useEffect, useState } from 'react';
import { ArrowRight, Camera, ChevronDown, FileText, Truck } from 'lucide-react';
import { Header } from '../../../components/Header';
import { apiFetch } from '../../../lib/api';
import {
  fleetTypes,
  specOptions,
  type FleetCategory,
} from '../../../lib/fleet-options';
import { supabase } from '../../../lib/supabase';
import {
  removeUploadedListingDocuments,
  uploadListingDocument,
} from './listingDocumentUpload';
import {
  removeUploadedListingPhotos,
  uploadListingPhotos,
} from './listingPhotoUpload';
import { TextInput } from './TextInput';

export function AddFleetItemPage() {
  const [category, setCategory] = useState<FleetCategory>('equipment');
  const [subType, setSubType] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [registrationFile, setRegistrationFile] = useState<File | null>(null);
  const [driverCardFile, setDriverCardFile] = useState<File | null>(null);
  const [registrationFileName, setRegistrationFileName] = useState('');
  const [driverCardFileName, setDriverCardFileName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const categoryTypes = fleetTypes.filter((item) => item.category === category);
  const selectedSpecs = subType ? specOptions[subType] || [] : [];

  useEffect(() => {
    setSubType('');
  }, [category]);

  return (
    <main className="app-shell add-item-shell">
      <Header />
      <section className="add-item-page">
        <div className="add-item-heading">
          <h1>Add transport or equipment</h1>
          <p>
            Choose a category, select the item type, fill the common details,
            then complete the specifications for that item.
          </p>
        </div>

        <form
          className="add-item-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            setErrorMessage('');
            setStatusMessage('');

            if (!supabase) {
              setErrorMessage('Supabase is not configured.');
              return;
            }

            if (!subType) {
              setErrorMessage('Please choose an item type.');
              return;
            }

            if (photoFiles.length < 1 || photoFiles.length > 4) {
              setErrorMessage('Please upload between 1 and 4 photos.');
              return;
            }

            if (!registrationFile) {
              setErrorMessage('Please upload the vehicle registration document.');
              return;
            }

            if (!driverCardFile) {
              setErrorMessage('Please upload the passport/resident card image.');
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
            const specs: Record<string, string | number> = {};

            selectedSpecs.forEach((spec) => {
              const value = String(formData.get(spec.key) || '').trim();
              specs[spec.key] = spec.type === 'number' ? Number(value) : value;
            });

            setIsSubmitting(true);

            try {
              const uploadedPhotos = await uploadListingPhotos(
                photoFiles,
                session.user.id,
              );
              const uploadedDocuments: string[] = [];

              try {
                const vehicleRegistrationDocument = await uploadListingDocument(
                  registrationFile,
                  session.user.id,
                  'vehicle-registration',
                );
                uploadedDocuments.push(vehicleRegistrationDocument.path);

                const driverCardDocument = await uploadListingDocument(
                  driverCardFile,
                  session.user.id,
                  'driver-card',
                );
                uploadedDocuments.push(driverCardDocument.path);

                const response = await apiFetch('/api/fleet/listings', {
                  method: 'POST',
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    category,
                    subType,
                    name: formData.get('name'),
                    brand: formData.get('brand'),
                    model: formData.get('makeModel'),
                    year: Number(formData.get('yearOfManufacture')),
                    locationCity: formData.get('locationCity'),
                    dailyRateOmr: Number(formData.get('dailyRateOmr')),
                    weeklyRateOmr: Number(formData.get('weeklyRateOmr')),
                    monthlyRateOmr: Number(formData.get('monthlyRateOmr')),
                    hoursUsed: formData.get('hoursUsed')
                      ? Number(formData.get('hoursUsed'))
                      : null,
                    photos: uploadedPhotos.map((photo) => photo.publicUrl),
                    description: formData.get('description'),
                    isActive,
                    specs,
                    vehicleSpec: {
                      chassisVin: formData.get('chassisVin'),
                      insurance: formData.get('insurance'),
                      makeModel: formData.get('makeModel'),
                      numberOfTrailersTrucks:
                        category === 'transport'
                          ? Number(formData.get('numberOfTrailersTrucks'))
                          : null,
                      plateNumber: formData.get('plateNumber'),
                      registrationValidity: formData.get('registrationValidity'),
                      vehicleAge: Number(formData.get('vehicleAge')),
                      vehicleRegistrationUrl: vehicleRegistrationDocument.path,
                      yearOfManufacture: Number(formData.get('yearOfManufacture')),
                    },
                    driverSpec: {
                      age: Number(formData.get('driverAge')),
                      driverName: formData.get('driverName'),
                      licenseCategory: formData.get('licenseCategory'),
                      licenseNumber: formData.get('licenseNumber'),
                      passResidentCardNumber: formData.get('passResidentCardNumber'),
                      passResidentCardUrl: driverCardDocument.path,
                      similarOperationsSites: formData.get('similarOperationsSites'),
                      yearsOfExperience: Number(formData.get('yearsOfExperience')),
                    },
                  }),
                });
                const result = (await response.json()) as { message?: string };

                if (!response.ok) {
                  throw new Error(result.message || 'Could not create listing.');
                }
              } catch (error) {
                await removeUploadedListingPhotos(
                  uploadedPhotos.map((photo) => photo.path),
                );
                await removeUploadedListingDocuments(uploadedDocuments);
                throw error;
              }

              setStatusMessage('Listing added successfully.');
              window.location.assign('/seller');
            } catch (error) {
              setErrorMessage(
                error instanceof Error ? error.message : 'Could not create listing.',
              );
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <section className="form-section">
            <h2>Choose listing type</h2>
            <div className="category-toggle">
              <button
                className={category === 'equipment' ? 'selected' : ''}
                type="button"
                onClick={() => setCategory('equipment')}
              >
                Equipment
              </button>
              <button
                className={category === 'transport' ? 'selected' : ''}
                type="button"
                onClick={() => setCategory('transport')}
              >
                Transport
              </button>
            </div>

            <label className="register-field">
              <span>Item type</span>
              <div className="register-input select-input">
                <Truck aria-hidden="true" />
                <select
                  required
                  value={subType}
                  onChange={(event) => setSubType(event.target.value)}
                >
                  <option value="">Choose item</option>
                  {categoryTypes.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <ChevronDown aria-hidden="true" />
              </div>
            </label>
          </section>

          <section className="form-section">
            <h2>Specification</h2>
            <div className="add-item-grid">
              <TextInput label="Name" name="name" placeholder="Listing name" required />
              <TextInput label="Brand" name="brand" placeholder="Brand" required />
              <TextInput
                label="Plate Number"
                name="plateNumber"
                placeholder="Plate number"
                required
              />
              <TextInput
                label="Make / Model"
                name="makeModel"
                placeholder="Make / model"
                required
              />
              <TextInput
                label="Year of Manufacture"
                name="yearOfManufacture"
                placeholder="2022"
                required
                type="number"
              />
              <TextInput
                label="Chassis / VIN"
                name="chassisVin"
                placeholder="Chassis or VIN"
                required
              />
              <TextInput
                label="Vehicle age"
                name="vehicleAge"
                placeholder="Vehicle age"
                required
                type="number"
              />
              <TextInput
                label="Registration validity"
                name="registrationValidity"
                placeholder=""
                required
                type="date"
              />
              <TextInput
                label="Insurance (optional)"
                name="insurance"
                placeholder="Insurance details"
              />
            </div>
          </section>

          {selectedSpecs.length > 0 && (
            <section className="form-section">
              <h2>Vehicle Specifications</h2>
              <div className="add-item-grid">
                {selectedSpecs.map((spec) => (
                  <TextInput
                    key={spec.key}
                    label={`${spec.label}${spec.unit ? ` (${spec.unit})` : ''}`}
                    name={spec.key}
                    placeholder={spec.label}
                    required
                    type={spec.type}
                  />
                ))}
                {category === 'transport' && (
                  <TextInput
                    label="Number of trailers/trucks"
                    name="numberOfTrailersTrucks"
                    placeholder="Number of trailers/trucks"
                    required
                    type="number"
                  />
                )}
              </div>
            </section>
          )}

          <section className="form-section">
            <h2>Driver Specification</h2>
            <div className="add-item-grid">
              <TextInput
                label="Driver name"
                name="driverName"
                placeholder="Driver name"
                required
              />
              <TextInput
                label="Age"
                name="driverAge"
                placeholder="Age"
                required
                type="number"
              />
              <TextInput
                label="License category"
                name="licenseCategory"
                placeholder="License category"
                required
              />
              <TextInput
                label="License number"
                name="licenseNumber"
                placeholder="License number"
                required
              />
              <TextInput
                label="Years of experience"
                name="yearsOfExperience"
                placeholder="Years of experience"
                required
                type="number"
              />
              <TextInput
                label="Similar operations/sites"
                name="similarOperationsSites"
                placeholder="Similar operations/sites"
                required
              />
              <TextInput
                label="Pass/resident card number"
                name="passResidentCardNumber"
                placeholder="Pass/resident card number"
                required
              />
            </div>

            <label className="photo-upload single-document-upload">
              <FileText aria-hidden="true" />
              <span>Upload passport/resident card image</span>
              <input
                accept="image/*"
                  required
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setDriverCardFile(file);
                    setDriverCardFileName(file?.name || '');
                  }}
                />
              </label>
            {driverCardFileName && (
              <p className="photo-count">{driverCardFileName} selected</p>
            )}
          </section>

          <section className="form-section">
            <h2>Other Information</h2>
            <div className="add-item-grid">
              <TextInput
                label="Location city"
                name="locationCity"
                placeholder="Muscat"
                required
              />
              <TextInput
                label="Hours used"
                name="hoursUsed"
                placeholder="Optional"
                type="number"
              />
              <TextInput
                label="Daily rate (OMR)"
                name="dailyRateOmr"
                placeholder="0.000"
                required
                step="0.001"
                type="number"
              />
              <TextInput
                label="Weekly rate (OMR)"
                name="weeklyRateOmr"
                placeholder="0.000"
                required
                step="0.001"
                type="number"
              />
              <TextInput
                label="Monthly rate (OMR)"
                name="monthlyRateOmr"
                placeholder="0.000"
                required
                step="0.001"
                type="number"
              />
            </div>

            <label className="register-field">
              <span>Notes (optional)</span>
              <textarea
                className="add-item-textarea"
                name="description"
                placeholder="Describe condition, service coverage, or rental terms"
              />
            </label>

            <label className="active-option">
              <input
                checked={isActive}
                type="checkbox"
                onChange={(event) => setIsActive(event.target.checked)}
              />
              <span>Make listing active immediately</span>
            </label>
          </section>

          <section className="form-section">
            <h2>Specification</h2>
            <div className="document-upload-grid">
              <label className="photo-upload">
                <Camera aria-hidden="true" />
                <span>Upload 1 to 4 equipment/transport photos</span>
                <input
                  accept="image/*"
                  multiple
                  required
                  type="file"
                  onChange={(event) =>
                    setPhotoFiles(Array.from(event.target.files || []).slice(0, 4))
                  }
                />
              </label>
              <label className="photo-upload">
                <FileText aria-hidden="true" />
                <span>Vehicle registration PDF/DOC</span>
                <input
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  required
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0] || null;
                    setRegistrationFile(file);
                    setRegistrationFileName(file?.name || '');
                  }}
                />
              </label>
            </div>
            <p className="photo-count">{photoFiles.length} photos selected</p>
            {registrationFileName && (
              <p className="photo-count">{registrationFileName} selected</p>
            )}
          </section>

          <button className="register-submit" disabled={isSubmitting} type="submit">
            {isSubmitting ? 'Adding Listing...' : 'ADD'}
            <ArrowRight aria-hidden="true" />
          </button>

          {errorMessage && <p className="form-message error">{errorMessage}</p>}
          {statusMessage && <p className="form-message success">{statusMessage}</p>}
        </form>
      </section>
    </main>
  );
}
