import axios from "axios";

const API = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/pipeline`,
});

export const fetchPipeline = async () => {
  const { data } = await API.get("/");
  return data;
};

export const createLead = async (lead) => {
  const { data } = await API.post("/", lead);
  return data;
};

export const editLead = async (id, lead) => {
  const { data } = await API.put(`/${id}`, lead);
  return data;
};

export const removeLead = async (id) => {
  const { data } = await API.delete(`/${id}`);
  return data;
};

export const importPipeline = async (rows) => {
  const { data } = await API.post("/import", rows);
  return data;
};