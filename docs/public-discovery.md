# Public PG discovery — Part 2

The public `/find-room` route now has a dedicated property discovery experience.
The existing tenant search, room details, inquiry implementation, landing page,
authentication, dashboard layouts, guards, roles, services and mock JSON are unchanged.

## Routes and navigation

- `/find-room`: lazy-loaded public search with filters, pagination and a map.
- `/find-room/properties/:propertyId`: lazy-loaded public property details.
- `/find-room/:roomId?bed=:bedId`: existing public room details and inquiry form.
- `/tenant/find-room` and its detail route: existing private components.
- `publicPropertyDetailPath()` encodes property IDs. Existing room helpers retain
  the selected bed ID. React Router's route ranking distinguishes the new
  property path from the existing room path.
- Discovery has its own wide layout. Guest login/signup and authenticated
  dashboard navigation retain their existing destinations. RootRedirect is unchanged.
- Search controls, sort, page and the optional map restriction use URL parameters;
  browser back/forward restores these values. Property transitions scroll to the
  top without resetting the map for changes to search parameters.

## Data and filters

`usePGDiscovery` calls `propertyService.getProperties()` and
`roomService.listAvailableListings(emptyFindRoomFilters())` once per mount/retry.
All filtering after that is local; typing and map gestures do not call the services.

`aggregatePublicPGs` produces a public projection rather than exposing operational
property fields. Only ACTIVE properties with an available-bed record appear.
Duplicate room/bed identities and non-finite/negative rents are excluded.

- One card and one marker per property, never per bed.
- Starting rent is the minimum qualifying available-bed rent.
- Available rooms are distinct room IDs; available beds are distinct room/bed IDs.
- Room and bed order, image choice, amenity order and sorting are deterministic.
- Images come from room data, with a consistent missing/broken-image fallback.
- The current mock services produce 160 available-bed records. Public visibility
  reduces these to **7 active properties and 98 available beds**; Ahmedabad has
  **6 properties and 89 available beds**. These are derived values, not UI constants.

Supported filters: query, city, property, rent range, room type, sharing, property
type and multiple amenities. Text also matches the existing city/address fields;
there is no locality lookup, gender/verification/rating filter or invented distance.
Shared room filtering contracts and rent boundaries are reused. Room type, sharing,
rent and room amenities must match the same available bed. Property-level amenities
apply at property level; additional room amenities come from the matching beds.
Prices and room/bed counts are recomputed after filtering.

Search text is controlled through the URL and debounced for 300 ms. Other controls
apply immediately and reset pagination. Quick chips use the same state. Derived
results, lookup maps and page slices use useMemo; cards/markers use memo and stable
callbacks. Unchanged groups keep their references. A second deferred copy of the
search input is unnecessary alongside the debounce.

Property details group available beds into rooms and offer a bed selector. The
selected bed opens the unchanged inquiry-capable room page. Inactive/maintenance
property details show an unavailable state. Active properties with no beds can
show their public information and a clear no-availability message.

## Coordinates

`propertyLocations.ts` is an independent public adapter keyed by existing IDs.
Coordinates are manually chosen, two-decimal-place demo locality positions for
the localities named in mock addresses. They are not surveyed buildings or
verified geocoding results. Every mapped location records its demo source and
approximate precision. The UI explicitly states this limitation.

Coordinates are validated for finite values and the Web Mercator latitude range.
Unknown IDs return null and stay in ordinary results without producing markers.
An explicit map-area restriction excludes unmapped properties and explains that
exclusion; removing it restores normal discovery. No precise distance, directions,
geolocation, address geocoding or Nominatim requests are implemented. The adapter
can later be replaced with validated backend coordinates without changing services.

## Map behavior

React Leaflet 5.0.0, Leaflet 1.9.4 and @types/leaflet 1.9.22 are installed.
The map uses MapContainer, TileLayer, Marker, Tooltip, ZoomControl, useMap and
useMapEvents, plus vendor CSS and a small scoped Leaflet stylesheet.

- Wheel, drag, zoom controls, double-click and supported touch gestures are enabled.
- Initial/changed property sets fit their valid positions; one property uses a
  sensible maximum fit zoom. Ordinary rerenders, pagination and sort changes do
  not reset a manually adjusted viewport.
