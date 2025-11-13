"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
} from "lucide-react";

interface Appointment {
  id: string;
  patientName: string;
  patientEmail: string;
  patientPhone?: string;
  date: string;
  time: string;
  status: "pending" | "accepted" | "rejected" | "completed";
  notes?: string;
  specialty?: string;
}

interface ExamRequest {
  id: string;
  patientName: string;
  patientEmail: string;
  examType: string;
  description: string;
  requestDate: string;
  status: "pending" | "completed" | "cancelled";
}

export default function DoctorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [examRequests, setExamRequests] = useState<ExamRequest[]>([]);
  const [activeTab, setActiveTab] = useState<
    "pending" | "accepted" | "rejected"
  >("pending");
  const [activeSection, setActiveSection] = useState<"appointments" | "exams">(
    "exams"
  );

  // Redirect if not logged in as doctor
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/doctor/login");
    }
  }, [status, router]);

  // Load appointments from localStorage (demo data)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("doctor_appointments");
      if (stored) {
        setTimeout(() => setAppointments(JSON.parse(stored)), 0);
      }

      // Load exam requests
      const exams = localStorage.getItem("doctor_exam_requests");
      if (exams) {
        setTimeout(() => setExamRequests(JSON.parse(exams)), 0);
      }
    } catch {
      // Silently fail if localStorage is unavailable
    }
  }, []);

  // Listen for real-time updates
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const exams = localStorage.getItem("doctor_exam_requests");
        if (exams) {
          setExamRequests(JSON.parse(exams));
        }
      } catch {
        // Silently fail
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const playNotificationSound = useCallback(() => {
    // Simple notification sound (using Web Audio API)
    try {
      const audioContext = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch {
      console.log("Notification sound not available");
    }
  }, []);

  // Save appointments to localStorage
  useEffect(() => {
    localStorage.setItem("doctor_appointments", JSON.stringify(appointments));
  }, [appointments]);

  // Listen for new appointments from pacient side
  const latestRef = useRef<Appointment[]>([]);

  useEffect(() => {
    latestRef.current = appointments;
  }, [appointments]);

  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const storedRaw = localStorage.getItem("doctor_appointments");
        if (!storedRaw) return;
        const stored = JSON.parse(storedRaw) as Appointment[];

        // detect new appointments (by id) compared to current
        const newOnes = stored.filter(
          (s) => !latestRef.current.find((a) => a.id === s.id)
        );

        if (newOnes.length > 0) {
          // play sound and log a notification for the first new one
          playNotificationSound();
          const n = newOnes[0];
          console.log(
            `🔔 Nova consulta de ${n.patientName} em ${n.date} às ${n.time}`
          );
        }

        setAppointments(stored);
      } catch (err) {
        // ignore parse errors
      }
    };

    // initial load: if there are pending appointments, notify doctor once (non-blocking)
    try {
      const storedRaw = localStorage.getItem("doctor_appointments");
      if (storedRaw) {
        const stored = JSON.parse(storedRaw) as Appointment[];
        if (stored.some((s) => s.status === "pending")) {
          playNotificationSound();
          console.log(
            `🔔 Você tem ${
              stored.filter((s) => s.status === "pending").length
            } consulta(s) pendente(s)`
          );
        }
        setAppointments(stored);
      }
    } catch {}

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleAcceptAppointment = useCallback(
    (appointmentId: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: "accepted" } : apt
        )
      );

      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (appointment) {
        // Trigger notification sound
        playNotificationSound();
        console.log(
          `Consulta aceita: ${appointment.patientName} ${appointment.date} ${appointment.time}`
        );
      }
    },
    [appointments, playNotificationSound]
  );

  const handleCompleteAppointment = useCallback(
    (appointmentId: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: "completed" } : apt
        )
      );

      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (appointment) {
        playNotificationSound();
        console.log(
          `Consulta concluída: ${appointment.patientName} ${appointment.date} ${appointment.time}`
        );
      }
    },
    [appointments, playNotificationSound]
  );

  const handleRejectAppointment = useCallback(
    (appointmentId: string) => {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: "rejected" } : apt
        )
      );

      const appointment = appointments.find((apt) => apt.id === appointmentId);
      if (appointment) {
        console.log(`Consulta recusada: ${appointment.patientName}`);
      }
    },
    [appointments]
  );

  const handleCompleteExam = useCallback(
    (examId: string) => {
      setExamRequests((prev) =>
        prev.map((exam) =>
          exam.id === examId ? { ...exam, status: "completed" } : exam
        )
      );

      const exam = examRequests.find((e) => e.id === examId);
      if (exam) {
        playNotificationSound();
        console.log(`Exame concluído: ${exam.examType} de ${exam.patientName}`);
        // Save to localStorage using the updated array
        const updated = examRequests.map((e) =>
          e.id === examId ? { ...e, status: "completed" } : e
        );
        localStorage.setItem("doctor_exam_requests", JSON.stringify(updated));
      }
    },
    [examRequests, playNotificationSound]
  );

  const handleCancelExam = useCallback(
    (examId: string) => {
      setExamRequests((prev) =>
        prev.map((exam) =>
          exam.id === examId ? { ...exam, status: "cancelled" } : exam
        )
      );

      const exam = examRequests.find((e) => e.id === examId);
      if (exam) {
        console.log(`Exame cancelado: ${exam.examType} de ${exam.patientName}`);
        // Save to localStorage using the updated array
        const updated = examRequests.map((e) =>
          e.id === examId ? { ...e, status: "cancelled" } : e
        );
        localStorage.setItem("doctor_exam_requests", JSON.stringify(updated));
      }
    },
    [examRequests]
  );

  const filteredAppointments = useMemo(
    () => appointments.filter((apt) => apt.status === activeTab),
    [appointments, activeTab]
  );

  const pendingCount = useMemo(
    () => appointments.filter((apt) => apt.status === "pending").length,
    [appointments]
  );

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push("/doctor/login");
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">
                Dashboard do Médico
              </h1>
              <p className="text-gray-600 mt-1">
                Dr(a). {session.user?.name || "Médico"}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                  {
                    appointments.filter((apt) => apt.status === "accepted")
                      .length
                  }
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
                  {
                    appointments.filter((apt) => apt.status === "rejected")
                      .length
                  }
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </div>
        </div>

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
            📅 Consultas Agendadas
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
              {(["pending", "accepted", "rejected"] as const).map((tab) => (
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
                  {tab === "accepted" && "Aceitas"}
                  {tab === "rejected" && "Recusadas"}
                </button>
              ))}
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
                            </div>
                          </div>
                        </div>

                        {/* Right side - Appointment Info */}
                        <div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-700">
                              <Calendar className="w-5 h-5 text-teal-600" />
                              <span className="font-semibold">
                                {new Date(appointment.date).toLocaleDateString(
                                  "pt-BR",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
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
                                <span>{appointment.notes}</span>
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
                        <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                          <span className="inline-flex items-center gap-2 text-green-600 font-semibold">
                            <CheckCircle2 className="w-5 h-5" />
                            Consulta Aceita
                          </span>
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
                      )}

                      {appointment.status === "rejected" && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <span className="inline-flex items-center gap-2 text-red-600 font-semibold">
                            <XCircle className="w-5 h-5" />
                            Consulta Recusada
                          </span>
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
    </div>
  );
}
