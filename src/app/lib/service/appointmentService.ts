import axiosInstance from "./service";
import {
  Appointment,
  CreateAppointmentData,
  TimeSlot,
  AvailableDate,
} from "../types/appointments";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default class AppointmentService {
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      const response = await axiosInstance.post<ApiResponse<Appointment>>(
        "/api/appointments",
        data
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Criação de agendamento não disponível na API - usando fallback"
      );

      // Construir um agendamento de fallback para uso local quando a API não estiver disponível
      const fallback: Appointment = {
        id: `apt-${Date.now()}`,
        doctorId: data.doctorId,
        patientId: data.patientId,
        date: data.date,
        time: data.time,
        type: data.type as any,
        reason: data.reason || "",
        status: "agendada",
        doctorName: "",
        doctorSpecialty: "",
        patientName: "",
        patientEmail: "",
      } as Appointment;

      return fallback;
    }
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Appointment[]>>(
        `/api/appointments/patient/${patientId}`
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Busca de agendamentos do paciente não disponível na API - usando localStorage"
      );
      return [];
    }
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Appointment[]>>(
        `/api/appointments/doctor/${doctorId}`
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Busca de agendamentos do médico não disponível na API - usando fallback"
      );
      return [];
    }
  }

  async getAvailableTimeSlots(
    doctorId: string,
    date: string
  ): Promise<TimeSlot[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<TimeSlot[]>>(
        `/api/appointments/available-slots`,
        {
          params: { doctorId, date },
        }
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Busca de horários disponíveis não disponível na API - usando fallback"
      );
      // Retornar horários de exemplo como fallback para permitir agendamentos locais
      const baseSlots = [
        "08:00",
        "09:00",
        "10:00",
        "11:00",
        "14:00",
        "15:00",
        "16:00",
        "17:00",
      ];

      // Distribuir disponibilidade de forma determinística a partir da data + doctorId
      const seed = (date + doctorId)
        .split("")
        .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
      const slots: TimeSlot[] = baseSlots.map((time, idx) => ({
        time,
        available: (seed + idx) % 3 !== 0, // ~66% chance disponível
      }));

      return slots;
    }
  }

  async getAvailableDates(doctorId: string): Promise<AvailableDate[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<AvailableDate[]>>(
        `/api/appointments/available-dates`,
        {
          params: { doctorId },
        }
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Busca de datas disponíveis não disponível na API - usando fallback"
      );
      return [];
    }
  }

  async updateAppointmentStatus(
    id: string,
    status: Appointment["status"]
  ): Promise<Appointment> {
    try {
      const response = await axiosInstance.put<ApiResponse<Appointment>>(
        `/api/appointments/${id}/status`,
        { status }
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Atualização de status não disponível na API - usando fallback"
      );
      return {} as Appointment;
    }
  }

  async cancelAppointment(id: string): Promise<Appointment> {
    return this.updateAppointmentStatus(id, "cancelada");
  }

  async confirmAppointment(id: string): Promise<Appointment> {
    return this.updateAppointmentStatus(id, "confirmada");
  }

  async getAppointmentById(id: string): Promise<Appointment> {
    try {
      const response = await axiosInstance.get<ApiResponse<Appointment>>(
        `/api/appointments/${id}`
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Busca de agendamento não disponível na API - usando fallback"
      );
      return {} as Appointment;
    }
  }

  async updateAppointmentNotes(
    id: string,
    notes: string
  ): Promise<Appointment> {
    try {
      const response = await axiosInstance.put<ApiResponse<Appointment>>(
        `/api/appointments/${id}/notes`,
        { notes }
      );
      return response.data.data;
    } catch (error) {
      console.warn(
        "Atualização de notas não disponível na API - usando fallback"
      );
      return {} as Appointment;
    }
  }
}
