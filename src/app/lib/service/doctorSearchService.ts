// services/doctorSearchService.ts
import axiosInstance from "./service";

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
      >("/doctor/search", { params: filters });
      return response.data.data;
    } catch {
      console.warn("Busca de médicos não disponível na API - usando fallback");
      return []; // Return empty array instead of throwing error
    }
  }

  async getAllSpecialties(): Promise<string[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<string[]>>(
        "/doctor/specialties"
      );
      return response.data.data;
    } catch {
      console.warn(
        "Busca de especialidades não disponível na API - usando fallback"
      );
      return []; // Return empty array instead of throwing error
    }
  }

  async getDoctorById(id: string): Promise<DoctorSearchResult | undefined> {
    try {
      const response = await axiosInstance.get<ApiResponse<DoctorSearchResult>>(
        `/api/doctors/${id}`
      );
      return response.data.data;
    } catch {
      console.warn("Busca de médico não disponível na API - usando fallback");
      return undefined; // Return undefined instead of throwing error
    }
  }

  async getDoctorByCRM(crm: string): Promise<DoctorSearchResult | undefined> {
    try {
      const response = await axiosInstance.get<ApiResponse<DoctorSearchResult>>(
        `/api/doctors/crm/${crm}`
      );
      return response.data.data;
    } catch {
      console.warn(
        "Busca de médico por CRM não disponível na API - usando fallback"
      );
      return undefined; // Return undefined instead of throwing error
    }
  }
}
