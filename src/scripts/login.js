import { useAuth } from "./msal.js";

const loginMessage = document.querySelector("#login-message");
const loginButton = document.querySelector("#login-button");
const auth = useAuth();
let isSigningIn = false;

function setMessage(message) {
    if (loginMessage) {
        loginMessage.textContent = message;
    }
}

function setButtonState(disabled) {
    if (loginButton) {
        loginButton.disabled = disabled;
    }
}

async function bootstrapLoginPage() {
    try {
        const account = await auth.initialize();

        if (account) {
            window.location.href = "/";
            return;
        }

        await beginLogin();
    } catch (error) {
        console.error(error);
        setMessage(error instanceof Error ? error.message : "Unable to initialize sign-in.");
    }
}

async function beginLogin() {
    if (isSigningIn) {
        return;
    }

    isSigningIn = true;
    setButtonState(true);
    setMessage("Opening Microsoft sign-in. If another browser profile opens, complete sign-in there and return to this page.");

    try {
        await auth.login();
    } catch (error) {
        console.error(error);
        const fallback = "Unable to start sign-in.";
        setMessage(error instanceof Error ? error.message : fallback);
        setButtonState(false);
        isSigningIn = false;
    }
}

if (loginButton) {
    loginButton.addEventListener("click", beginLogin);
}

bootstrapLoginPage();