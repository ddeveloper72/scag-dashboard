# Copilot Instructions — SCAG Dashboard (Shared Care Access Gateway)

These instructions define how GitHub Copilot should generate code, components, and documentation
for this project. The SCAG Dashboard is a role‑aware, Entra‑secured launchpad used by healthcare
providers to access downstream clinical systems (eHealth Portal, OpenNCP Manager, etc.).

Copilot must follow these rules when generating code.

---

## Project Purpose
Build a fast, secure, minimal dashboard that:
- Authenticates users with **Microsoft Entra ID** using **MSAL Browser**
- Reads **app roles** from the ID token
- Renders UI elements conditionally based on roles
- Provides **deep‑link buttons** into downstream apps
- Supports **logout → return to dashboard**
- Uses **Astro** for static rendering
- Uses **Tailwind CSS** for styling
- Contains **no secrets** in the repo

---

## Architecture Rules
Copilot should generate code that:
- Uses **Astro** for pages, components, and routing
- Uses **client‑side MSAL** for authentication
- Stores no secrets, keys, or tenant IDs in source files
- Reads configuration from environment variables (e.g., `.env`)
- Uses **Tailwind CSS** utility classes for layout and styling
- Keeps components small, pure, and composable

---

## Authentication Rules (MSAL + Entra ID)
Copilot must:
- Use `@azure/msal-browser`
- Implement `PublicClientApplication`
- Provide login, logout, and token acquisition helpers
- Read `idTokenClaims.roles`
- Expose a simple `useAuth()` pattern for Astro client scripts
- Never embed clientId or tenantId directly in generated code
- Use placeholders like:  
  `import.meta.env.PUBLIC_AZURE_CLIENT_ID`

---

## UI & Tailwind Rules
Copilot should:
- Use Tailwind utility classes (`flex`, `grid`, `gap`, `rounded`, `shadow`, `text-slate-700`)
- Prefer semantic HTML (`<button>`, `<nav>`, `<section>`)
- Use responsive classes (`md:`, `lg:`)
- Avoid custom CSS unless necessary
- Keep components clean and declarative

---

## Role-Based Rendering Rules
Copilot must generate logic that:
- Reads roles from MSAL ID token
- Supports roles such as:
  - `HealthcareProvider`
  - `Pharmacist`
  - `Admin`
  - `Reports`
- Shows only the buttons relevant to the authenticated user
- Uses simple conditional rendering patterns

Example:
```js
if (roles.includes("HealthcareProvider")) {
  showProviderButton = true;
}
```

## Deep-Linking Rules
Copilot should generate buttons that:

Redirect to downstream apps

Use environment variables for URLs

Never hardcode external URLs

Example:
```js
window.location.href = import.meta.env.PUBLIC_EHEALTH_PORTAL_URL;

```
## Logout Rules
Copilot must implement logout using:
```code
https://login.microsoftonline.com/common/oauth2/v2.0/logout
  ?post_logout_redirect_uri=<dashboard-url>
```
The dashboard URL must come from environment variables.

## Project Structure Rules
Copilot should maintain this structure:

```code
src/
  pages/
    index.astro
    login.astro
    logout.astro
  components/
    Header.astro
    RoleButtons.astro
  scripts/
    msal.js
  styles/
    globals.css
```

## Deep-Linking Rules
Copilot should generate buttons that:

Redirect to downstream apps

Use environment variables for URLs

Never hardcode external URLs

Example:
```js
window.location.href = import.meta.env.PUBLIC_EHEALTH_PORTAL_URL;
```

## Logout Rules
Copilot must implement logout using:
```code
https://login.microsoftonline.com/common/oauth2/v2.0/logout
  ?post_logout_redirect_uri=<dashboard-url>
```
The dashboard URL must come from environment variables.

## Project Structure Rules
Copilot should maintain this structure:
```code
src/
  pages/
    index.astro
    login.astro
    logout.astro
  components/
    Header.astro
    RoleButtons.astro
  scripts/
    msal.js
  styles/
    globals.css
```

Code Quality Rules
Copilot must:

- Use clean, modern JavaScript

- Avoid unnecessary abstraction

- Prefer named functions over anonymous closures

- Use async/await

- Keep files small and readable

- Add comments only where meaningful

- Avoid magic values


## Forbidden
- Copilot must NOT:

- Generate secrets, client IDs, tenant IDs, or keys

- Hardcode URLs

- Add backend frameworks (Flask, Django, Express)

- Add databases

- Add server-side authentication

- Add unused dependencies

- Generate code outside Astro + Tailwind + MSAL

## Summary for Copilot
When generating code for this repo, Copilot should:

- Use Astro + Tailwind

- Use MSAL Browser for Entra ID login

- Implement role-based UI

- Provide deep-link buttons

- Support logout → dashboard

- Keep everything static, clean, and secure

This dashboard is a lightweight, role-aware access gateway — not a backend application.

