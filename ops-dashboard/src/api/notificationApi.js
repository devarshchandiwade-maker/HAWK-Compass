import axios from "axios";

const API=axios.create({

    baseURL:"http://localhost:5000/api/notifications"

});

API.interceptors.request.use(config=>{

    const token=localStorage.getItem("token");

    if(token){

        config.headers.Authorization=`Bearer ${token}`;

    }

    return config;

});

export const getNotifications=()=>API.get("/");

export const updateNotifications=data=>API.put("/",data);