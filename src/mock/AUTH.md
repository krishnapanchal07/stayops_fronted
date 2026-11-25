# StayOps authentication and remaining mock data

Authentication now uses the FastAPI/PostgreSQL backend. Legacy mock credentials
are unused and cannot sign in. Create real accounts through the secure bootstrap
and super-admin provisioning flow in [Backend setup](../../../Backend/README.md).
No mock users or known development passwords are imported into the database.

`users.json` remains available to mock business services. Its IDs do not represent
authenticated database users. New UUID accounts have no inferred tenant/property
assignments; tenant-specific mock records can therefore be empty or show an
unavailable-profile/room state until those
business modules gain real backend integration. No fake identity mapping is used.

## Tenant records (Phase 2 Part 3)

`tenants.json` is the source of truth for managed tenant identity. Room beds reference these IDs where a real allocation exists. Generated occupancy fillers use synthetic IDs and are not tenant profiles.

## Authorization checklist

| Role | Allowed | Denied |
|---|---|---|
| SUPER_ADMIN | `/admin/dashboard`, properties, payments, reports | Tenant-only routes |
| OWNER | `/admin/dashboard`, properties, reports | `/warden/*`, `/tenant/*` |
| WARDEN | `/warden/dashboard`, tenants, rooms | `/admin/reports` |
| ACCOUNTANT | `/accountant/dashboard`, payments, invoices | Room allocation / admin rooms |
| SECURITY | `/security/dashboard`, visitor check-in | `/accountant/payments` |
| MAINTENANCE | `/maintenance/dashboard`, assigned complaints | `/accountant/payments` |
| TENANT | `/tenant/dashboard`, my room, payments | `/admin/dashboard`, `/admin/reports` |
