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
          <div className="home-hero-copy">
            <h1>
              Rent equipment and transport
              <span>for every jobsite</span>
            </h1>
            <p>
              Compare available machinery, trucks, trailers, and lifting equipment
              from trusted suppliers across Oman.
            </p>
          </div>
          {step === 'category' && (
            <div className="home-search-panel">
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
            </div>
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

      <section className="why-trexo">
        <div className="why-trexo-inner">
          <div className="why-trexo-heading">
            <span>Why Trex-O</span>
            <h2>Built for fast equipment and transport sourcing.</h2>
          </div>

          <div className="why-trexo-grid">
            <article>
              <p>
                “Find the right equipment, trailer, or truck without calling ten
                different suppliers.”
              </p>
              <strong>Faster sourcing</strong>
            </article>
            <article>
              <p>
                “Compare listings, specs, rates, and seller details in one place
                before sending a request.”
              </p>
              <strong>Clear decisions</strong>
            </article>
            <article>
              <p>
                “Suppliers can list fleets, receive requests, and respond to RFQs
                from one focused workspace.”
              </p>
              <strong>Seller-ready tools</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="trexo-offers">
        <div className="trexo-offers-inner">
          <div className="trexo-offers-copy">
            <span>What Trex-O Offers</span>
            <h2>One platform for rental listings and competitive RFQs.</h2>
            <p>
              Trex-O connects construction teams with suppliers who are ready to
              move equipment, trucks, trailers, and operators into active projects.
            </p>
          </div>

          <div className="trexo-offers-grid">
            <article>
              <span>01</span>
              <h3>Rent from verified seller listings</h3>
              <p>
                Sellers post available equipment and transport fleets with rates,
                photos, specs, location, and availability. Buyers can search,
                compare, and request the right asset faster.
              </p>
            </article>
            <article>
              <span>02</span>
              <h3>Post RFQs and let sellers compete</h3>
              <p>
                Buyers can publish rental RFQs once, and every seller can respond
                with a quotation. The buyer reviews offers and chooses the best
                fit for price, specs, experience, and readiness.
              </p>
            </article>
          </div>
        </div>
      </section>

      <footer className="home-footer">
        <div className="home-footer-inner">
          <section className="footer-contact">
            <span>Contact Us</span>
            <h2>Ready to source equipment or list your fleet?</h2>
            <p>
              Speak with the Trex-O team for marketplace support, seller onboarding,
              RFQ help, or rental workflow questions.
            </p>

            <div className="footer-contact-grid">
              <div>
                <strong>Sales</strong>
                <a href="tel:+96891213141">+968 9121 3141</a>
              </div>
              <div>
                <strong>Email</strong>
                <a href="mailto:support@trex-o.com">support@trex-o.com</a>
              </div>
              <div>
                <strong>Office</strong>
                <span>Muscat, Sultanate of Oman</span>
              </div>
              <div>
                <strong>Hours</strong>
                <span>Sunday - Thursday, 8:00 AM - 6:00 PM</span>
              </div>
            </div>
          </section>

          <section className="footer-faq">
            <span>FAQs</span>
            <h2>Questions teams often ask.</h2>
            <div className="faq-list">
              <details>
                <summary>Can buyers request equipment without calling sellers?</summary>
                <p>
                  Yes. Buyers can send item requests or create RFQs, and sellers can
                  respond through the platform.
                </p>
              </details>
              <details>
                <summary>Can sellers list both equipment and transport?</summary>
                <p>
                  Yes. Sellers can add construction equipment, trailers, trucks, and
                  transport assets from the seller workspace.
                </p>
              </details>
              <details>
                <summary>How do RFQs work?</summary>
                <p>
                  A buyer posts one rental requirement, sellers submit offers, and
                  the buyer chooses the offer that best matches the project.
                </p>
              </details>
              <details>
                <summary>Is Trex-O only for Oman?</summary>
                <p>
                  The current marketplace is focused on Oman, with GCC expansion
                  planned as the supplier network grows.
                </p>
              </details>
            </div>
          </section>
        </div>

        <div className="footer-bottom">
          <strong>Trex-O</strong>
          <span>Equipment and transport rentals for construction teams.</span>
        </div>
      </footer>
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
