import axios from "axios";

const API = "http://localhost:5000/api/owners";

export const fetchOwners = async () => {
  const res = await axios.get(API);
  return res.data;
};

export const createOwner = async (owner) => {
  const res = await axios.post(API, owner);
  return res.data;
};

export const removeOwner = async (id) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data;
};