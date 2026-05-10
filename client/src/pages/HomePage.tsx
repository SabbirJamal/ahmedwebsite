import { useMemo, useState } from 'react';
import { Header } from '../components/Header';
import {
  fleetTypes,
  specOptions,
  type FleetCategory,
} from '../lib/fleet-options';
import { brandOptions, omanLocations, yearOptions } from '../lib/search-options';

type HomeStep = 'category' | 'details' | 'specs';

export function HomePage() {
  const [step, setStep] = useState<HomeStep>('category');
  const [category, setCategory] = useState<FleetCategory>('transport');
  const [selectedType, setSelectedType] = useState('');
  const itemOptions = useMemo(
    () => fleetTypes.filter((item) => item.category === category),
    [category],
  );
  const selectedTypeLabel =
    fleetTypes.find((item) => item.value === selectedType)?.label || '';
  const selectedSpecs = selectedType ? specOptions[selectedType] || [] : [];

  function chooseCategory(nextCategory: FleetCategory) {
    setCategory(nextCategory);
    setSelectedType('');
    setStep('category');
  }

  return (
    <main className="app-shell home-shell">
      <Header />
      <section className="home-search">
        <video
          aria-hidden="true"
          autoPlay
          className="home-video"
          loop
          muted
          playsInline
        >
          <source src="/assets/home_background.mp4" type="video/mp4" />
        </video>
        <div className="home-overlay" />

        <div className="home-search-content">
          {step === 'category' && (
            <>
              <div className="home-category-tabs">
                <button
                  className={category === 'transport' ? 'active' : ''}
                  type="button"
                  onClick={() => chooseCategory('transport')}
                >
                  Transport
                </button>
                <button
                  className={category === 'equipment' ? 'active' : ''}
                  type="button"
                  onClick={() => chooseCategory('equipment')}
                >
                  Equipment
                </button>
              </div>

              <div className="home-item-options">
                {itemOptions.map((item) => (
                  <button
                    className={selectedType === item.value ? 'selected' : ''}
                    key={item.value}
                    type="button"
                    onClick={() => setSelectedType(item.value)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {selectedType && (
                <button
                  className="home-primary-button"
                  type="button"
                  onClick={() => setStep('details')}
                >
                  Continue
                </button>
              )}

              <StepDots activeIndex={0} />
            </>
          )}

          {step === 'details' && (
            <>
              <h1 className="home-step-title">Listing Details</h1>
              <div className="home-details-grid">
                <label className="home-field">
                  <span>Brand</span>
                  <select defaultValue="Any Brand">
                    {brandOptions.map((brand) => (
                      <option key={brand} value={brand}>
                        {brand}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="home-field">
                  <span>Year</span>
                  <select defaultValue="Any Year">
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="home-field wide">
                  <span>Location</span>
                  <select defaultValue="Any Location">
                    {omanLocations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="home-actions">
                <button
                  className="home-secondary-button"
                  type="button"
                  onClick={() => setStep('category')}
                >
                  Back
                </button>
                <button
                  className="home-primary-button"
                  type="button"
                  onClick={() => setStep('specs')}
                >
                  Continue
                </button>
              </div>
              <p className="home-optional-note">All fields optional</p>
              <StepDots activeIndex={1} />
            </>
          )}

          {step === 'specs' && (
            <>
              <h1 className="home-step-title">
                Specifications{selectedTypeLabel ? ` - ${selectedTypeLabel}` : ''}
              </h1>
              <div className="home-details-grid">
                {selectedSpecs.map((spec) => (
                  <label className="home-field" key={spec.key}>
                    <span>
                      {spec.label}
                      {spec.unit ? ` (${spec.unit})` : ''}
                    </span>
                    <input
                      placeholder={`Enter ${spec.label.toLowerCase()}`}
                      type={spec.type}
                    />
                  </label>
                ))}
              </div>

              <div className="home-actions">
                <button
                  className="home-secondary-button"
                  type="button"
                  onClick={() => setStep('details')}
                >
                  Back
                </button>
                <button
                  className="home-primary-button"
                  type="button"
                  onClick={() => {
                    window.location.assign(
                      `/search?category=${category}&type=${selectedType}`,
                    );
                  }}
                >
                  Search
                </button>
              </div>
              <p className="home-optional-note">
                All fields optional - you can skip this step
              </p>
              <StepDots activeIndex={2} />
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function StepDots({ activeIndex }: { activeIndex: number }) {
  return (
    <div className="home-step-dots" aria-hidden="true">
      {[0, 1, 2].map((index) => (
        <span className={index === activeIndex ? 'active' : ''} key={index} />
      ))}
    </div>
  );
}
