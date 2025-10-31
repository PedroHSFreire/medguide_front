import axiosInstance from "./service";
import { getSession } from "next-auth/react";
export interface Pacient {
  id?: string;
  name: string;
  email: string;
  password: string;
  cpf: string;
  created?: string;
}
export interface LoginCredentials {
  login: string;
  password: string;
}

export interface PacientProfile {
  id: string;
  name: string;
  email: string;
  cpf: string;
  created: string;
}
export interface RegisterPacientData {
  name: string;
  email: string;
  password: string;
  cpf: string;
}
export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    pacient: PacientProfile;
  };
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}
axiosInstance.interceptors.request.use(
  async (config) => {
    if (typeof window !== "undefined") {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers.Authorization = `Bearer ${session.accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("Sessão expirada");
      }
    }
    return Promise.reject(error);
  }
);
export default class PacientService {
  async loginPacient(credentials: LoginCredentials) {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        "/api/pacient/login",
        credentials
      );
      return response;
    } catch (error) {
      console.error("Erro no login:", error);
      throw error;
    }
  }
  async registerPacient(pacientData: RegisterPacientData) {
    try {
      const response = await axiosInstance.post<ApiResponse<PacientProfile>>(
        "/api/pacient/register",
        pacientData
      );
      return response;
    } catch (error) {
      console.error("Erro no cadastro:", error);
      throw error;
    }
  }

  forgotPassword(email: string) {
    return axiosInstance.post("/api/pacient/forgot-password", { email });
  }

  resetPassword(token: string, newPassword: string) {
    return axiosInstance.post("/api/pacient/reset-password", {
      token,
      password: newPassword,
    });
  }

  async getProfile() {
    try {
      const response = await axiosInstance.get<ApiResponse<PacientProfile>>(
        "/api/pacient/profile"
      );
      return response;
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      throw error;
    }
  }

  updateProfile(profileData: Omit<Pacient, "id" | "created">) {
    return axiosInstance.put("/api/pacient/profile", profileData);
  }

  listarPacientID(id: string) {
    return axiosInstance.get(`/api/pacient/${id}`);
  }

  findByCPF(cpf: string) {
    return axiosInstance.get(`/api/pacient/cpf/${cpf}`);
  }
}
