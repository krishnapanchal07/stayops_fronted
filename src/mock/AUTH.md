# StayOps mock authentication (development only)

These accounts exist only in `credentials.json`. They are not shown in the login UI.

Shared demo password: `StayOps@123`

| Email | Password | Role |
|---|---|---|
| `krishna@stayops.com` | `krishna@2908` | Super Admin |
| `admin@stayops.com` | `StayOps@123` | Super Admin |
| `owner@stayops.com` | `StayOps@123` | Owner |
| `warden@stayops.com` | `StayOps@123` | Warden |
| `accountant@stayops.com` | `StayOps@123` | Accountant |
| `security@stayops.com` | `StayOps@123` | Security |
| `maintenance@stayops.com` | `StayOps@123` | Maintenance |
| `student@stayops.com` | `StayOps@123` | Tenant |
| `onboarding@stayops.com` | `StayOps@123` | Tenant (no room assigned) |
| `inactive@stayops.com` | `StayOps@123` | Inactive tenant |

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
