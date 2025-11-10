// services/appointmentService.ts
import axiosInstance from "./service";
import {
  Appointment,
  CreateAppointmentData,
  TimeSlot,
  AvailableDate,
} from "../types/appointments";
import { ApiError, AxiosErrorResponse } from "../types/api";

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
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao criar agendamento:", axiosError);
      throw new Error(
        axiosError.response?.data?.error || "Erro ao criar agendamento"
      );
    }
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Appointment[]>>(
        `/api/appointments/patient/${patientId}`
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar agendamentos do paciente:", axiosError);
      throw new Error(
        axiosError.response?.data?.error ||
          "Erro ao buscar agendamentos do paciente"
      );
    }
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    try {
      const response = await axiosInstance.get<ApiResponse<Appointment[]>>(
        `/api/appointments/doctor/${doctorId}`
      );
      return response.data.data;
    } catch (error) {
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar agendamentos do médico:", axiosError);
      throw new Error(
        axiosError.response?.data?.error ||
          "Erro ao buscar agendamentos do médico"
      );
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
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar horários disponíveis:", axiosError);
      throw new Error(
        axiosError.response?.data?.error ||
          "Erro ao buscar horários disponíveis"
      );
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
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar datas disponíveis:", axiosError);
      throw new Error(
        axiosError.response?.data?.error || "Erro ao buscar datas disponíveis"
      );
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
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao atualizar status do agendamento:", axiosError);
      throw new Error(
        axiosError.response?.data?.error ||
          "Erro ao atualizar status do agendamento"
      );
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
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao buscar agendamento:", axiosError);
      throw new Error(
        axiosError.response?.data?.error || "Erro ao buscar agendamento"
      );
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
      const axiosError = error as AxiosErrorResponse;
      console.error("Erro ao atualizar notas do agendamento:", axiosError);
      throw new Error(
        axiosError.response?.data?.error ||
          "Erro ao atualizar notas do agendamento"
      );
    }
  }
}
