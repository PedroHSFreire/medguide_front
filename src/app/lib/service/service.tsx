import axios from "axios";
import { getSession } from "next-auth/react";

const axiosInstance = axios.create({
  baseURL:
    process.env.NEXT_PUBLIC_API_URL || "https://medguide-y0j4.onrender.com/",
});

// Interceptor para adicionar token de autenticação
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    } catch (error) {
      console.warn("Não foi possível obter sessão de autenticação");
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
