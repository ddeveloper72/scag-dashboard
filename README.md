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

SCAG sign-out uses the configured tenant's Microsoft Entra logout endpoint and returns to `PUBLIC_DASHBOARD_URL` after the identity session is ended.

## Current local endpoints

The current local `.env` configures these browser-visible endpoints:

| Variable | Current value | Use |
|---|---|---|
| `PUBLIC_DASHBOARD_URL` | `http://localhost:4321/dashboard/` | Dashboard redirect and logout return URL |
| `PUBLIC_EHEALTH_PORTAL_URL` | `http://localhost:8093/` | eHealth Portal base URL |
| `PUBLIC_EHEALTH_PORTAL_LOGIN_PATH` | `/#/login?autologin=1&returnTo=%2Fspa%2Fcountries` | eHealth Portal silent-login path |
| `PUBLIC_OPENNCP_PORTAL_URL` | `http://localhost:8098/` | OpenNCP base URL |
| `PUBLIC_OPENNCP_PORTAL_LOGIN_PATH` | `/login?autologin=1` | OpenNCP silent-login path |

The effective launch URLs are `http://localhost:8093/#/login?autologin=1&returnTo=%2Fspa%2Fcountries` for eHealth and `http://localhost:8098/login?autologin=1` for OpenNCP. The Entra client and tenant identifiers remain environment-managed and are not duplicated in this guide. All `PUBLIC_` values are compiled into the static browser bundle and are not secrets.

## Sign-in and handoff behavior

The dashboard uses MSAL Browser with the configured tenant, does not force an account picker, and keeps its account cache in browser-local storage. This allows the eHealth Portal and OpenNCP frontends to start their own OIDC sign-in against the existing Entra browser session without receiving a dashboard token. Each downstream frontend owns its own session and authorization.

The dashboard login page returns an already authenticated user to the dashboard instead of starting a second redirect. Sign-in and sign-out links are derived from `PUBLIC_DASHBOARD_URL`, so they continue to work when the dashboard is deployed below a different path.

## Docker

Astro embeds `PUBLIC_*` values into the browser bundle during the image build. Pass the values as build arguments, then run the generated static site with Nginx:

```powershell
docker build `
	--build-arg PUBLIC_AZURE_CLIENT_ID=your-entra-app-client-id `
	--build-arg PUBLIC_AZURE_TENANT_ID=your-entra-tenant-id `
	--build-arg PUBLIC_DASHBOARD_URL=http://localhost:4321/dashboard/ `
	--build-arg PUBLIC_EHEALTH_PORTAL_URL=http://localhost:8093/ `
	--build-arg PUBLIC_EHEALTH_PORTAL_LOGIN_PATH="/#/login?autologin=1&returnTo=%2Fspa%2Fcountries" `
	--build-arg PUBLIC_OPENNCP_PORTAL_URL=http://localhost:8098/ `
	--build-arg PUBLIC_OPENNCP_PORTAL_LOGIN_PATH=/login?autologin=1 `
	-t scag-dashboard .

docker run --rm -p 4321:80 scag-dashboard
```

Then open `http://localhost:4321/dashboard/`. Docker Compose reads the same values from `.env` and exposes the Nginx container on port `4321`:

```powershell
docker compose up --build
```

Stop the container with `Ctrl+C`, or run `docker compose down` from another terminal.

## Environment variables

- `PUBLIC_AZURE_CLIENT_ID`: Browser-exposed Microsoft Entra application client ID.
- `PUBLIC_AZURE_TENANT_ID`: Browser-exposed tenant ID for the Entra directory.
- `PUBLIC_DASHBOARD_URL`: Browser-exposed dashboard URL, also used as the logout return target.
- `PUBLIC_EHEALTH_PORTAL_URL`: Browser-exposed eHealth Portal base URL.
- `PUBLIC_EHEALTH_PORTAL_LOGIN_PATH`: Browser-exposed eHealth Portal login path, including its auto-login and return parameters.
- `PUBLIC_OPENNCP_PORTAL_URL`: Browser-exposed OpenNCP base URL.
- `PUBLIC_OPENNCP_PORTAL_LOGIN_PATH`: Browser-exposed OpenNCP login path, including its auto-login parameters.

## Role mapping

- `HealthcareProvider` -> eHealth Portal
- `Pharmacist` -> eHealth Portal
- `Admin` -> Administration
- `Reports` -> Reports