> Frontend test cleanup: the temporary Node test scripts, custom TypeScript/VM loader, npm test commands, and their backend Node integration runner were removed at the user's request. Earlier test results and implementation file lists below are historical; those frontend tests are no longer retained.

# StayOps

StayOps is a role-based PG / Hostel management platform.

The frontend includes the design system, layouts, API-backed authentication,
RBAC and protected routing. Authentication, inquiries, tenants, staff, properties,
inventory and finance use FastAPI/PostgreSQL. Unfinished operational modules retain
their isolated legacy services. See [backend setup](../Backend/README.md) for PostgreSQL, migrations,
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

Run `npm.cmd run build` and `npm.cmd run lint`. Backend pytest uses isolated PostgreSQL.
The former temporary frontend test harness was removed.

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

Run `npm.cmd run build` and `npm.cmd run lint`. Backend pytest runs staff regressions against isolated
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

## Phase 5 — persistent finance (26 November 2026)

Apply backend revision `0006_finance` after `0005_inventory`. Invoices, line items,
payments, expenses, outstanding dues, receipts, financial reports and finance
statistics now use PostgreSQL through the existing Axios/refresh client. There is
no runtime finance fixture, browser business store, fake API wait or mock fallback.
Earlier notes saying tenant payments are unconnected are superseded by this section.

The existing invoice/payment/expense registers retain their cards, filters,
modals and detail routes. `useFinanceTable` uses debounced search, backend sorting,
20-row pages and the existing DataTable server controls. The tenant portal has
separately paginated ledger and invoice tables; every payment installment is shown.
The shared async hook now hides responses belonging to previous filters/records.
Forms preserve values on API validation errors and disable repeated submissions.
Creation requests retain an idempotency key for retries after ambiguous failures.

Finance property choices use `/finance/options/properties`; tenant choices use
`/finance/options/tenants?propertyId=...`; payment choices use scoped open invoices
for the selected tenant. Accountants can use these choices without unrelated tenant
management permissions. Property changes clear tenant/invoice/amount selections;
tenant changes clear invoice/amount; request keys suppress stale option responses.
Edit forms keep their selected values, including invoice identity snapshots.
The rent preview comes from the canonical agreed tenant rent; the server independently
validates and calculates the submitted line items and adjustments.

Owner/Super Admin and Accountant dashboards have property/date finance filters.
Financial charts and reports have no fixture fallback on empty results. Property
monthly revenue is the current month's successful receipts; unauthorized roles
receive no financial value. Tenant dashboards, profile finance summaries, invoices,
receipts and installment history use trusted account-to-tenant linkage.

Tenants cannot create successful payments. The former simulated Pay Now flow was
removed; tenants contact the property office and authorized staff record receipts.
Refund controls record a refund already completed outside the application; they
perform no money transfer. Expense cancellation retains the record and removes it
from paid expense totals. Checkout preserves invoices, outstanding dues and payment
history while releasing the bed. Receipts preserve saved tenant/property/room names
and download fresh authorized payment data from the receipt endpoint.

Money displays preserve paise. Form date defaults and backend finance calculations
use Asia/Kolkata. Large dialogs scroll within the viewport and keep their action
buttons reachable. Each register row has a single keyboard-accessible action button.

Changed areas: `services/finance/{api,financeService,invoiceService,paymentService,
expenseService}.ts`, `hooks/{useFinanceTable,useAsyncResource}.ts`, all finance
pages and forms, `FinanceFilters.tsx`, tenant Payments/Dashboard pages, admin tenant
financial summary, dashboard/report/tenant services, finance types/calculation/
validation/receipt helpers, shared Modal and currency formatting. The backend README
contains the full endpoint, integrity, migration, backup, mock audit and verification
report.

Deleted after consumer verification: invoice/payment/expense JSON fixtures,
`financeStore.ts`, unused Accountant/Tenant dashboard fixtures and `PayNowModal.tsx`.
The Admin dashboard fixture retains only unrelated operational scaffolding; its
finance fixture fields were removed. Other unfinished operational mock services
(complaints, visitors, leave, notices, documents, support and maintenance) remain
outside this migration. Reusable property/inventory demo assets were preserved.

Production build and lint pass. The backend suite passed 110 tests against
isolated PostgreSQL, including 17 finance cases.
The latest browser rerun confirmed invoice, partial payment and expense persistence
after refresh, receipt preview, and keyboard access in all three registers. Direct
SQL checks matched the amounts in the browser. Earlier real-browser checks covered
invoice create/edit/refresh, partial/full cash payments, receipts, expense create/
edit/cancel/refresh, dependent options/empty states, owner pagination, accountant
scope, owner/cross-tenant denial, unauthorized Security routes, checkout with dues,
post-checkout history, finance reports, and mobile/tablet/desktop observations.
Not all 91 requested browser scenarios were individually exercised; see the backend
README for precise remaining limitations. No frontend test framework, harness,
package command or new package dependency was added.

## Phase 5B — Razorpay Test Mode

Use backend revision `0007_razorpay` and configure the server-side test keys as
described in the [backend guide](../Backend/README.md#phase-5b--razorpay-test-mode).
There are no frontend secret settings or new frontend packages. The Finance
client uses the existing Axios and authentication refresh flow. The official
Razorpay Checkout script loads only when a tenant starts a payment.

From **Tenant → Payments → My Invoices**, select **Pay Now (Test Mode)** for an
eligible QA invoice, then confirm the displayed balance on the invoice page.
Use the methods in [Razorpay’s Test Mode instructions](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/#2-test-integration).
For example, choose Netbanking and use the Razorpay demo bank's **Success** or
**Failure** control. **Check status** can recover an interrupted or pending order
after refresh. Success is shown only after the API verifies capture and applies
the amount. The payment detail and receipt label test transactions, and manual
collections remain separate in dashboards and reports.

Production build and lint passed. Browser verification covered successful full and
partial invoice settlement, dismissal and reuse, provider decline, refresh, the
saved receipt preview, and separate actual and test totals in Admin Payment
Management. Phone and tablet checks confirmed long invoice identifiers wrap.
Public webhook delivery remains a deployment task. See the backend guide for the
full verification and configuration details.
