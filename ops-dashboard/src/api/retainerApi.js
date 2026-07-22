import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api/retainers",
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const fetchRetainers = async () => {
  const res = await API.get("/");
  return res.data;
};

export const createRetainer = async (retainer) => {
  const res = await API.post("/", retainer);
  return res.data;
};

export const editRetainer = async (id, retainer) => {
  const res = await API.put(`/${id}`, retainer);
  return res.data;
};

export const removeRetainer = async (id) => {
  const res = await API.delete(`/${id}`);
  return res.data;
};

export const clearRetainers = async () => {
  const res = await API.delete("/all");
  return res.data;
};