- A single shared `{ id, source }` selection drives card and marker styling.
- Card hover/focus schedules a guarded 120 ms focus followed by a 650 ms flyTo.
  Reduced-motion users receive an immediate setView. Clearing hover never resets
  the viewport. Focus depends on property identity/coordinates, not mouse movement.
- Marker hover/focus displays the map tooltip and highlights only the marker;
  it does not highlight listing cards or change the listing page.
  **Marker hover does not fly the map**, so it cannot
  move its own click target. Pointer clicks and Enter/Space open public property
  details, never an arbitrary room or private admin route.
- Icons are memoized. At wide regional zooms, compact purple pins avoid overlapping
  price labels; hovering highlights the price, and local zooms show price labels.
  A useSyncExternalStore subscription keeps the zoom presentation synchronized.
- Only deliberate map gestures enable “Search in this area”, with a 250 ms bounds
  debounce. Programmatic focus is not treated as an area-search request. The
  restriction is explicit, stored in the URL and removable.
- The map shows all filtered properties across list pages. Cards paginate four at
  a time; property detail rooms paginate six at a time. Seven current properties
  do not justify adding a clustering dependency.
- Below 1024 px the List/Map toggle avoids cramped columns. A fresh mobile list
  does not initialize Leaflet. After activation, hiding the map retains its
  instance. ResizeObserver and invalidateSize handle showing/resizing it.
- A lazy-module/render boundary preserves list access on map failure. Missing
  tiles produce a retry message while listing/marker data remain available.
- Effects, subscriptions, observers, DOM listeners and scheduled work clean up.

## Tile provider configuration

