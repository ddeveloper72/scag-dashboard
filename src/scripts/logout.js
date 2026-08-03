import { useAuth } from "./msal.js";

const logoutMessage = document.querySelector("#logout-message");
const logoutButton = document.querySelector("#logout-button");
const auth = useAuth();

async function beginLogout() {
    try {
        await auth.logout();
    } catch (error) {
        console.error(error);
        logoutMessage.textContent = error instanceof Error ? error.message : "Unable to start sign-out.";
    }
}

if (logoutButton) {
    logoutButton.addEventListener("click", beginLogout);
}

beginLogout();