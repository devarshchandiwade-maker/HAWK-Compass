import axios from "axios";

const API = axios.create({
      baseURL: `${import.meta.env.VITE_API_URL}/api/auth`
});

// Automatically attach admin token
API.interceptors.request.use((config) => {
    const token = localStorage.getItem("adminToken");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const adminLogin = (data) => API.post("/login", data);

export const getUsers = () => API.get("/users");

export const addUser = (data) => API.post("/users", data);

export const getUser = (id) => API.get(`/users/${id}`);

export const updatePermissions = (id, data) =>
    API.put(`/users/${id}/permissions`, data);