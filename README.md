# SCAG Dashboard

Static Astro dashboard for the Shared Care Access Gateway. The app authenticates users with Microsoft Entra ID through MSAL Browser, reads app roles from the ID token, and renders launch buttons only for the downstream systems each user can access.

## Stack

- Astro
- Tailwind CSS
- MSAL Browser

## Local setup

1. Copy `.env.example` to `.env`.
2. Fill in the Microsoft Entra app values and downstream URLs.
3. Install dependencies with `npm install`.
4. Start the dev server with `npm run dev`.

## Environment variables

- `PUBLIC_AZURE_CLIENT_ID`: Microsoft Entra application client ID.
- `PUBLIC_AZURE_TENANT_ID`: Tenant ID for the Entra directory.
- `PUBLIC_DASHBOARD_URL`: Public URL for the dashboard, also used as the logout return target.
- `PUBLIC_EHEALTH_PORTAL_URL`: Destination for the healthcare provider launch button.
- `PUBLIC_OPENNCP_MANAGER_URL`: Destination for the pharmacist launch button.
- `PUBLIC_ADMIN_PORTAL_URL`: Destination for the admin launch button.
- `PUBLIC_REPORTS_URL`: Destination for the reporting launch button.

## Role mapping

- `HealthcareProvider` -> eHealth Portal
- `Pharmacist` -> OpenNCP Manager
- `Admin` -> Administration
- `Reports` -> Reports