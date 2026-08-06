# Microsoft Entra ID setup for the HEALTHIRL directory team

## Purpose and ownership

This guide describes the Microsoft Entra ID configuration required by **NCP Connect**, the static SCAG dashboard in this repository. It is intended for the team that manages the HEALTHIRL Active Directory domain and Microsoft Entra tenant.

The HEALTHIRL team owns the tenant-side app registration, role assignments, Conditional Access and lifecycle controls. The application deployment team owns the NCP Connect URL and its build-time environment variables.

NCP Connect is a browser-based public client. It uses MSAL Browser to sign a user in, reads Entra app roles from the ID token and displays the destinations associated with those roles. It has no client secret.

> NCP Connect role filtering is navigation convenience, not authorization for a clinical or administrative system. Each destination, including the NCP application, must authenticate the user and enforce its own authorization.

## Information required before setup

Obtain these values from the deployment and application owners:

| Item | Example or requirement |
|---|---|
| Production NCP Connect URL | `https://<ncp-connect-host>/dashboard/` |
| Non-production URLs | One exact HTTPS URL per deployed environment |
| Local development URL | `http://localhost:4321/dashboard/` |
| Tenant type | HEALTHIRL organisational directory only |
| Assignment groups | The HEALTHIRL groups approved for each app role |
| Operational owners | At least two named application owners |

URLs are exact and case-sensitive for practical configuration purposes. Preserve the `/dashboard/` path and trailing slash used by the deployed application.

## 1. Create the NCP Connect app registration

In **Microsoft Entra admin center > Identity > Applications > App registrations**:

1. Create an app registration named according to the HEALTHIRL naming standard, for example `NCP Connect - Production`.
2. Select **Accounts in this organizational directory only**.
3. Record:
   - Directory (tenant) ID
   - Application (client) ID
   - Object ID
4. Assign at least two HEALTHIRL-controlled owners.
5. Do not create a client secret or certificate. This application executes in a browser and cannot protect one.

Use a separate app registration for production where HEALTHIRL policy requires environment isolation. Do not put development or test users into the production enterprise application.

## 2. Configure the SPA platform

Under **Authentication**:

1. Add the **Single-page application** platform.
2. Add each exact redirect URI:
   - `https://<ncp-connect-host>/dashboard/`
   - the equivalent URL for each approved non-production environment
   - `http://localhost:4321/dashboard/` only on the development registration
3. Ensure ID tokens are available to the SPA. MSAL requests the OpenID Connect `openid` and `profile` scopes.
4. Do not enable the implicit grant access-token option. MSAL Browser uses the authorization code flow with PKCE.
5. Leave **Allow public client flows** disabled unless another documented client requires it; the SPA platform supplies the correct browser-client behaviour.
6. Add the production dashboard URL as the permitted post-logout return URI where the portal exposes that setting. NCP Connect sends the user to the tenant-specific v2 logout endpoint and returns to the same dashboard URL.

Do not configure wildcard redirect URIs.

## 3. Define app roles

Under **App roles**, create the following user/group roles. The **Value** must match the table exactly because NCP Connect compares it case-sensitively with the `roles` claim.

| Display name | Value | Allowed member types | NCP Connect destination |
|---|---|---|---|
| Healthcare Provider | `HealthcareProvider` | Users/Groups | eHealth Portal |
| Pharmacist | `Pharmacist` | Users/Groups | eHealth Portal |
| Administrator | `Admin` | Users/Groups | NCP Administration |
| Reports User | `Reports` | Users/Groups | NCP Reports |

Use role descriptions that identify the approving business owner and access purpose. Do not rename a role value after go-live without coordinating a code and assignment migration.

## 4. Control assignment through the enterprise application

In **Enterprise applications**, open the service principal created for NCP Connect:

1. Set **Assignment required?** to **Yes** unless HEALTHIRL has approved tenant-wide sign-in.
2. Assign approved security groups to the app roles; prefer groups over direct user assignments.
3. Ensure only appropriate privileged groups receive `Admin`.
4. Confirm group nesting behaviour against HEALTHIRL policy. Use direct membership if nested group claims or provisioning are not assured.
5. Keep role approval, access reviews and leaver/mover processes in the HEALTHIRL identity-governance process.

An assigned role is emitted in the ID token as a value in the `roles` array. A user may legitimately receive more than one role.

## 5. Apply tenant security controls

Apply HEALTHIRL policy for:

- multi-factor authentication;
- compliant or managed devices where appropriate;
- approved locations and sign-in risk;
- session lifetime and reauthentication;
- blocking legacy authentication;
- privileged access reviews and, where available, just-in-time activation for administration.

Test Conditional Access with report-only mode or an excluded emergency account before enforcement. NCP Connect does not override tenant Conditional Access.

No additional Microsoft Graph or custom API permissions are required by the current dashboard. Do not grant broad delegated permissions merely to obtain basic identity claims.

## 6. Supply deployment values

Provide the deployment team with these non-secret values through the approved secure handover channel:

```dotenv
PUBLIC_AZURE_CLIENT_ID=<application-client-id>
PUBLIC_AZURE_TENANT_ID=<healthirl-tenant-id>
PUBLIC_DASHBOARD_URL=https://<ncp-connect-host>/dashboard/
```

The deployment team separately supplies:

```dotenv
PUBLIC_EHEALTH_PORTAL_URL=https://<approved-ehealth-destination>
PUBLIC_OPENNCP_PORTAL_URL=https://<approved-ncp-entry-point>
```

All `PUBLIC_` values are compiled into browser assets and are visible to users. They must not contain secrets, credentials, signed links or private tokens. A build is required after changing them.

## 7. Acceptance test

Complete this test in each environment:

1. Browse to the dashboard and select **Sign in**.
2. Confirm the sign-in request uses the HEALTHIRL tenant and the expected application/client ID.
3. Sign in as a user with no assignment and confirm access is rejected when assignment is required.
4. Test one user or group for each role and confirm the ID token contains the exact role value.
5. Confirm only the expected launch cards are displayed.
6. Test a multi-role user.
7. Select **Sign out**, confirm the Entra session is ended as intended, and confirm return to the exact dashboard URL.
8. Confirm Conditional Access and audit/sign-in logs show the expected application.
9. Confirm each downstream destination performs its own authentication and authorization.

Use a browser token-inspection tool only in an approved test environment. Do not copy production tokens into tickets or email.

## Handover record

Record the following in the project configuration register:

| Field | Value |
|---|---|
| Tenant ID | |
| App registration name | |
| Application (client) ID | |
| Enterprise application object ID | |
| Production redirect/logout return URI | |
| App owners | |
| Assignment groups per role | |
| Conditional Access policies | |
| Date acceptance test passed | |
| Approved by | |

## Current repository validation

As of 6 August 2026, the repository contains the required tenant ID/client ID configuration points, tenant-specific authority, MSAL redirect handling, ID-token role parsing, session-scoped cache and tenant logout flow. The local values are syntactically valid and the production build succeeds.

Repository inspection cannot prove that the HEALTHIRL tenant objects, production URLs, group assignments or Conditional Access policies exist. Entra setup is operationally complete only when the acceptance test and handover record above have been completed by the HEALTHIRL team.
