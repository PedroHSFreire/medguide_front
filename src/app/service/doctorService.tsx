import axiosInstance from "./service";
import { getSession } from "next-auth/react";

export interface Doctor {
  id?: string;
  name: string;
  email: string;
  CRM: number;
  specialty: string;
  password: string;
  cpf: string;
  created?: string;
}

export interface LoginCredentials {
  login: string;
  password: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  email: string;
  CRM: number;
  specialty: string;
  cpf: string;
  created: string;
}

export interface RegisterDoctorData {
  name: string;
  email: string;
  CRM: number;
  specialty: string;
  password: string;
  cpf: string;
}

export interface LoginResponse {
  success: boolean;
  data: {
    token: string;
    doctor: DoctorProfile;
  };
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Usa o mesmo interceptor do pacientService
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

export default class DoctorService {
  async loginDoctor(credentials: LoginCredentials) {
    try {
      const response = await axiosInstance.post<LoginResponse>(
        "/api/doctor/login",
        credentials
      );
      return response;
    } catch (error) {
      console.error("Erro no login médico:", error);
      throw error;
    }
  }

  async registerDoctor(doctorData: RegisterDoctorData) {
    try {
      const response = await axiosInstance.post<ApiResponse<DoctorProfile>>(
        "/api/doctor/register",
        doctorData
      );
      return response;
    } catch (error) {
      console.error("Erro no cadastro médico:", error);
      throw error;
    }
  }

  async forgotPassword(email: string) {
    return axiosInstance.post("/api/doctor/forgot-password", { email });
  }

  async resetPassword(token: string, newPassword: string) {
    return axiosInstance.post("/api/doctor/reset-password", {
      token,
      password: newPassword,
    });
  }

  async getProfile() {
    try {
      const response = await axiosInstance.get<ApiResponse<DoctorProfile>>(
        "/api/doctor/profile"
      );
      return response;
    } catch (error) {
      console.error("Erro ao buscar perfil médico:", error);
      throw error;
    }
  }

  async updateProfile(profileData: Omit<Doctor, "id" | "created">) {
    return axiosInstance.put("/api/doctor/profile", profileData);
  }

  async listarDoctorID(id: string) {
    return axiosInstance.get(`/api/doctor/${id}`);
  }

  async findByCRM(crm: number) {
    return axiosInstance.get(`/api/doctor/crm/${crm}`);
  }

  async findByCPF(cpf: string) {
    return axiosInstance.get(`/api/doctor/cpf/${cpf}`);
  }
}
