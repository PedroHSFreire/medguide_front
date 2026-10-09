/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Bell,
  CheckCircle2,
  XCircle,
  LogOut,
  AlertCircle,
  Phone,
  MapPin,
  RefreshCw,
  FileText,
} from "lucide-react";
import { useDoctorAppointments } from "../../lib/hooks/useDoctorAppointments";
import ClinicalRecordModal, {
  ClinicalRecordFields,
} from "../../../components/ClinicalRecordModal";

interface ExamRequest {
  id: string;
  patientName: string;
  patientEmail: string;
  examType: string;
  description: string;
  requestDate: string;
  status: "pending" | "completed" | "cancelled";
}

// Função para mapear status do back-end para o front-end
const mapAppointmentStatus = (status: string) => {
  switch (status) {
    case "agendada":
      return "pending";
    case "confirmada":
      return "accepted";
    case "cancelada":
      return "rejected";
    case "realizada":
      return "completed";
    default:
      return "pending";
  }
};

// Função para mapear status do front-end para o back-end
const mapToBackendStatus = (status: string) => {
  switch (status) {
    case "accepted":
      return "confirmada";
    case "rejected":
      return "cancelada";
    case "completed":
      return "realizada";
    default:
      return "agendada";
  }
};

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Usar o hook para buscar agendamentos reais
  const {
    appointments: realAppointments,
    loading: appointmentsLoading,
    error: appointmentsError,
    refetch: refetchAppointments,
    updateAppointmentStatus,
    updateAppointmentClinical,
  } = useDoctorAppointments(session?.user?.id);

  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [activeTab, setActiveTab] = useState<
    "pending" | "accepted" | "rejected" | "completed"
  >("pending");
  const [activeSection, setActiveSection] = useState<"appointments" | "exams">(
    "appointments"
  );
  const [refreshing, setRefreshing] = useState(false);
  const [clinicalModalAppointment, setClinicalModalAppointment] = useState<{
    id: string;
    patientName: string;
    diagnosis?: string;
    prescription?: string;
    doctor_notes?: string;
    recommended_medications?: ClinicalRecordFields["recommended_medications"];
  } | null>(null);

  // Converter agendamentos reais para o formato do front-end
  const mappedAppointments = useMemo(() => {
    return realAppointments.map((apt) => ({
      id: apt.id,
      patientName: apt.patient_name || "Paciente",
      patientEmail: apt.patient_email || "",
      patientPhone: apt.patient_phone,
      date: new Date(apt.date_time).toLocaleDateString("pt-BR"),
      time: new Date(apt.date_time).toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      date_time: apt.date_time,
      status: mapAppointmentStatus(apt.status),
      notes: apt.symptoms,
      specialty: apt.specialty,
      type: apt.type,
      diagnosis: apt.diagnosis,
      prescription: apt.prescription,
      doctor_notes: apt.doctor_notes,
      recommended_medications: apt.recommended_medications,
    }));
  }, [realAppointments]);

  // Load exam requests from localStorage
  const loadExamRequests = useCallback(() => {
    try {
      const exams = localStorage.getItem("doctor_exam_requests");
      if (exams) {
        const parsedExams = JSON.parse(exams);
        setExamRequests(parsedExams);
      }
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, []);

  // Redirect if not logged in as doctor
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/doctor/login");
      return;
    }

    if (status === "authenticated") {
      loadExamRequests();
    }
  }, [status, router, loadExamRequests]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchAppointments();
    setRefreshing(false);
  };

  // Funções para manipular agendamentos reais
  const handleAcceptAppointment = useCallback(
    async (appointmentId: string) => {
      try {
        await updateAppointmentStatus(appointmentId, "confirmada");
        console.log(`Consulta ${appointmentId} aceita`);
      } catch (err) {
        console.error("Erro ao aceitar consulta:", err);
      }
    },
    [updateAppointmentStatus]
  );

  const handleCompleteAppointment = useCallback(
    async (appointmentId: string) => {
      try {
        await updateAppointmentStatus(appointmentId, "realizada");
        console.log(`Consulta ${appointmentId} concluída`);
      } catch (err) {
        console.error("Erro ao concluir consulta:", err);
      }
    },
    [updateAppointmentStatus]
  );

  const handleRejectAppointment = useCallback(
    async (appointmentId: string) => {
      try {
        await updateAppointmentStatus(appointmentId, "cancelada");
        console.log(`Consulta ${appointmentId} recusada`);
      } catch (err) {
        console.error("Erro ao recusar consulta:", err);
      }
    },
    [updateAppointmentStatus]
  );

  const handleSaveClinicalRecord = useCallback(
    async (data: ClinicalRecordFields) => {
      if (!clinicalModalAppointment) return;
      await updateAppointmentClinical(clinicalModalAppointment.id, data);
    },
    [clinicalModalAppointment, updateAppointmentClinical]
  );

  const hasClinicalContent = (appointment: {
    diagnosis?: string;
    prescription?: string;
    doctor_notes?: string;
    recommended_medications?: ClinicalRecordFields["recommended_medications"];
  }) =>
    Boolean(
      appointment.diagnosis ||
        appointment.prescription ||
        appointment.doctor_notes ||
        (appointment.recommended_medications &&
          appointment.recommended_medications.length > 0)
    );

  // Funções para exames (mantidas do código original)
  const handleCompleteExam = useCallback(
    (examId: string) => {
      setExamRequests((prev) =>
        prev.map((exam) =>
          exam.id === examId ? { ...exam, status: "completed" } : exam
        )
      );
      const updated = examRequests.map((e) =>
        e.id === examId ? { ...e, status: "completed" } : e
      );
      localStorage.setItem("doctor_exam_requests", JSON.stringify(updated));
      console.log(`Exame ${examId} concluído`);
    },
    [examRequests]
  );

  const handleCancelExam = useCallback(
    (examId: string) => {
      setExamRequests((prev) =>
        prev.map((exam) =>
          exam.id === examId ? { ...exam, status: "cancelled" } : exam
        )
      );
      const updated = examRequests.map((e) =>
        e.id === examId ? { ...e, status: "cancelled" } : e
      );
      localStorage.setItem("doctor_exam_requests", JSON.stringify(updated));
      console.log(`Exame ${examId} cancelado`);
    },
    [examRequests]
  );

  // Filtrar agendamentos por status
  const filteredAppointments = useMemo(() => {
    return mappedAppointments.filter((apt) => apt.status === activeTab);
  }, [mappedAppointments, activeTab]);

  // Contadores para estatísticas
  const pendingCount = useMemo(
    () => mappedAppointments.filter((apt) => apt.status === "pending").length,
    [mappedAppointments]
  );

  const acceptedCount = useMemo(
    () => mappedAppointments.filter((apt) => apt.status === "accepted").length,
    [mappedAppointments]
  );

  const rejectedCount = useMemo(
    () => mappedAppointments.filter((apt) => apt.status === "rejected").length,
    [mappedAppointments]
  );

  const completedCount = useMemo(
    () => mappedAppointments.filter((apt) => apt.status === "completed").length,
    [mappedAppointments]
  );

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/doctor/login");
  };

  if (status === "loading" || appointmentsLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando agendamentos...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100">
      {/* Header */}
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900">
                Dashboard do Médico
              </h1>
              <p className="text-gray-600 mt-1 text-sm md:text-base">
                Dr(a). {session.user?.name || "Médico"}
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`}
                />
                Atualizar
              </button>
              <button
                onClick={() => router.push("/doctor/profile")}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
              >
                <User className="w-5 h-5" />
                Perfil
              </button>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Consultas Pendentes</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {pendingCount}
                </p>
              </div>
              <Bell className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Consultas Aceitas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {acceptedCount}
                </p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Consultas Recusadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {rejectedCount}
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Consultas Realizadas</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {completedCount}
                </p>
              </div>
              <CheckCircle2 className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Error Message */}
        {appointmentsError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center text-red-700">
              <AlertCircle className="w-5 h-5 mr-2" />
              <span className="font-medium">
                Erro ao carregar agendamentos: {appointmentsError}
              </span>
            </div>
          </div>
        )}

        {/* Section Selector */}
        <div className="flex gap-2 mb-8">
          <button
            onClick={() => setActiveSection("exams")}
            className={`flex-1 py-3 px-6 font-semibold rounded-lg transition-colors ${
              activeSection === "exams"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            📋 Requisições de Exames (
            {examRequests.filter((e) => e.status === "pending").length})
          </button>
          <button
            onClick={() => setActiveSection("appointments")}
            className={`flex-1 py-3 px-6 font-semibold rounded-lg transition-colors ${
              activeSection === "appointments"
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            📅 Consultas Agendadas ({mappedAppointments.length})
          </button>
        </div>

        {/* Exams Section */}
        {activeSection === "exams" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            <div className="p-6">
              {examRequests.filter((e) => e.status === "pending").length ===
              0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    Nenhuma requisição de exame pendente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {examRequests
                    .filter((e) => e.status === "pending")
                    .map((exam) => (
                      <div
                        key={exam.id}
                        className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gray-50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-start gap-3 mb-4">
                              <User className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                              <div>
                                <p className="font-semibold text-gray-900">
                                  {exam.patientName}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {exam.patientEmail}
                                </p>
                              </div>
                            </div>
                          </div>

                          <div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-gray-700">
                                <span className="font-semibold">
                                  Tipo de Exame:
                                </span>
                                <span className="text-blue-600 font-bold">
                                  {exam.examType}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-gray-700">
                                <Clock className="w-5 h-5 text-teal-600" />
                                <span className="text-sm">
                                  {new Date(
                                    exam.requestDate
                                  ).toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              {exam.description && (
                                <div className="flex items-start gap-2 text-sm text-gray-600 mt-3">
                                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                  <span>{exam.description}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() => handleCompleteExam(exam.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Marcar Concluído
                          </button>
                          <button
                            onClick={() => handleCancelExam(exam.id)}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            <XCircle className="w-5 h-5" />
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Appointments Section */}
        {activeSection === "appointments" && (
          <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              {(["pending", "accepted", "rejected", "completed"] as const).map(
                (tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                      activeTab === tab
                        ? "bg-blue-600 text-white"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {tab === "pending" && `Pendentes (${pendingCount})`}
                    {tab === "accepted" && `Aceitas (${acceptedCount})`}
                    {tab === "rejected" && `Recusadas (${rejectedCount})`}
                    {tab === "completed" && `Realizadas (${completedCount})`}
                  </button>
                )
              )}
            </div>

            {/* Appointments List */}
            <div className="p-6">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">
                    {activeTab === "pending" && "Nenhuma consulta pendente"}
                    {activeTab === "accepted" && "Nenhuma consulta aceita"}
                    {activeTab === "rejected" && "Nenhuma consulta recusada"}
                    {activeTab === "completed" && "Nenhuma consulta realizada"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left side - Patient Info */}
                        <div>
                          <div className="flex items-start gap-3 mb-4">
                            <User className="w-5 h-5 text-blue-600 mt-1 shrink-0" />
                            <div>
                              <p className="font-semibold text-gray-900">
                                {appointment.patientName}
                              </p>
                              <p className="text-sm text-gray-600">
                                {appointment.patientEmail}
                              </p>
                              {appointment.patientPhone && (
                                <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                                  <Phone className="w-4 h-4" />
                                  {appointment.patientPhone}
                                </div>
                              )}
                              {appointment.specialty && (
                                <div className="mt-2">
                                  <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                                    {appointment.specialty}
                                  </span>
                                  <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded ml-2">
                                    {appointment.type}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right side - Appointment Info */}
                        <div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-5 h-5 text-teal-600" />
                              <span className="font-semibold">
                                {appointment.date}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-700">
                              <Clock className="w-5 h-5 text-teal-600" />
                              <span className="font-semibold">
                                {appointment.time}
                              </span>
                            </div>
                            {appointment.notes && (
                              <div className="flex items-start gap-2 text-sm text-gray-600 mt-3">
                                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                                <span>
                                  <strong>Sintomas:</strong> {appointment.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {appointment.status === "pending" && (
                        <div className="flex gap-3 mt-4 pt-4 border-t border-gray-200">
                          <button
                            onClick={() =>
                              handleAcceptAppointment(appointment.id)
                            }
                            className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-5 h-5" />
                            Aceitar
                          </button>
                          <button
                            onClick={() =>
                              handleRejectAppointment(appointment.id)
                            }
                            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                          >
                            <XCircle className="w-5 h-5" />
                            Recusar
                          </button>
                        </div>
                      )}

                      {appointment.status === "accepted" && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
                              <CheckCircle2 className="w-5 h-5" />
                              Consulta Aceita
                            </span>
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  setClinicalModalAppointment({
                                    id: appointment.id,
                                    patientName: appointment.patientName,
                                    diagnosis: appointment.diagnosis,
                                    prescription: appointment.prescription,
                                    doctor_notes: appointment.doctor_notes,
                                    recommended_medications:
                                      appointment.recommended_medications,
                                  })
                                }
                                className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <FileText className="w-4 h-4" />
                                {hasClinicalContent(appointment)
                                  ? "Editar atendimento"
                                  : "Registrar atendimento"}
                              </button>
                              <button
                                onClick={() =>
                                  handleCompleteAppointment(appointment.id)
                                }
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Concluir
                              </button>
                            </div>
                          </div>
                          {hasClinicalContent(appointment) && (
                            <div className="text-sm text-gray-600 space-y-1 bg-white rounded-lg p-3 border border-gray-100">
                              {appointment.diagnosis && (
                                <p>
                                  <strong>Diagnóstico:</strong>{" "}
                                  {appointment.diagnosis}
                                </p>
                              )}
                              {appointment.prescription && (
                                <p>
                                  <strong>Prescrição:</strong>{" "}
                                  {appointment.prescription}
                                </p>
                              )}
                              {appointment.doctor_notes && (
                                <p>
                                  <strong>Observações:</strong>{" "}
                                  {appointment.doctor_notes}
                                </p>
                              )}
                              {appointment.recommended_medications &&
                                appointment.recommended_medications.length >
                                  0 && (
                                  <p>
                                    <strong>Medicamentos:</strong>{" "}
                                    {appointment.recommended_medications
                                      .map((m) => m.name)
                                      .join(", ")}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      )}

                      {appointment.status === "rejected" && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="inline-flex items-center gap-2 text-red-600 font-semibold">
                            <XCircle className="w-5 h-5" />
                            Consulta Recusada
                          </span>
                        </div>
                      )}

                      {appointment.status === "completed" && (
                        <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-2 text-purple-600 font-semibold">
                              <CheckCircle2 className="w-5 h-5" />
                              Consulta Realizada
                            </span>
                            <button
                              onClick={() =>
                                setClinicalModalAppointment({
                                  id: appointment.id,
                                  patientName: appointment.patientName,
                                  diagnosis: appointment.diagnosis,
                                  prescription: appointment.prescription,
                                  doctor_notes: appointment.doctor_notes,
                                  recommended_medications:
                                    appointment.recommended_medications,
                                })
                              }
                              className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              <FileText className="w-4 h-4" />
                              {hasClinicalContent(appointment)
                                ? "Editar atendimento"
                                : "Registrar atendimento"}
                            </button>
                          </div>
                          {hasClinicalContent(appointment) && (
                            <div className="text-sm text-gray-600 space-y-1 bg-white rounded-lg p-3 border border-gray-100">
                              {appointment.diagnosis && (
                                <p>
                                  <strong>Diagnóstico:</strong>{" "}
                                  {appointment.diagnosis}
                                </p>
                              )}
                              {appointment.prescription && (
                                <p>
                                  <strong>Prescrição:</strong>{" "}
                                  {appointment.prescription}
                                </p>
                              )}
                              {appointment.doctor_notes && (
                                <p>
                                  <strong>Observações:</strong>{" "}
                                  {appointment.doctor_notes}
                                </p>
                              )}
                              {appointment.recommended_medications &&
                                appointment.recommended_medications.length >
                                  0 && (
                                  <p>
                                    <strong>Medicamentos:</strong>{" "}
                                    {appointment.recommended_medications
                                      .map((m) => m.name)
                                      .join(", ")}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <ClinicalRecordModal
        isOpen={!!clinicalModalAppointment}
        onClose={() => setClinicalModalAppointment(null)}
        patientName={clinicalModalAppointment?.patientName}
        initialValues={{
          diagnosis: clinicalModalAppointment?.diagnosis,
          prescription: clinicalModalAppointment?.prescription,
          doctor_notes: clinicalModalAppointment?.doctor_notes,
          recommended_medications:
            clinicalModalAppointment?.recommended_medications,
        }}
        onSave={handleSaveClinicalRecord}
      />
    </div>
  );
}
