import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "https://medguide-y0j4.onrender.com/",
});

export default axiosInstance;
