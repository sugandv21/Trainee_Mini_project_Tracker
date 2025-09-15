import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, ""); 

const api = axios.create({
  baseURL: API_BASE || undefined, // if empty string, leave undefined so relative URLs work in dev
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token);
  });
  refreshQueue = [];
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalReq = err.config;

    if (err.code === "ECONNABORTED" || !err.response) {
      return Promise.reject({ network: true, message: "Network error" });
    }

    // Only handle 401 once per request
    if (err.response.status === 401 && !originalReq._retry) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return Promise.reject(err);

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalReq.headers = originalReq.headers || {};
            originalReq.headers.Authorization = "Bearer " + token;
            return axios(originalReq);
          })
          .catch((e) => Promise.reject(e));
      }

      originalReq._retry = true;
      isRefreshing = true;
      try {
        // Use absolute backend path to ensure we hit the correct host in production
        const refreshUrl = `${API_BASE || ""}/api/token/refresh/`;
        const resp = await axios.post(refreshUrl, { refresh: refreshToken }, {
          headers: { "Content-Type": "application/json" },
          timeout: 15000,
        });

        const newAccess = resp.data.access;
        localStorage.setItem("access_token", newAccess);
        processQueue(null, newAccess);

        originalReq.headers = originalReq.headers || {};
        originalReq.headers.Authorization = "Bearer " + newAccess;

        // Use axios(originalReq) so if originalReq.url was absolute it works; otherwise it will be resolved relative to current page
        return axios(originalReq);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // send user to login page
        window.location.href = "/login";
        return Promise.reject(e);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

export default api;
