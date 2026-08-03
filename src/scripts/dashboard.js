import { useAuth } from "./msal.js";

const auth = useAuth();
const authStatus = document.querySelector("#auth-status");
const userName = document.querySelector("#user-name");
const loginLink = document.querySelector("#login-link");
const logoutLink = document.querySelector("#logout-link");
const roleCount = document.querySelector("#role-count");
const launchSummary = document.querySelector("#launch-summary");
const cards = Array.from(document.querySelectorAll("[data-launch-card]"));

function setAnonymousState(message) {
    document.body.removeAttribute("data-primary-role");
    authStatus.textContent = message;
    userName.textContent = "Not signed in";
    loginLink.classList.remove("hidden");
    logoutLink.classList.add("hidden");
    roleCount.textContent = "0 roles detected";
    launchSummary.textContent = "Sign in to resolve your Entra app roles and unlock the systems assigned to your account.";

    for (const card of cards) {
        card.classList.add("hidden");
    }
}

function setAuthenticatedState(profile) {
    const rolePriority = ["Admin", "HealthcareProvider", "Pharmacist", "Reports"];
    const primaryRole = rolePriority.find((role) => profile.roles.includes(role));

    if (primaryRole) {
        document.body.dataset.primaryRole = primaryRole;
    }

    const visibleCards = [];

    authStatus.textContent = "Authenticated with Microsoft Entra ID";
    userName.textContent = profile.displayName;
    loginLink.classList.add("hidden");
    logoutLink.classList.remove("hidden");

    for (const card of cards) {
        const requiredRole = card.dataset.role ?? "";
        const launchUrl = card.dataset.url ?? "";
        const hasRole = profile.roles.includes(requiredRole);
        const hasUrl = Boolean(launchUrl);
        const link = card.querySelector("a");

        card.classList.toggle("hidden", !hasRole || !hasUrl);

        if (link) {
            if (!hasRole || !hasUrl) {
                link.setAttribute("aria-disabled", "true");
                link.setAttribute("tabindex", "-1");
                link.removeAttribute("href");
            } else {
                link.removeAttribute("aria-disabled");
                link.removeAttribute("tabindex");
                link.setAttribute("href", launchUrl);
            }
        }

        if (hasRole && hasUrl) {
            visibleCards.push(card);
        }
    }

    roleCount.textContent = `${profile.roles.length} role${profile.roles.length === 1 ? "" : "s"} detected`;

    if (visibleCards.length > 0) {
        launchSummary.textContent = "Your launchpad has been filtered to the systems enabled by your current app roles.";
        return;
    }

    launchSummary.textContent = "Your account is signed in, but no launch targets are currently mapped to the detected roles or destination URLs are missing.";
}

async function syncDashboard() {
    try {
        const account = await auth.initialize();

        if (!account) {
            setAnonymousState("No active session detected");
            return;
        }

        setAuthenticatedState(auth.getUserProfile(account));
    } catch (error) {
        console.error(error);
        setAnonymousState("Authentication configuration is incomplete");
        launchSummary.textContent = error instanceof Error ? error.message : "An unknown authentication error occurred.";
    }
}

syncDashboard();