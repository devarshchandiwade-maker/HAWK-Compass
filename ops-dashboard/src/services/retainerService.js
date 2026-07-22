// const API = "http://localhost:5000/api/retainers";

// export const fetchRetainers = async () => {
//   const res = await fetch(API);
//   return await res.json();
// };

// export const createRetainer = async (retainer) => {
//   const res = await fetch(API, {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(retainer),
//   });

//   return await res.json();
// };

// export const editRetainer = async (id, retainer) => {
//   const res = await fetch(`${API}/${id}`, {
//     method: "PUT",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(retainer),
//   });

//   return await res.json();
// };

// export const removeRetainer = async (id) => {
//   const res = await fetch(`${API}/${id}`, {
//     method: "DELETE",
//   });

//   return await res.json();
// };

// export const clearRetainers = async () => {
//   const res = await fetch(`${API}/all`, {
//     method: "DELETE",
//   });

//   return await res.json();
// };