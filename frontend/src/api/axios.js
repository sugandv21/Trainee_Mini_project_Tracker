import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "";

const api = axios.create({
  baseURL,
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

    if (err.response.status === 401 && !originalReq._retry) {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) return Promise.reject(err);

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          refreshQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalReq.headers.Authorization = "Bearer " + token;
            return axios(originalReq);
          })
          .catch((e) => Promise.reject(e));
      }

      originalReq._retry = true;
      isRefreshing = true;
      try {
        const resp = await axios.post(`${baseURL}/token/refresh/`, { refresh: refreshToken });
        const newAccess = resp.data.access;
        localStorage.setItem("access_token", newAccess);
        processQueue(null, newAccess);
        originalReq.headers.Authorization = "Bearer " + newAccess;
        return axios(originalReq);
      } catch (e) {
        processQueue(e, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
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
