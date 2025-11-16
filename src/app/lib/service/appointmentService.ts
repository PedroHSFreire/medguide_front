import { Appointment, CreateAppointmentData } from "../types/appointments";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export default class AppointmentService {
  async createAppointment(data: CreateAppointmentData): Promise<Appointment> {
    try {
      // Como não há rota específica no seu back-end, usar fallback
      console.warn(
        "Rota de agendamento não disponível - usando fallback local"
      );

      const fallback: Appointment = {
        id: `apt-${Date.now()}`,
        doctorId: data.doctorId,
        patientId: data.patientId,
        date: data.date,
        time: data.time,
        type: data.type as unknown,
        reason: data.reason || "",
        status: "agendada",
        doctorName: "Dr. Local",
        doctorSpecialty: "Especialidade",
        patientName: "Paciente Local",
        patientEmail: "local@email.com",
        createdAt: new Date().toISOString(),
      } as Appointment;

      // Salvar no localStorage para demonstração
      if (typeof window !== "undefined") {
        const appointments = JSON.parse(
          localStorage.getItem("appointments") || "[]"
        );
        appointments.push(fallback);
        localStorage.setItem("appointments", JSON.stringify(appointments));
      }

      return fallback;
    } catch (error) {
      console.error("Erro ao criar agendamento:", error);
      throw new Error("Erro ao criar agendamento");
    }
  }

  async getAppointmentsByPatient(patientId: string): Promise<Appointment[]> {
    try {
      // Fallback para localStorage
      if (typeof window !== "undefined") {
        const appointments = JSON.parse(
          localStorage.getItem("appointments") || "[]"
        );
        return appointments.filter(
          (apt: Appointment) => apt.patientId === patientId
        );
      }
      return [];
    } catch (error) {
      console.warn("Erro ao buscar agendamentos - usando fallback" + error);
      return [];
    }
  }

  async getAppointmentsByDoctor(doctorId: string): Promise<Appointment[]> {
    try {
      // Fallback para localStorage
      if (typeof window !== "undefined") {
        const appointments = JSON.parse(
          localStorage.getItem("appointments") || "[]"
        );
        return appointments.filter(
          (apt: Appointment) => apt.doctorId === doctorId
        );
      }
      return [];
    } catch (error) {
      console.warn(
        "Erro ao buscar agendamentos do médico - usando fallback" + error
      );
      return [];
    }
  }

  // ... manter os outros métodos com fallback como estão
}