Defaults: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`, with visible
OpenStreetMap contributor attribution. No API key, prefetch, scraping or private
user information is used. Browser caching/referrer behavior is preserved.

Set both environment variables when changing providers:

```dotenv
VITE_DISCOVERY_TILE_URL=https://your-provider.example/{z}/{x}/{y}.png
VITE_DISCOVERY_TILE_ATTRIBUTION=Your provider's required attribution
```

Vite reads these settings when starting/building. A future deployment should choose
a provider suitable for its traffic. Public OSM tiles are best-effort and subject
to the [OSM tile policy](https://operations.osmfoundation.org/policies/tiles/).
Implementation references: [React Leaflet](https://react-leaflet.js.org/docs/start-installation/)
and [Leaflet](https://leafletjs.com/reference.html).

## Isolation and code splitting

Existing files modified in Part 2:

- `src/routes/AppRouter.tsx`: use the new public-only layout and lazy public pages.
- `src/routes/paths.ts`: add the public property constant/helper.
- `package.json`: mapping dependencies, Leaflet types and `test:discovery` script.
- `package-lock.json`: dependency lock updates.

Created files:

- `src/layouts/DiscoveryLayout.tsx`
- `src/pages/find-room/PublicPGSearchPage.tsx`
- `src/pages/find-room/PublicPGDetailsPage.tsx`
- `src/components/discovery/DiscoveryFilters.tsx`
- `src/components/discovery/DiscoveryImage.tsx`
- `src/components/discovery/DiscoveryMapPanel.tsx`
- `src/components/discovery/PGListingCard.tsx`
- `src/components/discovery/PGMap.tsx`
- `src/components/discovery/PGMapMarker.tsx`
- `src/components/discovery/MapFocusController.tsx`
- `src/hooks/usePGDiscovery.ts`
- `src/hooks/useDebouncedValue.ts`
- `src/types/discovery.ts`
- `src/utils/pgDiscovery.ts`
- `src/utils/propertyLocations.ts`
- `src/config/discoveryMap.ts`
- `src/styles/discovery-map.css`
- `scripts/discovery.test.cjs`
- `docs/public-discovery.md`

Search and property details are separate lazy route chunks; Leaflet and its CSS
are in another lazy map chunk. The landing page does not statically import Leaflet.
The production build exposes distinct PublicPGSearchPage, PublicPGDetailsPage and
PGMap assets. The map module is about 48 kB gzipped. Existing shared-service dynamic
import and main-bundle-size warnings remain outside this change's scope.
Page/card styling uses Tailwind and existing tokens; custom CSS is scoped to map
markers, controls and attribution. No global theme values or landing styles change.

## Verification

Commands:

```sh
npm run build
npm run lint
npm run lint:oxlint
npm run test:discovery
```

Build includes TypeScript validation. ESLint and oxlint retain the three existing
useMemo dependency warnings in PropertyListPage; unrelated code is unchanged.

Seven automated tests cover aggregation/deduplication, deterministic output,
inactive/maintenance exclusion, same-bed filters, missing coordinates/images,
coordinate/URL validation, real-service counts, bed-specific detail/inquiry
submission and duplicate-inquiry rejection, every role's auth/session/logout,
real AppRouter public route ranking, and marker pointer/keyboard handler identity.
Service tests use isolated in-memory storage and do not alter application data.

Browser checks performed in the local in-app browser:

- Public search, city and amenity filters, pagination, debounced empty search and clearing.
- Rendered OSM tiles and visible attribution; zoom controls, wheel zoom, drag-to-pan.
- Explicit area search with consistent counts/markers and removable restriction.
- Card focus/hover highlighting; marker focus showing its tooltip without changing
  listing highlights or the current page.
- Keyboard marker navigation and a pointer click on a property from another list page.
- Public property information, bed selection and existing bed-specific room detail
  navigation; the original inquiry dialog opens for the selected bed.
- Back navigation restores the search URL's city/page parameters.
- Mobile (390 px) and tablet (820 px) layouts; mobile has no horizontal overflow.
  A fresh mobile list has no map; switching back to List retains the hidden map DOM.
- Guest root/landing rendering and scroll-story initialization; leaving the landing
  for search removes its GSAP pin spacer. Landing sources remain unchanged.
- Login, root redirects, restored sessions, dashboard content and logout for all
  seven roles: Super Admin, Owner, Warden, Accountant, Security, Maintenance, Tenant.
- Original tenant search and tenant bed-specific detail navigation, guest protection
  of tenant discovery, and the existing `/register` inquiry page.

Limitations: no separate approved design image was present in the supplied
attachment, so the implementation follows the requested split layout and existing
theme. Current mock photos are placeholders and locations are demo approximations.
Physical touch/pinch behavior was configured but not tested on a physical device.
Network/tile/chunk failure paths were implemented but not fault-injected in the
browser. Dashboard checks are smoke tests, not exhaustive tests of every private
module, permission combination or workflow. No backend, payment or booking feature
was added, and the Part 1 hero was not changed to introduce a new filter UI.

## Discovery toolbar refresh

The public search now uses a breadcrumb, locally managed lifestyle-image carousel,
compact desktop filter row, result count/reset row, and the existing list/map.
Property type, amenities, text search and city remain accessible in More Filters.
Filters still apply immediately and use the existing URL contract; locality adds
an exact match against the final locality segment of the existing property address.
Occupancy reuses the existing sharing filter and its available-bed calculations.

Gender uses Male, Female and Unisex choices backed by a separate public-only demo
policy adapter in `src/config/discoveryGenderPolicies.ts`. These are clearly
labelled demo assignments, not confirmed policies. Shared property JSON and tenant
search remain unchanged. Unknown policies are excluded for an active gender filter.
Distance sorting requests browser location only on selection, keeps that origin in component memory,
and computes approximate straight-line distances locally from demo pins. It does
not send location to an API, persist it in the URL, or represent travel distances.
Denied/unavailable location preserves the selected sort and shows a useful message.
Reopening a saved distance-sort URL requires location access again.

The carousel advances every five seconds by default; reduced-motion users start
paused. Visitors can select a slide using the centred dots; the play/pause and
arrow controls have been removed. Autoplay continues while hovered or focused
and pauses only for reduced motion or a hidden browser tab. Slide actions
apply existing amenity filters and move to the results. No booking flow is added.
Additional tests cover locality/occupancy combinations, distance ordering, and
gender-policy matching and URL validation.

Amenities and Services use local Lucide icon chips, mapped to the existing stored
amenity names. Unsupported features are labelled Not listed and disabled. No
claims about Wi-Fi speed, room size or 24-hour service are inferred from a basic
amenity. Additional existing amenities remain available under Other features.
Occupancy is not repeated in the modal; nonduplicate search fields are in Other
search options. Two original generated lifestyle images are local optimized JPEGs
(about 276 KiB combined), used as concepts rather than listing photos.
