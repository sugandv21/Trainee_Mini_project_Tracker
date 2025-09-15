
import axios from "axios";

// Prefer env var (set VITE_API_BASE_URL in Vercel). Fallback to the deployed backend for quick testing.
const BACKEND =
  (import.meta.env.VITE_API_BASE_URL || "https://trainee-mini-project-tracker-8btp.onrender.com/api")
    .replace(/\/+$/, "");

export async function login(emailOrUsername, password) {
  try {
    const resp = await axios.post(
      `${BACKEND}/api/token/`,
      { username: emailOrUsername, password },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );

    // store tokens
    localStorage.setItem("access_token", resp.data.access);
    localStorage.setItem("refresh_token", resp.data.refresh);

    return resp.data;
  } catch (err) {
    // helpful debug output (remove or comment out in prod)
    // console.error("login error", err);

    if (err.response) {
      // server returned response (400/401/404/500)
      // normalize to a predictable shape for the caller
      return Promise.reject({
        status: err.response.status,
        data: err.response.data,
      });
    }

    // network or timeout
    return Promise.reject({
      message: err.message || "Network error",
      network: true,
    });
  }
}

export async function refreshAccess() {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) throw new Error("no refresh token saved");

  try {
    const resp = await axios.post(
      `${BACKEND}/api/token/refresh/`,
      { refresh: refreshToken },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 15000,
      }
    );
    localStorage.setItem("access_token", resp.data.access);
    return resp.data.access;
  } catch (err) {
    // if refresh fails, remove tokens and bubble up
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    if (err.response) {
      return Promise.reject({
        status: err.response.status,
        data: err.response.data,
      });
    }
    return Promise.reject({ message: err.message || "Network error", network: true });
  }
}

