// hooks/useAppointments.ts
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import AppointmentService from "../service/appointmentService";
import { Appointment, CreateAppointmentData } from "../types/appointments";

export const useAppointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const appointmentService = new AppointmentService();

  const loadAppointments = async () => {
    if (!isAuthenticated || !user) return;

    try {
      setLoading(true);
      setError(null);

      let userAppointments: Appointment[] = [];

      if (user.role === "pacient") {
        userAppointments = await appointmentService.getAppointmentsByPatient(
          user.id
        );
      } else if (user.role === "doctor") {
        userAppointments = await appointmentService.getAppointmentsByDoctor(
          user.id
        );
      }

      // Ordenar por data e hora
      userAppointments.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

      setAppointments(userAppointments);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar agendamentos"
      );
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (data: CreateAppointmentData) => {
    try {
      setLoading(true);
      setError(null);

      const newAppointment = await appointmentService.createAppointment(data);
      setAppointments((prev) => [...prev, newAppointment]);

      return newAppointment;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao criar agendamento";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const updatedAppointment = await appointmentService.cancelAppointment(
        appointmentId
      );

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updatedAppointment : apt))
      );

      return updatedAppointment;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao cancelar agendamento";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const confirmAppointment = async (appointmentId: string) => {
    try {
      setLoading(true);
      const updatedAppointment = await appointmentService.confirmAppointment(
        appointmentId
      );

      setAppointments((prev) =>
        prev.map((apt) => (apt.id === appointmentId ? updatedAppointment : apt))
      );

      return updatedAppointment;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao confirmar agendamento";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [isAuthenticated, user]);

  return {
    appointments,
    loading,
    error,
    createAppointment,
    cancelAppointment,
    confirmAppointment,
    refreshAppointments: loadAppointments,
  };
};
