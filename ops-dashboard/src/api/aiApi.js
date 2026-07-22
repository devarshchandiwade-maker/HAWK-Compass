import axios from "axios";

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL + "/api/ai"
});

export const extractTasksFromImage = async (file) => {

    const formData = new FormData();

    formData.append("image", file);

    const { data } = await API.post("/extract", formData);

    console.log("AI API Response:", data);

    return data.result;
};