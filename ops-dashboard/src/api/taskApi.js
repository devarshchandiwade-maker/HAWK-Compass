import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL + "/api/tasks"
});

// Automatically attach JWT token to every request
API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }

        return config;
    },
    (error) => Promise.reject(error)
);

export const getTasks = () => API.get("/");

export const addTask = (task) => API.post("/", task);

export const updateTask = (id, task) => API.put(`/${id}`, task);

export const deleteTask = (id) => API.delete(`/${id}`);