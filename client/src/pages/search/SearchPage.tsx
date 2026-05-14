import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock3, Heart, MapPin, Search, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Header } from '../../components/Header';
import {
  fleetTypes,
  specOptions,
  type FleetCategory,
} from '../../lib/fleet-options';
import { apiFetch } from '../../lib/api';
import { brandOptions, omanLocations, yearOptions } from '../../lib/search-options';

type SearchListing = {
  id: string;
  category: FleetCategory;
  sub_type: string;
  name: string;
  brand: string;
  model: string;
  year: number;
  location_city: string;
  daily_rate_omr: number;
  photos: string[];
  seller_profiles?: {
    company_name?: string;
  };
};

export function SearchPage() {
  const [params] = useSearchParams();
  const initialCategory =
    params.get('category') === 'transport' ? 'transport' : 'equipment';
  const initialType = params.get('type') || '';
  const [category, setCategory] = useState<FleetCategory>(initialCategory);
  const [selectedType, setSelectedType] = useState(initialType);
  const [location, setLocation] = useState('Any Location');
  const [brand, setBrand] = useState('Any Brand');
  const [year, setYear] = useState('Any Year');
  const [specFilters, setSpecFilters] = useState<Record<string, string>>({});
  const [listings, setListings] = useState<SearchListing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const visibleTypes = fleetTypes.filter((item) => item.category === category);
  const selectedSpecs = selectedType ? specOptions[selectedType] || [] : [];

  useEffect(() => {
    async function loadListings() {
      setIsLoading(true);
      setErrorMessage('');

      try {
        const query = new URLSearchParams();
        query.set('category', category);

        if (selectedType) {
          query.set('type', selectedType);
        }

        const response = await apiFetch(`/api/fleet/listings?${query}`);
        const result = (await response.json()) as {
          listings?: SearchListing[];
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
  }, [category, selectedType]);

  const filteredListings = useMemo(
    () =>
      listings.filter((listing) => {
        const matchesLocation =
          location === 'Any Location' || listing.location_city === location;
        const matchesBrand = brand === 'Any Brand' || listing.brand === brand;
        const matchesYear = year === 'Any Year' || String(listing.year) === year;

        return matchesLocation && matchesBrand && matchesYear;
      }),
    [brand, listings, location, year],
  );

  function clearFilters() {
    setCategory('equipment');
    setSelectedType('');
    setLocation('Any Location');
    setBrand('Any Brand');
    setYear('Any Year');
    setSpecFilters({});
  }

  return (
    <main className="app-shell search-shell">
      <Header />
      <section className="search-page">
        <aside className="filters-panel">
          <div className="filters-heading">
            <h1>Filters</h1>
            <button aria-label="Toggle theme" type="button">
              <span>◐</span>
            </button>
          </div>

          <FilterGroup title="Category">
            <RadioOption
              checked={category === 'equipment'}
              label="Equipment"
              onChange={() => {
                setCategory('equipment');
                setSelectedType('');
              }}
            />
            <RadioOption
              checked={category === 'transport'}
              label="Transport"
              onChange={() => {
                setCategory('transport');
                setSelectedType('');
              }}
            />
          </FilterGroup>

          <FilterGroup title="Type">
            {visibleTypes.map((item) => (
              <RadioOption
                checked={selectedType === item.value}
                key={item.value}
                label={item.label}
                onChange={() =>
                  setSelectedType((currentType) =>
                    currentType === item.value ? '' : item.value,
                  )
                }
              />
            ))}
          </FilterGroup>

          <FilterGroup title="Location" onReset={() => setLocation('Any Location')}>
            <select value={location} onChange={(event) => setLocation(event.target.value)}>
              {omanLocations.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="Brand" onReset={() => setBrand('Any Brand')}>
            <select value={brand} onChange={(event) => setBrand(event.target.value)}>
              {brandOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="Year" onReset={() => setYear('Any Year')}>
            <select value={year} onChange={(event) => setYear(event.target.value)}>
              {yearOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </FilterGroup>

          {selectedSpecs.length > 0 && (
            <FilterGroup title="Specifications" onReset={() => setSpecFilters({})}>
              {selectedSpecs.map((spec) => (
                <label className="spec-filter" key={spec.key}>
                  <span>
                    {spec.label}
                    {spec.unit ? ` (${spec.unit})` : ''} min
                  </span>
                  <input
                    placeholder="Min"
                    type={spec.type === 'number' ? 'number' : 'text'}
                    value={specFilters[spec.key] || ''}
                    onChange={(event) =>
                      setSpecFilters((currentFilters) => ({
                        ...currentFilters,
                        [spec.key]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </FilterGroup>
          )}

          <button className="apply-filter-button" type="button">
            <Search aria-hidden="true" />
            Apply Filters
          </button>
          <button className="clear-filter-button" type="button" onClick={clearFilters}>
            <X aria-hidden="true" />
            Clear All
          </button>
        </aside>

        <div className="search-results">
          <p className="result-count">
            {isLoading ? 'Loading listings...' : `${filteredListings.length} listings found`}
          </p>
          {errorMessage && <p className="form-message error">{errorMessage}</p>}

          <div className="result-grid">
            {filteredListings.map((listing, index) => {
              const typeLabel =
                fleetTypes.find((item) => item.value === listing.sub_type)?.label ||
                listing.sub_type;

              return (
                <article
                  className={`result-card ${index === 0 ? 'highlighted' : ''}`}
                  key={listing.id}
                >
                  <div className="result-image-wrap">
                    <img alt={listing.name} src={listing.photos[0]} />
                    <span>{typeLabel}</span>
                    <button aria-label="Save listing" type="button">
                      <Heart aria-hidden="true" />
                    </button>
                  </div>
                  <div className="result-card-body">
                    <h2>{listing.name}</h2>
                    <p>{listing.seller_profiles?.company_name || 'Trex-O Seller'}</p>
                    <div className="result-meta">
                      <span>
                        <MapPin aria-hidden="true" />
                        {listing.location_city}
                      </span>
                      <span>
                        <Clock3 aria-hidden="true" />
                        {listing.year}
                      </span>
                    </div>
                    <div className="result-footer">
                      <strong>{listing.daily_rate_omr}</strong>
                      <span>OMR / day</span>
                      <Link aria-label="View listing" to={`/listing/${listing.id}`}>
                        <ArrowRight aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

function FilterGroup({
  children,
  onReset,
  title,
}: {
  children: React.ReactNode;
  onReset?: () => void;
  title: string;
}) {
  return (
    <div className="filter-group">
      <div className="filter-group-heading">
        <h2>{title}</h2>
        {onReset && (
          <button aria-label={`Clear ${title}`} type="button" onClick={onReset}>
            <X aria-hidden="true" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function RadioOption({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="filter-radio">
      <input checked={checked} type="radio" onChange={onChange} />
      <span>{label}</span>
    </label>
  );
}
