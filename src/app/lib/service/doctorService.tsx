// services/doctorSearchService.ts
import axiosInstance from "./service";
import { AxiosErrorResponse } from "../types/api";

export interface DoctorSearchFilters {
  specialty?: string;
  name?: string;
  CRM?: string;
  city?: string;
}

export interface DoctorSearchResult {
  id: string;
  name: string;
  CRM: string;
  specialty: string;
  email: string;
  phone?: string;
  address?: string;
  experience?: string;
  education?: string;
  bio?: string;
  rating?: number;
  consultationPrice?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default class DoctorSearchService {
  async searchDoctors(
    filters: DoctorSearchFilters = {}
  ): Promise<DoctorSearchResult[]> {
    try {
      const response = await axiosInstance.get<
        ApiResponse<DoctorSearchResult[]>
      >("/api/doctors/search", { params: filters });
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar médicos:", axiosError);
      throw new Error(
        axiosError.response?.data?.error || "Erro ao buscar médicos"
      );
    }
  }

  async getAllSpecialties(): Promise<string[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<string[]>>(
        "/api/doctors/specialties"
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar especialidades:", axiosError);
      throw new Error(
        axiosError.response?.data?.error || "Erro ao buscar especialidades"
      );
    }
  }

  async getDoctorById(id: string): Promise<DoctorSearchResult> {
    try {
      const response = await axiosInstance.get<ApiResponse<DoctorSearchResult>>(
        `/api/doctors/${id}`
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar médico:", axiosError);
      throw new Error(
        axiosError.response?.data?.error || "Erro ao buscar médico"
      );
    }
  }

  async getDoctorByCRM(crm: string): Promise<DoctorSearchResult> {
    try {
      const response = await axiosInstance.get<ApiResponse<DoctorSearchResult>>(
        `/api/doctors/crm/${crm}`
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar médico por CRM:", axiosError);
      throw new Error(
        axiosError.response?.data?.error || "Erro ao buscar médico por CRM"
      );
    }
  }
}
