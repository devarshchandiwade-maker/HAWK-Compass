import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/profile",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const getProfile = () => API.get("/");

export const updateProfile = (data) => API.put("/", data);