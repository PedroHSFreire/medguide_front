// types/appointment.ts
export interface Appointment {
  id: string;
  doctorId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorName: string;
  doctorSpecialty: string;
  date: string;
  time: string;
  status: "agendada" | "confirmada" | "cancelada" | "realizada";
  type: "consulta" | "retorno" | "exame";
  reason?: string;
  notes?: string;
}

export interface CreateAppointmentData {
  doctorId: string;
  patientId: string;
  date: string;
  time: string;
  type: "consulta" | "retorno" | "exame";
  reason?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface AvailableDate {
  date: string;
  slots: TimeSlot[];
}
