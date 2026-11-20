/* Node's built-in runner; executes real TS adapters/services in isolated memory.
 * The tiny TS loader avoids adding a test framework or changing Vite configuration.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');

function sandbox(overrides = {}) {
  const cache = new Map();
  const storage = new Map();
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  function load(request, parent = root) {
    if (overrides[request]) return overrides[request];
    let file = request.startsWith('@/')
      ? path.join(root, 'src', request.slice(2))
      : path.resolve(parent, request);
    if (!path.extname(file)) file += fs.existsSync(`${file}.ts`) ? '.ts' : '.tsx';
    if (file.endsWith('.json')) return JSON.parse(fs.readFileSync(file, 'utf8'));
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
        target: ts.ScriptTarget.ES2023,
      },
    }).outputText;
    vm.runInNewContext(
      code,
      {
        module,
        exports: module.exports,
        require: (name) => load(name, path.dirname(file)),
        structuredClone,
        URLSearchParams,
        localStorage,
        window: { setTimeout: (callback) => setTimeout(callback, 0), localStorage },
        setTimeout,
        console,
        URL,
        Date,
        Blob,
      },
      { filename: file },
    );
    return module.exports;
  }
  return load;
}

function fixtures() {
  const property = {
    id: 'test-pg',
    name: 'Test PG',
    address: 'Test Road',
    city: 'Ahmedabad',
    state: 'Gujarat',
    postalCode: '380000',
    type: 'PG',
    status: 'ACTIVE',
    description: 'Test property',
    amenities: ['Wi-Fi'],
    monthlyRevenue: 12345,
    recentActivity: ['private'],
  };
  const bed = (id, roomId, rent, amenities = [], roomType = 'STANDARD') => ({
    id,
    roomId,
    bedId: id,
    bedNumber: id,
    title: id,
    propertyId: property.id,
    propertyName: property.name,
    buildingName: 'A',
    floorName: '1',
    roomNumber: roomId,
    roomType,
    sharingType: '2_SHARING',
    monthlyRent: rent,
    securityDeposit: rent,
    amenities,
    images: [],
    description: '',
  });
  return {
    property,
    beds: [
      bed('b2', 'r1', 8000, ['AC']),
      bed('b1', 'r1', 7000, ['AC']),
      bed('b3', 'r2', 6000, ['Study Table'], 'DELUXE'),
    ],
  };
}

test('aggregation separates properties, rooms and beds and excludes non-public data', () => {
  const load = sandbox();
  const { aggregatePublicPGs } = load('@/utils/pgDiscovery');
  const { property, beds } = fixtures();
  const [pg] = aggregatePublicPGs([property], [...beds, beds[0]]);
  assert.equal(pg.availableBedCount, 3);
  assert.equal(pg.availableRoomCount, 2);
  assert.equal(pg.startingRent, 6000);
  assert.equal(pg.location, null);
  assert.equal(pg.image, undefined);
  assert.equal('monthlyRevenue' in pg, false);
  assert.equal('recentActivity' in pg, false);
  assert.equal(aggregatePublicPGs([{ ...property, status: 'INACTIVE' }], beds).length, 0);
  assert.equal(aggregatePublicPGs([{ ...property, status: 'MAINTENANCE' }], beds).length, 0);
  assert.equal(aggregatePublicPGs([property], []).length, 0);
  assert.equal(
    JSON.stringify(pg),
    JSON.stringify(aggregatePublicPGs([property], [...beds].reverse())[0]),
  );
});

test('room/rent/amenity filters match the same bed and recompute minimum/counts', () => {
  const load = sandbox();
  const { aggregatePublicPGs, filterPublicPGs, emptyDiscoveryFilters } =
    load('@/utils/pgDiscovery');
  const { property, beds } = fixtures();
  const source = aggregatePublicPGs([property], beds);
  const filter = (patch) => filterPublicPGs(source, { ...emptyDiscoveryFilters(), ...patch });
  assert.equal(filter({ amenities: ['AC'], roomType: 'DELUXE' }).length, 0);
  assert.equal(filter({ amenities: ['AC'], rentRange: 'UNDER_6000' }).length, 0);
  const [filtered] = filter({ amenities: ['AC'], rentRange: '6000_8000' });
  assert.equal(filtered.availableBedCount, 2);
  assert.equal(filtered.availableRoomCount, 1);
  assert.equal(filtered.startingRent, 7000);
  assert.equal(filter({ city: 'Pune' }).length, 0);
  assert.equal(filter({ query: 'test road' }).length, 1);
  assert.equal(filter({ amenities: ['Wi-Fi'] })[0], source[0]);
  assert.equal(source[0].availableBedCount, 3);
});

test('URL parsing validates enums and coordinates, with inclusive and antimeridian bounds', () => {
  const load = sandbox();
  const { parseDiscoveryFilters } = load('@/utils/pgDiscovery');
  const { parseDiscoveryBounds, locationWithinBounds, isValidCoordinate, getPropertyLocation } =
    load('@/utils/propertyLocations');
  const filters = parseDiscoveryFilters(
    new URLSearchParams('roomType=BOGUS&sharingType=2_SHARING&amenity=AC&amenity=AC'),
  );
  assert.equal(filters.roomType, '');
  assert.equal(filters.sharingType, '2_SHARING');
  assert.equal(filters.amenities.length, 1);
  for (const raw of ['', '1,2,3', 'NaN,1,2,3', '23,72,22,73', '22,181,23,182', ',0,2,3'])
    assert.equal(parseDiscoveryBounds(raw), null);
  assert.equal(isValidCoordinate(Infinity, 72), false);
  assert.equal(isValidCoordinate(95, 72), false);
  const location = getPropertyLocation('prop-sunrise');
  assert.equal(location.precision, 'approximate-locality');
  assert.equal(
    locationWithinBounds(location, { south: 23.03, north: 23.04, west: 72.51, east: 72.6 }),
    true,
  );
  assert.equal(locationWithinBounds(null, { south: 0, north: 30, west: 70, east: 80 }), false);
  assert.equal(
    locationWithinBounds(
      { latitude: 0, longitude: 179 },
      { south: -1, north: 1, west: 170, east: -170 },
    ),
    true,
  );
});

test('real services aggregate active properties and preserve bed-specific inquiries', async () => {
  const load = sandbox();
  const { aggregatePublicPGs } = load('@/utils/pgDiscovery');
  const { roomService } = load('@/services/room/roomService');
  const { propertyService } = load('@/services/property/propertyService');
  const { emptyFindRoomFilters } = load('@/utils/roomListing');
  const { publicPropertyDetailPath, publicFindRoomDetailPath } = load('@/routes/paths');
  const [properties, beds] = await Promise.all([
    propertyService.getProperties(),
    roomService.listAvailableListings(emptyFindRoomFilters()),
  ]);
  const pgs = aggregatePublicPGs(properties, beds);
  assert.ok(pgs.length > 0);
  assert.equal(new Set(pgs.map((pg) => pg.id)).size, pgs.length);
  for (const pg of pgs) {
    assert.equal(properties.find((property) => property.id === pg.id).status, 'ACTIVE');
    assert.equal(pg.availableRoomCount, new Set(pg.listings.map((bed) => bed.roomId)).size);
    assert.equal(pg.startingRent, Math.min(...pg.listings.map((bed) => bed.monthlyRent)));
  }
  const pg = pgs[0];
  const bed = pg.listings[0];
  assert.equal(publicPropertyDetailPath(pg.id), `/find-room/properties/${pg.id}`);
  assert.equal(publicPropertyDetailPath('a/b'), '/find-room/properties/a%2Fb');
  assert.equal(
    publicFindRoomDetailPath(bed.roomId, bed.bedId),
    `/find-room/${bed.roomId}?bed=${bed.bedId}`,
  );
  const { inquiryService } = load('@/services/inquiry/inquiryService');
  const input = {
    firstName: 'Discovery',
    lastName: 'Test',
    email: 'discovery-test@example.invalid',
    phone: '9000000000',
    preferredMoveIn: '',
    message: 'Is this available bed suitable for my stay?',
    roomId: bed.roomId,
    bedId: bed.bedId,
  };
  const inquiry = await inquiryService.submitInquiry(input);
  assert.equal(inquiry.bedId, bed.bedId);
  assert.equal(inquiry.propertyId, pg.id);
  assert.equal(inquiry.status, 'SUBMITTED');
  await assert.rejects(() => inquiryService.submitInquiry(input), /already have an open inquiry/);
});

test('existing login, restored sessions and logout work for every role in memory', async () => {
  const load = sandbox();
  const { authService } = load('@/services/auth/authService');
  const { RoleCode } = load('@/constants/roles');
  const { getHomePath } = load('@/routes/paths');
  const users = load('@/mock/users.json');
  const credentials = load('@/mock/credentials.json');
  for (const role of Object.values(RoleCode)) {
    const user = users.find(
      (candidate) => candidate.status === 'ACTIVE' && candidate.roleId === role,
    );
    const credential = credentials.find((candidate) => candidate.userId === user.id);
    const session = await authService.login(credential.email, credential.password);
    assert.equal(session.role, role);
    assert.ok(getHomePath(role).endsWith('/dashboard'));
    assert.equal(authService.restoreSession().user.id, user.id);
    await authService.logout();
    assert.equal(authService.restoreSession(), null);
  }
});

test('public property route outranks room details in the real AppRouter configuration', () => {
  const router = require('react-router-dom');
  const jsx = (type, props) => ({ type, props });
  const overrides = {
    react: { lazy: () => 'LazyRoute', Suspense: 'Suspense' },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    'react-router-dom': { useRoutes: (routes) => routes },
    '@/routes/authRoutes': { authRoutes: [] },
    '@/routes/dashboardRoutes': { dashboardRoutes: [] },
  };
  for (const [module, name] of [
    ['@/layouts/BrowseLayout', 'BrowseLayout'],
    ['@/layouts/DiscoveryLayout', 'DiscoveryLayout'],
    ['@/layouts/PublicLayout', 'PublicLayout'],
    ['@/components/feedback/LoadingSpinner', 'LoadingSpinner'],
    ['@/pages/common/ForbiddenPage', 'ForbiddenPage'],
    ['@/pages/common/NotFoundPage', 'NotFoundPage'],
    ['@/pages/find-room/FindRoomDetailsPage', 'FindRoomDetailsPage'],
    ['@/routes/RootRedirect', 'RootRedirect'],
  ])
    overrides[module] = { [name]: name };
  const load = sandbox(overrides);
  const routes = load('@/routes/AppRouter').AppRouter();
  const property = router.matchRoutes(routes, '/find-room/properties/prop-sunrise');
  assert.equal(property.at(-1).route.path, '/find-room/properties/:propertyId');
  assert.equal(property.at(-1).params.propertyId, 'prop-sunrise');
  assert.equal(
    router.matchRoutes(routes, '/find-room/room-sunrise-205?bed=bed-205-b').at(-1).route.element
      .type,
    'FindRoomDetailsPage',
  );
  assert.equal(
    router.matchRoutes(routes, '/find-room').at(-2).route.element.type,
    'DiscoveryLayout',
  );
});

test('map marker handlers share property identity and support Enter and Space activation', () => {
  const jsx = (type, props) => ({ type, props });
  const load = sandbox({
    react: {
      memo: (component) => component,
      useEffect: () => {},
      useMemo: (factory) => factory(),
      useRef: () => ({ current: null }),
      useCallback: (callback) => callback,
      useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    },
    'react/jsx-runtime': { jsx, jsxs: jsx },
    leaflet: { divIcon: (options) => options },
    'react-leaflet': {
      Marker: 'Marker',
      Tooltip: 'Tooltip',
      useMap: () => ({ getZoom: () => 12 }),
      useMapEvents: () => {},
    },
  });
  const { PGMapMarker } = load('@/components/discovery/PGMapMarker');
  const highlights = [];
  const opened = [];
  const marker = PGMapMarker({
    property: {
      id: 'prop-sunrise',
      name: 'Sunrise PG',
      city: 'Ahmedabad',
      startingRent: 6000,
      location: { latitude: 23.03, longitude: 72.51 },
    },
    highlighted: false,
    onHighlight: (id) => highlights.push(id),
    onOpen: (id) => opened.push(id),
  });
  const handlers = marker.props.eventHandlers;
  handlers.mouseover();
  handlers.mouseout();
  handlers.click();
  for (const key of ['Enter', ' '])
    handlers.keydown({ originalEvent: { key, preventDefault() {} } });
  handlers.keydown({ originalEvent: { key: 'Escape' } });
  assert.deepEqual(highlights, ['prop-sunrise', null]);
  assert.deepEqual(opened, ['prop-sunrise', 'prop-sunrise', 'prop-sunrise']);
});

test('locality filters survive URL parsing and combine with bed occupancy', () => {
  const { aggregatePublicPGs, parseDiscoveryFilters, filterPublicPGs } =
    sandbox()('@/utils/pgDiscovery');
  const { property, beds } = fixtures();
  const properties = aggregatePublicPGs(
    [{ ...property, address: '12 Test Road, Satellite' }],
    beds,
  );
  const filters = parseDiscoveryFilters(
    new URLSearchParams('locality=Satellite&sharingType=2_SHARING'),
  );
  assert.equal(filters.locality, 'Satellite');
  assert.equal(filterPublicPGs(properties, filters)[0].availableBedCount, 3);
  assert.equal(filterPublicPGs(properties, { ...filters, locality: 'Baner' }).length, 0);
  assert.equal(filterPublicPGs(properties, { ...filters, sharingType: '1_SHARING' }).length, 0);
});

test('distance sorting uses the supplied origin, puts unmapped properties last and preserves input', () => {
  const { sortPublicPGs, discoveryDistance } = sandbox()('@/utils/pgDiscovery');
  const origin = { latitude: 23, longitude: 72 };
  const records = [
    { id: 'far', name: 'Far', location: { latitude: 24, longitude: 72 } },
    { id: 'unknown', name: 'Unknown', location: null },
    { id: 'near', name: 'Near', location: { latitude: 23.01, longitude: 72 } },
  ];
  assert.equal(
    Array.from(sortPublicPGs(records, 'distance', origin), (pg) => pg.id).join(','),
    'near,far,unknown',
  );
  assert.equal(records[0].id, 'far');
  assert.equal(discoveryDistance(origin, origin), 0);
  assert.equal(discoveryDistance(null, origin), Infinity);
  assert.ok(discoveryDistance(records[2].location, origin) > 1);
  assert.ok(discoveryDistance(records[2].location, origin) < 1.2);
});

test('gender policies filter all three options without changing available-bed counts', () => {
  const { aggregatePublicPGs, emptyDiscoveryFilters, filterPublicPGs, parseDiscoveryFilters } =
    sandbox()('@/utils/pgDiscovery');
  const { property, beds } = fixtures();
  for (const gender of ['male', 'female', 'unisex']) {
    const [pg] = aggregatePublicPGs([{ ...property, genderPolicy: gender }], beds);
    const filters = parseDiscoveryFilters(new URLSearchParams(`gender=${gender}`));
    assert.equal(filters.gender, gender);
    assert.equal(filterPublicPGs([pg], filters)[0].availableBedCount, 3);
    assert.equal(filterPublicPGs([pg], { ...filters, rentRange: 'UNDER_6000' }).length, 0);
    const other = gender === 'male' ? 'female' : 'male';
    assert.equal(filterPublicPGs([pg], { ...filters, gender: other }).length, 0);
    assert.equal(filterPublicPGs([pg], emptyDiscoveryFilters()).length, 1);
  }
  assert.equal(parseDiscoveryFilters(new URLSearchParams('gender=invalid')).gender, '');
  const [unknown] = aggregatePublicPGs([property], beds);
  assert.equal(
    filterPublicPGs([unknown], { ...emptyDiscoveryFilters(), gender: 'unisex' }).length,
    0,
  );
});
