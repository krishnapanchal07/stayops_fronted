import type { DiscoveryFilters as Filters, PublicPG } from '@/types/discovery';
import { RENT_RANGE_LABELS, RentRange } from '@/types/inquiry';
import { PROPERTY_TYPE_LABELS, PropertyType } from '@/types/property';
import { ROOM_TYPE_LABELS, RoomType, SHARING_TYPE_LABELS, SharingType } from '@/types/room';
import { Select } from '@/components/forms/Select';
import { Search, SlidersHorizontal } from 'lucide-react';
import { DiscoveryAmenityChips } from './DiscoveryAmenityChips';
import { Modal } from '@/components/ui/Modal';
import type { DiscoverySort } from '@/types/discovery';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type UpdateDiscoveryFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => void;
interface Props {
  options?: {cities:string[];localities:string[]};
  filters: Filters;
  properties: PublicPG[];
  onChange: UpdateDiscoveryFilter;
  onClear: () => void;
  sort?: DiscoverySort;
  onSort?: (sort: DiscoverySort) => void;
}
export function DiscoveryFilters({
  filters,
  options: suppliedOptions,
  properties,
  onChange,
  onClear,
  sort = 'name',
  onSort,
}: Props) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const content = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const returnFocus = trigger.current;
    const dialog = content.current?.closest<HTMLElement>('[role="dialog"]');
    const controls = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
        ) ?? [],
      );
    controls()[0]?.focus();
    const trap = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const elements = controls();
      if (event.shiftKey && document.activeElement === elements[0]) {
        event.preventDefault();
        elements.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === elements.at(-1)) {
        event.preventDefault();
        elements[0]?.focus();
      }
    };
    dialog?.addEventListener('keydown', trap);
    return () => {
      dialog?.removeEventListener('keydown', trap);
      returnFocus?.focus();
    };
  }, [open]);
  const close = useCallback(() => setOpen(false), []);
  const pageLocalities = useMemo(
    () =>
      [
        ...new Set(properties.map((pg) => pg.address.split(',').at(-1)?.trim()).filter(Boolean)),
      ].sort(),
    [properties],
  );
  const pageCities = useMemo(() => [...new Set(properties.map((pg) => pg.city))].sort(), [properties]);
  const localities=suppliedOptions?.localities??pageLocalities;
  const cities=suppliedOptions?.cities??pageCities;
  const amenities = useMemo(
    () => [...new Set(properties.flatMap((pg) => pg.amenities))].sort(),
    [properties],
  );
  const options = (labels: Record<string, string>) =>
    Object.entries(labels).map(([value, label]) => ({ value, label }));
  return (
    <section
      aria-label="Search filters"
      className="mb-6 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5"
    >
      <div className="grid grid-cols-2 gap-3 xl:flex xl:items-center">
        <select
          aria-label="Locality"
          value={filters.locality}
          onChange={(e) => onChange('locality', e.target.value)}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-3 text-xs sm:px-4 sm:text-sm"
        >
          <option value="">Locality</option>
          {localities.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select
          aria-label="Budget"
          value={filters.rentRange}
          onChange={(e) => onChange('rentRange', e.target.value as Filters['rentRange'])}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-3 text-xs sm:px-4 sm:text-sm"
        >
          <option value="">Budget</option>
          {Object.values(RentRange).map((value) => (
            <option key={value} value={value}>
              {RENT_RANGE_LABELS[value]}
            </option>
          ))}
        </select>
        <select
          aria-label="Gender"
          value={filters.gender}
          onChange={(e) => onChange('gender', e.target.value as Filters['gender'])}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-background px-3 text-xs text-text-secondary sm:px-4 sm:text-sm"
        >
          <option value="">Gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="unisex">Unisex</option>
        </select>
        <select
          aria-label="Occupancy"
          value={filters.sharingType}
          onChange={(e) => onChange('sharingType', e.target.value as SharingType | '')}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-3 text-xs sm:px-4 sm:text-sm"
        >
          <option value="">Occupancy</option>
          {Object.entries(SHARING_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <span aria-hidden="true" className="hidden h-7 border-l border-border xl:block" />
        <button
          ref={trigger}
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-4 text-sm font-medium text-primary hover:bg-primary-soft"
        >
          <SlidersHorizontal size={16} /> More Filters
        </button>
        <select
          aria-label="Sort properties"
          value={sort}
          onChange={(e) => onSort?.(e.target.value as DiscoverySort)}
          className="min-h-11 min-w-0 flex-1 rounded-full border border-border bg-surface px-3 text-xs sm:px-4 sm:text-sm"
        >
          <option value="name">Sort: Name</option>
          <option value="rent-asc">Price: Low to high</option>
          <option value="rent-desc">Price: High to low</option>
          <option value="distance">Distance (approx.)</option>
        </select>
      </div>
      <Modal
        open={open}
        title="More filters"
        onClose={close}
        className="max-w-2xl"
        footer={
          <>
            <button onClick={onClear} className="min-h-10 px-4 text-sm text-primary">
              Clear all filters
            </button>
            <button
              onClick={close}
              className="min-h-10 rounded-xl bg-primary px-5 text-sm font-semibold text-white"
            >
              Show results
            </button>
          </>
        }
      >
        <div ref={content} className="max-h-[60svh] overflow-y-auto px-1">
          <DiscoveryAmenityChips
            available={amenities}
            selected={filters.amenities}
            onChange={(values) => onChange('amenities', values)}
          />
          <details className="mt-6 rounded-xl border border-border p-4">
            <summary className="mb-4 cursor-pointer text-sm font-semibold">
              Other search options
            </summary>
            <label className="mb-4 block text-sm font-medium">
              Find a place
              <span className="relative mt-2 block">
                <Search size={17} className="absolute top-3.5 left-3 text-primary" />
                <input
                  type="search"
                  value={filters.query}
                  onChange={(e) => onChange('query', e.target.value)}
                  placeholder="Property, city, locality or room…"
                  className="h-11 w-full rounded-xl border border-border bg-background pr-3 pl-10 text-sm"
                />
              </span>
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select
                label="City"
                name="discovery-city"
                value={filters.city}
                onChange={(e) => onChange('city', e.target.value)}
                options={[
                  { value: '', label: 'All cities' },
                  ...cities.map((city) => ({ value: city, label: city })),
                ]}
              />
              <Select
                label="Property"
                name="discovery-property"
                value={filters.propertyId}
                onChange={(event) => onChange('propertyId', event.target.value)}
                options={[
                  { value: '', label: 'All properties' },
                  ...properties.map((pg) => ({ value: pg.id, label: pg.name })),
                ]}
              />
              <Select
                label="Room type"
                name="discovery-room-type"
                value={filters.roomType}
                onChange={(event) => onChange('roomType', event.target.value as RoomType | '')}
                options={[{ value: '', label: 'Any room type' }, ...options(ROOM_TYPE_LABELS)]}
              />
              <Select
                label="Property type"
                name="discovery-property-type"
                value={filters.propertyType}
                onChange={(event) =>
                  onChange('propertyType', event.target.value as PropertyType | '')
                }
                options={[
                  { value: '', label: 'Any property type' },
                  ...options(PROPERTY_TYPE_LABELS),
                ]}
              />
            </div>
          </details>
          <p className="mt-5 text-xs text-text-secondary">
            Gender policies are demo assignments for the mock properties, not confirmed property
            rules. Confirm eligibility with the property team.
          </p>
        </div>
      </Modal>
    </section>
  );
}
