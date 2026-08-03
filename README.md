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

Use `http://localhost:4321/dashboard/` as the SPA redirect URI and logout return URL for the SCAG Dashboard app registration.

SCAG sign-out uses the Microsoft Entra common logout endpoint and returns to `PUBLIC_DASHBOARD_URL` after the identity session is ended.

## Environment variables

- `PUBLIC_AZURE_CLIENT_ID`: Browser-exposed Microsoft Entra application client ID.
- `PUBLIC_AZURE_TENANT_ID`: Browser-exposed tenant ID for the Entra directory.
- `PUBLIC_DASHBOARD_URL`: Browser-exposed dashboard URL, also used as the logout return target.
- `PUBLIC_EHEALTH_PORTAL_URL`: Browser-exposed destination for the healthcare provider and pharmacist launch buttons.
- `PUBLIC_OPENNCP_PORTAL_URL`: Browser-exposed shared OpenNCP auto-login URL for Admin and Reports users.

## Role mapping

- `HealthcareProvider` -> eHealth Portal
- `Pharmacist` -> eHealth Portal
- `Admin` -> Administration
- `Reports` -> Reports