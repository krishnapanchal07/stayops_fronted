> Frontend test cleanup: the temporary Node test scripts, custom TypeScript/VM loader, npm test commands, and their backend Node integration runner were removed at the user's request. Earlier test results and implementation file lists below are historical; those frontend tests are no longer retained.

# StayOps

StayOps is a role-based PG / Hostel management platform.

The frontend includes the design system, layouts, API-backed authentication,
RBAC and protected routing. Business modules continue to use their existing mock
services. See [backend setup](../Backend/README.md) for PostgreSQL, migrations,
SMTP, environment settings, and secure administrator bootstrap.

## Commands

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd run format
```

The app starts at `http://localhost:5173`.

## Authentication setup

Copy `.env.example` to `.env` only if it does not exist; the default API base is
`http://localhost:8000/api/v1`. Start the backend before signing in. Existing mock
credentials no longer authenticate. Use the backend's interactive bootstrap and
restricted account provisioning instead of default passwords.

The inquiry registration form and role-specific dashboard destinations are
preserved. See [remaining mock data](src/mock/AUTH.md) for the distinction between
new database accounts and legacy business records.

## Inquiry and tenant APIs (Phase 2A + 2B)

Inquiry and tenant service operations now use the existing Axios client, access
headers and refresh flow. Configure the API URL as in Phase 1 and apply backend
Alembic migration `0002_inquiries_tenants`. `/register` saves a general lead and
never provisions an authentication role. Admin inquiry lists include these leads.

Create or convert a tenant, then use **Send account invitation** on the tenant
detail screen as Super Admin. New accounts receive the existing password setup
link. Existing TENANT accounts receive a mailbox proof link: sign in first, then
open the link to connect the profile. `/tenants/me` controls self-service identity;
accounts without a linked profile or room see onboarding/empty states.

Room details, conversion previews and allocation selectors check server
availability. Property search/maps remain on the unchanged mock property/room
services. The server owns a temporary reference catalog plus a durable allocation
ledger; browser-local Room Management changes do not persist server allocations.
This development boundary is disabled in production until canonical inventory is
implemented. See Backend/README.md for endpoints, migration, security, file list,
transaction behavior and replacement guidance.

Tenant checkout saves move-out and releases the bed; financial settlement and
document closure remain unavailable. Payments, complaints, visitors, leave,
notices and roommate data are not fabricated for persistent tenants. Legacy mock
modules/stores remain separate; they have not been migrated in this phase.

Run `npm.cmd run test:workflows` in addition to auth/discovery tests, lint and build.
Backend pytest executes the live service tests against isolated PostgreSQL.

## Phase 2C — Persistent Staff Management

`/admin/staff` now uses PostgreSQL staff profiles and the existing authenticated
Axios client. Apply backend Alembic revision `0003_staff_management` before use.
The existing Add Staff form creates a linked login account and sends a secure
password-setup email through configured SMTP. Staff then use the normal login
page and existing role dashboard. There are no default staff passwords.

Super Admin can select an existing compatible login account explicitly in the
form. Such accounts retain their current identity/password/access until the
account holder signs in and opens the email confirmation link. The staff detail
page labels pending links and supports **Resend invitation**. Email/role are
immutable through generic staff editing.

The staff list retains its Tailwind design and uses debounced server search,
filters, sorting, pagination and real summary counts. Property choices come from
the trusted backend catalog and are checked again on mutation. Owners with the
existing permissions can view/edit only staff whose entire property scope they
control; provisioning/linking/invitation sends remain Super Admin-only.

Deactivate disables login and revokes sessions. Activate enables login without
restoring old sessions. On leave preserves existing enabled/disabled access.
Accounts created inactive must be activated and sent a fresh setup invitation.

Run `npm.cmd run test:staff` alongside auth/discovery/workflow tests, lint and
build. Backend pytest runs the live staff setup/login regression against isolated
PostgreSQL with mocked SMTP. See Backend/README.md for endpoints, file list,
transaction guarantees, migration and remaining development-inventory limits.
# Phase 3 property integration

Property list/detail/form and the new `PropertyGallery.tsx` use the shared API
client through `services/property/propertyService.ts`. The admin list performs
server-side search, filters, sorting and pagination. Modal content scrolls within
the viewport without a fixed height. Image previews are removed/revoked when no
longer needed; submit/upload actions guard repeated clicks.

Public discovery hooks, listing images, details, featured properties and maps now
use canonical published property metadata and saved coordinates. Missing locations
are explicitly shown instead of fabricated pins. Room availability still joins the
existing transitional room catalog; new properties show "Rooms coming soon".

Other affected files include `types/property.ts`, `types/room.ts`,
`utils/propertyValidation.ts`, `utils/pgDiscovery.ts`, `hooks/usePGDiscovery.ts`,
`components/discovery/{DiscoveryImage,PGListingCard,PGMap,PGMapMarker}.tsx`,
`components/landing/FeaturedPGSection.tsx` and the find-room pages.

Final validation: backend **112 passed** (93 retained tests plus 19 temporary
property/image checks); TypeScript/Vite build passed; ESLint **zero errors and
warnings**; Alembic reported no schema drift; `git diff --check` passed. Existing
Vite large-chunk/mixed-import notices and Starlette TestClient deprecation remain.
No frontend test scripts currently exist after the earlier requested cleanup;
browser verification and build/lint were used instead. Temporary Phase 3 QA scripts,
fixtures, accounts and property uploads were removed after successful checks.
Three reusable demos, 12 photos and 36 WebP variant files were preserved.

See `../Backend/README.md` Phase 3 section for endpoints, migration, validation,
storage/consistency details, photo credits, browser coverage and explicit limits.

Phase 4 now uses canonical PostgreSQL inventory for buildings, floors, rooms,
beds, availability, allocation and public discovery. See `../Backend/README.md`,
“Phase 4 delivery and verification”, for the complete 20-point implementation,
migration, endpoint, mock-audit, browser-test and limitations report. Earlier
Phase 3 notes about a transitional room catalog are superseded. No permanent
frontend QA harness was added.
