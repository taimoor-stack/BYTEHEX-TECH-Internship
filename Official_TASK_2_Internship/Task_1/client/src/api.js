import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});

// Automatically attach JWT Token to requests if logged in
API.interceptors.request.use(
  (config) => {
    // 1. Try standalone token
    let token = localStorage.getItem("token");

    // 2. Fallback: Check inside saved user object
    if (!token) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          token = parsed.token || parsed.jwt || parsed.accessToken;
        } catch (err) {
          console.error("Error parsing user token:", err);
        }
      }
    }

    // 3. Attach token header if present
    if (token && token !== "undefined") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

export default API;
