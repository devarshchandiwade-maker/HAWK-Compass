import axios from "axios";

const API = axios.create({
      baseURL: import.meta.env.VITE_API_URL + "/api/pipeline"
});


export const fetchPipeline = async () => {
  const res = await fetch(API);
  return await res.json();
};

export const createLead = async (lead) => {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
  });

  return await res.json();
};

export const editLead = async (id, lead) => {
  const res = await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(lead),
  });

  return await res.json();
};

export const removeLead = async (id) => {
  const res = await fetch(`${API}/${id}`, {
    method: "DELETE",
  });

  return await res.json();
};

// NEW
export const importPipeline = async (rows) => {
  const res = await fetch(`${API}/import`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rows),
  });

  return await res.json();
};