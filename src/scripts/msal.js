import { PublicClientApplication } from "@azure/msal-browser";

const clientId = import.meta.env.PUBLIC_AZURE_CLIENT_ID ?? "";
const tenantId = import.meta.env.PUBLIC_AZURE_TENANT_ID ?? "common";
const dashboardUrl = import.meta.env.PUBLIC_DASHBOARD_URL ?? "/";

const msalConfig = {
    auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        redirectUri: dashboardUrl,
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
};

const loginRequest = {
    scopes: ["openid", "profile"],
    // Force account picker to reduce sticky SSO behavior across browser profiles.
    prompt: "select_account",
};

let msalInstance;
let initializationPromise;

function ensureConfigured() {
    if (!clientId) {
        throw new Error("Missing PUBLIC_AZURE_CLIENT_ID. Copy .env.example to .env and set your Entra app values.");
    }
}

function getMsalInstance() {
    ensureConfigured();

    if (!msalInstance) {
        msalInstance = new PublicClientApplication(msalConfig);
    }

    return msalInstance;
}

function normalizeRoles(rolesClaim) {
    if (Array.isArray(rolesClaim)) {
        return rolesClaim.filter((role) => typeof role === "string");
    }

    if (typeof rolesClaim === "string" && rolesClaim.trim()) {
        return [rolesClaim];
    }

    return [];
}

function getActiveAccount() {
    const instance = getMsalInstance();
    return instance.getActiveAccount() ?? instance.getAllAccounts()[0] ?? null;
}

async function initialize() {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            const instance = getMsalInstance();

            await instance.initialize();

            const redirectResult = await instance.handleRedirectPromise();
            if (redirectResult?.account) {
                instance.setActiveAccount(redirectResult.account);
            }

            const account = getActiveAccount();
            if (account) {
                instance.setActiveAccount(account);
            }

            return account;
        })();
    }

    return initializationPromise;
}

async function login() {
    const instance = getMsalInstance();
    await initialize();
    await instance.loginRedirect(loginRequest);
}

async function logout() {
    const instance = getMsalInstance();
    await initialize();
    const account = getActiveAccount();

    if (account) {
        await instance.clearCache({ account });
    }

    instance.setActiveAccount(null);

    if (typeof globalThis !== "undefined" && globalThis.location) {
        const logoutParams = new URLSearchParams({
            client_id: clientId,
            post_logout_redirect_uri: dashboardUrl,
        });

        if (account?.username) {
            logoutParams.set("logout_hint", account.username);
        }

        const logoutUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?${logoutParams.toString()}`;
        globalThis.location.replace(logoutUrl);
    }
}

function getUserProfile(account = getActiveAccount()) {
    return {
        displayName: account?.name ?? account?.username ?? "Signed in user",
        roles: normalizeRoles(account?.idTokenClaims?.roles),
    };
}

async function acquireToken(scopes = []) {
    const instance = getMsalInstance();
    await initialize();
    const account = getActiveAccount();

    if (!account) {
        throw new Error("No active account. Sign in before acquiring an access token.");
    }

    return instance.acquireTokenSilent({
        scopes,
        account,
    });
}

export function useAuth() {
    return {
        acquireToken,
        getActiveAccount,
        getUserProfile,
        initialize,
        login,
        logout,
    };
}