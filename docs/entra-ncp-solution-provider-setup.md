# Microsoft Entra ID integration for the NCP solution provider

## Purpose

This guide defines the identity contract between **NCP Connect** (the SCAG dashboard) and the solution provider's proprietary NCP application derived from the EHDSI/OpenNCP application.

NCP Connect authenticates the user with the HEALTHIRL Microsoft Entra tenant and displays a link when the user's NCP Connect ID token contains `Admin` or `Reports`. It currently opens the single URL configured in `PUBLIC_OPENNCP_PORTAL_URL`.

NCP Connect does **not** send its ID token or access token to that URL. The NCP application must initiate and complete its own standards-based OpenID Connect (OIDC) sign-in and enforce authorization on the server. Because the user already has an Entra browser session, this second sign-in should normally complete without another credential prompt, subject to Conditional Access.

## Required integration pattern

Use:

- Microsoft identity platform v2 endpoints;
- OIDC authorization code flow;
- PKCE;
- server-side token validation;
- a separate Entra app registration for the NCP application;
- HTTPS for every non-local redirect URI;
- server-managed sessions using secure, HTTP-only, SameSite cookies.

Do not:

- accept a token in a query string or fragment from NCP Connect;
- reuse the NCP Connect SPA client ID for the NCP server application;
- treat visibility of a dashboard link as proof of authorization;
- decode a JWT without validating its signature and claims;
- use a client secret in browser-delivered code.

For a traditional Java/Tomcat EHDSI-derived web application, configure the product's supported OIDC relying-party/security module. If the product is a pure browser SPA, register it as an SPA and use authorization code with PKCE; any backend API must then have its own API registration/audience and validate access tokens.

## Values supplied by the HEALTHIRL Entra team

The solution provider requires:

| Setting | Required value |
|---|---|
| Tenant ID | HEALTHIRL directory tenant GUID |
| Client ID | Client ID of the NCP application registration |
| Client credential | Certificate preferred for a confidential web app; secret only if HEALTHIRL policy permits |
| OIDC metadata | `https://login.microsoftonline.com/<tenant-id>/v2.0/.well-known/openid-configuration` |
| Authority/issuer base | `https://login.microsoftonline.com/<tenant-id>/v2.0` |
| Redirect URI | Exact NCP callback URL agreed with the provider |
| Post-logout redirect URI | Exact approved NCP or NCP Connect return URL |
| Role values | Agreed NCP roles and claim mapping |
| Credential owner/expiry | HEALTHIRL owner and rotation date |

Treat a client credential as a secret. Store it in the platform secret store, never in source control, container images, JavaScript, ordinary configuration exports or support tickets.

## Entra app-registration requirements

Agree the following registration with the HEALTHIRL team:

1. **Supported accounts:** single tenant, HEALTHIRL organisational directory only.
2. **Platform:** Web for a server-side NCP application; SPA only for a genuine browser-only client.
3. **Redirect URIs:** exact callback URIs for each environment. Do not use wildcards.
4. **Front-channel/post-logout URL:** an approved HTTPS route that safely establishes an anonymous state.
5. **Credential:** preferably a certificate held by the application runtime. Define ownership and rotation before go-live.
6. **Permissions:** only the OIDC identity scopes and APIs the application actually calls. Basic login requires `openid`; `profile` is normally used for display claims. Request `email` only if needed.
7. **Assignment:** require assignment and use approved HEALTHIRL groups/app roles where policy calls for it.
8. **Optional claims:** add only claims the application has a documented use for. Do not depend on `email` or `preferred_username` as an immutable user key.

If the NCP exposes an API called by a separate browser frontend, also:

1. expose an API scope or app role on the API registration;
2. grant the frontend only that delegated permission;
3. request an access token for the API scope;
4. validate that access token at the API, including its API audience;
5. never use an ID token to authorize API calls.

## Product configuration mapping

The proprietary product may use different property names. Map its OIDC settings to these concepts:

| Product concept | Value or rule |
|---|---|
| Provider/discovery URL | HEALTHIRL v2 OIDC metadata URL |
| Client ID | NCP app-registration client ID |
| Client authentication | `private_key_jwt`/certificate if supported; otherwise approved secret-based method |
| Response type | `code` |
| Scopes | `openid profile` plus only explicitly approved API scopes |
| PKCE | Enabled, using `S256` |
| Redirect/callback URI | Exact registered NCP callback |
| Logout endpoint | Use the `end_session_endpoint` from metadata |
| Post-logout URI | Exact registered HTTPS return URI |
| Username/display claim | Display only: `name` or `preferred_username` |
| Stable local identity | Prefer validated `oid` together with `tid` |
| Role claim | `roles` |
| Group claim | Use only if the agreed design explicitly uses groups |
| Clock skew | Small documented tolerance, normally no more than a few minutes |

Do not hard-code signing keys or a fixed key identifier. Load keys from the discovery document's `jwks_uri`, cache them appropriately and refresh when an unknown signing key is encountered.

## Token-validation requirements

Before creating a local session, the NCP application must validate:

- the JWT signature with a currently trusted Entra signing key;
- `iss` against the tenant-specific issuer obtained from discovery;
- `aud` against the NCP application's client ID for an ID token, or the NCP API's audience for an access token;
- `exp` and `nbf`;
- `nonce` for the OIDC login transaction;
- `state` for request correlation and CSRF protection;
- `tid` equals the approved HEALTHIRL tenant ID;
- the authorization code/PKCE transaction was initiated by the same browser session.

Use a maintained OIDC library for the application framework rather than implementing protocol or JWT validation manually.

Create or locate the local user with an immutable, tenant-qualified key such as `(tid, oid)`. Names and email-style claims can change and must not be the sole database key.

## Role and authorization contract

The dashboard currently recognises these exact NCP Connect app-role values:

| NCP Connect role | Dashboard behaviour |
|---|---|
| `Admin` | Shows the configured NCP entry link labelled Administration |
| `Reports` | Shows the same configured NCP entry link labelled Reports |

These roles belong to the NCP Connect registration and do not automatically appear in a token issued to the separate NCP registration. If the NCP application needs the same role names, HEALTHIRL must define and assign equivalent app roles on the NCP registration, or the NCP must map approved HEALTHIRL groups to local permissions.

The provider must document the final mapping, for example:

| Entra NCP app role | Local NCP authority | Protected routes/actions |
|---|---|---|
| `Admin` | `<provider value>` | `<provider routes/actions>` |
| `Reports` | `<provider value>` | `<provider routes/actions>` |

Enforce this mapping on every protected server route and API operation. Client-side menus are not an authorization control. Use deny-by-default behaviour for missing, unknown or malformed roles.

If Administration and Reports need different deep links, notify the NCP Connect application owner. The current repository has one `PUBLIC_OPENNCP_PORTAL_URL` for both cards.

## Sign-in and launch sequence

1. The user signs in to NCP Connect with the NCP Connect app registration.
2. NCP Connect reads its own ID-token `roles` claim and displays an NCP link.
3. The browser opens the configured NCP URL. No token is transferred by NCP Connect.
4. The NCP application checks for its own valid local session.
5. If absent, the NCP application starts its own OIDC authorization request against the HEALTHIRL tenant.
6. Entra uses the existing browser session where policy permits and returns an authorization code to the registered NCP callback.
7. The NCP application redeems the code, validates the tokens, creates a secure local session and checks NCP-specific authorization.
8. The requested NCP page is displayed or access is denied.

Preserve an internal relative destination through the login transaction if deep linking is required. Validate it against an allow-list or require it to be a local path to prevent open redirects.

## Logout behaviour

Define and test the required logout scope:

- **Local logout:** destroy the NCP server session and cookies.
- **Entra logout:** optionally redirect to the metadata `end_session_endpoint` with the approved post-logout return.
- **NCP Connect logout:** NCP Connect independently clears its MSAL cache and invokes tenant logout.

A logout from one application does not automatically guarantee that every application session has been destroyed. The provider and HEALTHIRL team must agree whether NCP logout is local-only or also ends the Entra SSO session, then make the user-facing wording match that behaviour.

## Security and operational requirements

- Use TLS and secure headers throughout, including at reverse proxies.
- Protect callback and logout routes from open redirects.
- Regenerate the local session identifier after login.
- Set cookies `Secure`, `HttpOnly` and an appropriate `SameSite` value.
- Do not log authorization codes, tokens, client credentials or full claims.
- Log authentication outcome, tenant, application, immutable user reference and authorization decision in accordance with HEALTHIRL audit policy.
- Handle key rotation and transient discovery failures without disabling validation.
- Define certificate/secret expiry monitoring and rotation.
- Keep development, test and production registrations and credentials separated.
- Perform dependency and penetration testing under the project's security process.

## Provider acceptance evidence

Return the following evidence to the project team:

1. Completed configuration mapping, with secrets redacted.
2. Redirect and post-logout URLs for every environment.
3. Role-to-local-authority mapping and protected-route list.
4. Evidence of successful sign-in from the HEALTHIRL tenant.
5. Evidence that a user from another tenant is rejected.
6. Tests showing invalid issuer, audience, signature, nonce/state, expired token and missing role are rejected.
7. Tests showing `Admin`, `Reports`, multi-role and no-role users receive the intended result.
8. Proof that protected server endpoints reject an unauthenticated direct request.
9. Logout test results for both local and Entra logout.
10. Credential owner, storage location, expiry alert and rotation procedure.
11. Redacted logs demonstrating useful audit events without token or credential leakage.

## Configuration worksheet

| Field | Value |
|---|---|
| NCP application name/version | |
| Entra tenant ID | |
| NCP client ID | |
| NCP enterprise application object ID | |
| Discovery URL | |
| Callback URI(s) | |
| Post-logout URI(s) | |
| Credential type and expiry | |
| Runtime secret-store reference | |
| Role mapping | |
| Local user key | |
| Session timeout | |
| Provider implementation owner | |
| HEALTHIRL approval owner | |
| Acceptance-test date | |

## Completion boundary

The NCP Connect repository is ready to launch a configured NCP URL based on its own Entra roles. The proprietary NCP integration cannot be declared complete from this repository because its source/configuration, Entra app registration and runtime test evidence are outside the project. Completion requires the provider acceptance evidence above.
