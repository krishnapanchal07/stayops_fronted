import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { LoadingSpinner } from '@/components/feedback/LoadingSpinner';
import type { PGMapProps } from './PGMap';

const PGMap = lazy(() => import('./PGMap'));

class MapBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div role="alert" className="rounded-2xl border border-border bg-surface p-8 text-center">
          <h2 className="font-semibold">The map is unavailable</h2>
          <p className="mt-2 text-sm text-text-secondary">
            You can continue browsing and opening properties in the list.
          </p>
          <button
            className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white"
            onClick={() => window.location.reload()}
          >
            Reload page to retry
          </button>
        </div>
      );
    return this.props.children;
  }
}

export function DiscoveryMapPanel(
  props: Omit<PGMapProps, 'visible'> & { mobileMap: boolean; mapRequested: boolean },
) {
  const [desktop, setDesktop] = useState(() => window.matchMedia('(min-width: 1024px)').matches);
  // Once loaded, retain the same map while switching mobile List/Map views.
  const [activated, setActivated] = useState(desktop || props.mobileMap);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 1024px)');
    const update = () => {
      setDesktop(query.matches);
      if (query.matches) setActivated(true);
    };
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  const visible = desktop || props.mobileMap;
  return (
    <aside
      aria-label="Property map"
      className={`${visible ? 'block' : 'hidden'} min-w-0 self-start lg:sticky lg:top-24`}
    >
      {(activated || visible || props.mapRequested) && (
        <MapBoundary>
          <Suspense
            fallback={
              <div className="flex min-h-96 items-center justify-center rounded-2xl border border-border bg-surface">
                <LoadingSpinner label="Loading interactive map" />
              </div>
            }
          >
            <PGMap {...props} visible={visible} />
          </Suspense>
        </MapBoundary>
      )}
    </aside>
  );
}
