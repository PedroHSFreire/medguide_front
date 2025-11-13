"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  User,
  LogOut,
  Calendar,
  Users,
  FileText,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
} from "lucide-react";
import AppointmentService from "../../../app/lib/service/appointmentService";
import { Appointment } from "../../../app/lib/types/appointments";

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);

  const appointmentService = useMemo(() => new AppointmentService(), []);
  const doctor = session?.user;

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/doctor/login");
      return;
    }

    if (session.role !== "doctor") {
      router.push("/pacient/dashboard");
      return;
    }

    const loadAppointments = async () => {
      if (!doctor?.id) return;

      const allAppointments = await appointmentService.getAppointmentsByDoctor(
        doctor.id
      );
      setAppointments(allAppointments);

      // Filtrar consultas de hoje
      const today = new Date().toISOString().split("T")[0];
      const todayApps = allAppointments.filter((apt) => apt.date === today);
      setTodayAppointments(todayApps);
      setLoading(false);
    };

    loadAppointments();
  }, [session, status, router, doctor?.id, appointmentService]);
  const handleUpdateAppointmentStatus = async (
    id: string,
    status: Appointment["status"]
  ) => {
    try {
      await appointmentService.updateAppointmentStatus(id, status);
      // Atualizar a lista de consultas localmente
      setAppointments(
        appointments.map((apt) => (apt.id === id ? { ...apt, status } : apt))
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status da consulta");
    }
  };

  const handleSignOut = async () => {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/doctor/login");
  };

  if (loading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-teal-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  const upcomingAppointments = appointments
    .filter((apt) => apt.status === "agendada" || apt.status === "confirmada")
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`);
      const dateB = new Date(`${b.date}T${b.time}`);
      return dateA.getTime() - dateB.getTime();
    });

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel do Médico
              </h1>
              <p className="text-gray-600">Bem-vindo, Dr. {doctor?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-linear-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-12 h-12 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Dr. {doctor?.name}
                </h2>
                <p className="text-blue-600 font-semibold">
                  {doctor?.specialty}
                </p>
                <p className="text-gray-600 text-sm">{doctor?.crm}</p>
              </div>

              <nav className="space-y-2">
                {[
                  { id: "appointments", label: "Consultas", icon: Calendar },
                  { id: "patients", label: "Pacientes", icon: Users },
                  { id: "records", label: "Prontuários", icon: FileText },
                  { id: "settings", label: "Configurações", icon: Settings },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                        activeTab === item.id
                          ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Estatísticas Rápidas */}
              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Hoje:</span>
                    <span className="font-semibold">
                      {todayAppointments.length} consultas
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Agendadas:</span>
                    <span className="font-semibold">
                      {
                        appointments.filter((apt) => apt.status === "agendada")
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === "appointments" && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    Próximas Consultas
                  </h3>

                  {upcomingAppointments.length === 0 ? (
                    <p className="text-gray-600 text-center py-8">
                      Nenhuma consulta agendada
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {upcomingAppointments.map((appointment) => (
                        <div
                          key={appointment.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">
                                  {appointment.patientName}
                                </h4>
                                <p className="text-gray-600">
                                  {appointment.patientEmail}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {new Date(
                                    appointment.date
                                  ).toLocaleDateString("pt-BR")}{" "}
                                  às {appointment.time}
                                </p>
                                {appointment.reason && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    <strong>Motivo:</strong>{" "}
                                    {appointment.reason}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`px-3 py-1 rounded-full text-sm font-medium ${
                                  appointment.status === "agendada"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : appointment.status === "confirmada"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {appointment.status}
                              </span>

                              {appointment.status === "agendada" && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUpdateAppointmentStatus(
                                        appointment.id,
                                        "confirmada"
                                      )
                                    }
                                    className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUpdateAppointmentStatus(
                                        appointment.id,
                                        "cancelada"
                                      )
                                    }
                                    className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                                  >
                                    <XCircle className="w-4 h-4" />
                                    Cancelar
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Todas as Consultas */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-6">
                    Todas as Consultas
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2">Paciente</th>
                          <th className="text-left py-2">Data</th>
                          <th className="text-left py-2">Horário</th>
                          <th className="text-left py-2">Status</th>
                          <th className="text-left py-2">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appointment) => (
                          <tr
                            key={appointment.id}
                            className="border-b border-gray-100"
                          >
                            <td className="py-3">
                              <div>
                                <div className="font-medium">
                                  {appointment.patientName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {appointment.patientEmail}
                                </div>
                              </div>
                            </td>
                            <td className="py-3">
                              {new Date(appointment.date).toLocaleDateString(
                                "pt-BR"
                              )}
                            </td>
                            <td className="py-3">{appointment.time}</td>
                            <td className="py-3">
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  appointment.status === "agendada"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : appointment.status === "confirmada"
                                    ? "bg-green-100 text-green-800"
                                    : appointment.status === "cancelada"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-gray-100 text-gray-800"
                                }`}
                              >
                                {appointment.status}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleUpdateAppointmentStatus(
                                      appointment.id,
                                      "confirmada"
                                    )
                                  }
                                  className="text-green-600 hover:text-green-800 text-sm"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() =>
                                    handleUpdateAppointmentStatus(
                                      appointment.id,
                                      "cancelada"
                                    )
                                  }
                                  className="text-red-600 hover:text-red-800 text-sm"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "patients" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Meus Pacientes
                </h3>
                <p className="text-gray-600">
                  Funcionalidade em desenvolvimento...
                </p>
              </div>
            )}

            {activeTab === "records" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Prontuários
                </h3>
                <p className="text-gray-600">
                  Funcionalidade em desenvolvimento...
                </p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-6">
                  Configurações
                </h3>
                <p className="text-gray-600">
                  Funcionalidade em desenvolvimento...
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
