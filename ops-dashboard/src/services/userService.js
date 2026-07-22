import axios from "axios";

const API = axios.create({
      baseURL: import.meta.env.VITE_API_URL + "/api/users"
});


API.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if(token){
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export const fetchUsers = async () => {
    const res = await API.get("/");
    return res.data;
};