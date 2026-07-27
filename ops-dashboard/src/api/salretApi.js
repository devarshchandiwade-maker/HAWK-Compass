// Thin wrapper around the Sal-to-Ret backend. Swap API_BASE for your deployed
// API origin (or wire up a Vite/webpack proxy so this can stay a relative path).
const API_BASE = `${import.meta.env.VITE_API_URL}`

async function request(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: opts.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const getMonths = () => request("/api/months");
export const getMonthDetail = (monthKey) => request(`/api/months/${encodeURIComponent(monthKey)}`);
export const deleteMonth = (monthKey) => request(`/api/months/${encodeURIComponent(monthKey)}`, { method: "DELETE" });

export const importMonth = (file) => {
  const form = new FormData();
  form.append("file", file);
  return request("/api/months/import", { method: "POST", body: form });
};

export const setBrandRetainer = (monthKey, brand, value) =>
  request(`/api/months/${encodeURIComponent(monthKey)}/brands/${encodeURIComponent(brand)}/retainer`, {
    method: "PATCH",
    body: JSON.stringify({ value }),
  });

export const getPinStatus = () => request("/api/settings/pin");
export const setPin = (pin) => request("/api/settings/pin", { method: "POST", body: JSON.stringify({ pin }) });
export const verifyPin = (pin) => request("/api/settings/pin/verify", { method: "POST", body: JSON.stringify({ pin }) });