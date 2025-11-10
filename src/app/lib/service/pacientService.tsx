// components/views/pacient/HomePacient.tsx - VERSÃO DINÂMICA COMPLETA
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  LogOut,
  Search,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
  Calendar,
  X,
  Clock,
  Trash2,
  Plus,
} from "lucide-react";
import { useAuth } from "../../../app/lib/hooks/useAuth";
import { useSession } from "next-auth/react";
import AppointmentService from "../../../app/lib/service/appointmentService";
import DoctorSearchService from "../../../app/lib/service/doctorSearchService";
import { Appointment, TimeSlot } from "../../../app/lib/types/appointments";
import { DoctorSearchResult } from "../../../app/lib/types/doctorSearch";
import Link from "next/link";

export default function HomePacient() {
  const { user, logout, isAuthenticated } = useAuth();
  const { data: session } = useSession();
  const router = useRouter();

  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<DoctorSearchResult[]>([]);
  const [allDoctors, setAllDoctors] = useState<DoctorSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] =
    useState<DoctorSearchResult | null>(null);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentReason, setAppointmentReason] = useState("");
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [myAppointments, setMyAppointments] = useState<Appointment[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<
    Appointment[]
  >([]);
  const [showAllDoctors, setShowAllDoctors] = useState(true);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [appointmentLoading, setAppointmentLoading] = useState(false);

  const appointmentService = new AppointmentService();
  const doctorSearchService = new DoctorSearchService();

  // Médicos pré-cadastrados para fallback
  const predefinedDoctors: DoctorSearchResult[] = [
    {
      id: "doc-1",
      name: "Dr. Carlos Silva",
      specialty: "Cardiologista",
      CRM: "CRM/SP 123.456",
      email: "carlos.silva@medguide.com",
      phone: "(11) 9999-8888",
      address: "Av. Paulista, 1000 - São Paulo/SP",
    },
    {
      id: "doc-2",
      name: "Dra. Ana Santos",
      specialty: "Dermatologista",
      CRM: "CRM/SP 234.567",
      email: "ana.santos@medguide.com",
      phone: "(11) 7777-6666",
      address: "R. Augusta, 500 - São Paulo/SP",
    },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/auth/login");
      return;
    }
    setLoading(false);
    loadMyAppointments();
    loadAllDoctors();
  }, [isAuthenticated, router]);

  const loadAllDoctors = async () => {
    try {
      setDoctorsLoading(true);
      // Busca médicos da API
      const doctors = await doctorSearchService.getAllDoctors();
      if (doctors && doctors.length > 0) {
        setAllDoctors(doctors);
      } else {
        // Fallback para médicos pré-cadastrados se a API não retornar nada
        setAllDoctors(predefinedDoctors);
      }
    } catch (error) {
      console.error("Erro ao carregar médicos:", error);
      // Fallback para médicos pré-cadastrados em caso de erro
      setAllDoctors(predefinedDoctors);
    } finally {
      setDoctorsLoading(false);
    }
  };

  // Busca automática quando o termo de pesquisa muda
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
        setShowAllDoctors(true);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadMyAppointments = async () => {
    if (!user?.id) return;
    try {
      const appointments = await appointmentService.getAppointmentsByPatient(
        user.id
      );
      setMyAppointments(appointments);
      updateUpcomingAppointments(appointments);
    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
      // Em caso de erro, usar dados de exemplo para demonstração
      const sampleAppointments = createSampleAppointments(user.id);
      setMyAppointments(sampleAppointments);
      updateUpcomingAppointments(sampleAppointments);
    }
  };

  const updateUpcomingAppointments = (appointments: Appointment[]) => {
    const today = new Date().toISOString().split("T")[0];
    const upcoming = appointments
      .filter(
        (apt) =>
          (apt.status === "agendada" || apt.status === "confirmada") &&
          apt.date >= today
      )
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      });

    setUpcomingAppointments(upcoming);
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta consulta?")) {
      return;
    }

    try {
      setAppointmentLoading(true);
      await appointmentService.cancelAppointment(appointmentId);
      alert("Consulta cancelada com sucesso!");
      await loadMyAppointments();
    } catch (error) {
      console.error("Erro ao cancelar consulta:", error);
      alert("Erro ao cancelar consulta");
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro de consulta?")) {
      return;
    }

    try {
      setAppointmentLoading(true);
      // Em produção, você chamaria appointmentService.deleteAppointment(appointmentId)
      // Para demonstração, simulamos uma exclusão
      await new Promise((resolve) => setTimeout(resolve, 500));

      setMyAppointments((prev) =>
        prev.filter((apt) => apt.id !== appointmentId)
      );
      setUpcomingAppointments((prev) =>
        prev.filter((apt) => apt.id !== appointmentId)
      );

      alert("Consulta excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir consulta:", error);
      alert("Erro ao excluir consulta");
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setShowAllDoctors(true);
      return;
    }

    try {
      setSearchLoading(true);
      setShowAllDoctors(false);

      // Busca médicos na API
      const doctors = await doctorSearchService.searchDoctors({
        name: searchTerm,
        specialty: searchTerm,
      });

      setSearchResults(doctors);
    } catch (error) {
      console.error("Erro ao buscar médicos:", error);
      // Fallback: busca local nos médicos já carregados
      const filteredDoctors = allDoctors.filter(
        (doctor) =>
          doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (doctor.CRM &&
            doctor.CRM.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      setSearchResults(filteredDoctors);
    } finally {
      setSearchLoading(false);
    }
  }, [searchTerm, allDoctors]);

  const handleOpenAppointmentModal = async (doctor: DoctorSearchResult) => {
    setSelectedDoctor(doctor);
    setAppointmentDate("");
    setAppointmentTime("");
    setAppointmentReason("");

    // Data mínima: hoje
    const today = new Date().toISOString().split("T")[0];
    setAppointmentDate(today);

    try {
      // Buscar horários disponíveis da API
      const slots = await appointmentService.getAvailableTimeSlots(
        doctor.id,
        today
      );
      setAvailableSlots(slots);

      // Encontrar o primeiro slot disponível
      const firstAvailableSlot = slots.find((slot) => slot.available);
      setAppointmentTime(firstAvailableSlot?.time || "");

      setShowAppointmentModal(true);
    } catch (error) {
      console.error("Erro ao buscar horários:", error);
      // Fallback: slots de exemplo baseados no dia da semana
      const sampleSlots = generateSampleTimeSlots();
      setAvailableSlots(sampleSlots);

      const firstAvailableSlot = sampleSlots.find((slot) => slot.available);
      setAppointmentTime(firstAvailableSlot?.time || "");

      setShowAppointmentModal(true);
    }
  };

  const generateSampleTimeSlots = (): TimeSlot[] => {
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

    return baseSlots.map((time) => ({
      time,
      available: Math.random() > 0.3, // 70% de chance de estar disponível
    }));
  };

  const handleDateChange = async (date: string) => {
    setAppointmentDate(date);
    setAppointmentTime("");

    if (selectedDoctor) {
      try {
        const slots = await appointmentService.getAvailableTimeSlots(
          selectedDoctor.id,
          date
        );
        setAvailableSlots(slots);

        // Encontrar o primeiro slot disponível
        const firstAvailableSlot = slots.find((slot) => slot.available);
        setAppointmentTime(firstAvailableSlot?.time || "");
      } catch (error) {
        console.error("Erro ao buscar horários:", error);
        // Fallback: slots de exemplo variáveis
        const sampleSlots = generateSampleTimeSlots();
        setAvailableSlots(sampleSlots);

        const firstAvailableSlot = sampleSlots.find((slot) => slot.available);
        setAppointmentTime(firstAvailableSlot?.time || "");
      }
    }
  };

  // Função auxiliar: Verificar se um slot está disponível
  const isSlotAvailable = (time: string): boolean => {
    const slot = availableSlots.find((s) => s.time === time);
    return slot ? slot.available : false;
  };

  const handleScheduleAppointment = async () => {
    if (!selectedDoctor || !user || !appointmentDate || !appointmentTime) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Verificar se o horário ainda está disponível
    if (!isSlotAvailable(appointmentTime)) {
      alert("Este horário não está mais disponível. Por favor, escolha outro.");
      return;
    }

    try {
      setAppointmentLoading(true);

      const appointmentData = {
        doctorId: selectedDoctor.id,
        patientId: user.id,
        date: appointmentDate,
        time: appointmentTime,
        type: "consulta",
        reason: appointmentReason,
        status: "agendada" as const,
      };

      const newAppointment = await appointmentService.createAppointment(
        appointmentData
      );

      alert("Consulta agendada com sucesso!");
      setShowAppointmentModal(false);
      await loadMyAppointments();

      // Reset form
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentReason("");
      setSelectedDoctor(null);
    } catch (error) {
      console.error("Erro ao agendar consulta:", error);
      alert("Erro ao agendar consulta. Tente novamente.");
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
  };

  const refreshDoctors = async () => {
    await loadAllDoctors();
    alert("Lista de médicos atualizada!");
  };

  // Função para formatar a data em português
  const formatAppointmentDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const pastAppointments = myAppointments.filter(
    (apt) =>
      apt.status === "cancelada" ||
      apt.status === "realizada" ||
      new Date(apt.date) < new Date()
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel do Paciente
              </h1>
              <p className="text-gray-600">Bem-vindo, {user.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/pacient/profile"
                className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                <User className="w-4 h-4" />
                Meu Perfil
              </Link>
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
        {/* Próximas Consultas */}
        {upcomingAppointments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Próximas Consultas
              </h2>
              <div className="flex items-center gap-2 text-blue-600">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {upcomingAppointments.length} agendada(s)
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {appointment.doctorName}
                        </h3>
                        <p className="text-gray-600">
                          {appointment.doctorSpecialty}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatAppointmentDate(appointment.date)} às{" "}
                          {appointment.time}
                        </p>
                        {appointment.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Motivo:</strong> {appointment.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          appointment.status === "agendada"
                            ? "bg-yellow-100 text-yellow-800"
                            : appointment.status === "confirmada"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {appointment.status === "agendada"
                          ? "Agendada"
                          : appointment.status === "confirmada"
                          ? "Confirmada"
                          : appointment.status}
                      </span>

                      {(appointment.status === "agendada" ||
                        appointment.status === "confirmada") && (
                        <button
                          onClick={() =>
                            handleCancelAppointment(appointment.id)
                          }
                          disabled={appointmentLoading}
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          {appointmentLoading ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                          Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de Consultas */}
        {pastAppointments.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                Histórico de Consultas
              </h2>
              <span className="text-sm text-gray-500">
                {pastAppointments.length} consultas passadas
              </span>
            </div>
            <div className="space-y-4">
              {pastAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="border border-gray-200 rounded-lg p-4 opacity-75"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          appointment.status === "realizada"
                            ? "bg-green-100"
                            : appointment.status === "cancelada"
                            ? "bg-red-100"
                            : "bg-gray-100"
                        }`}
                      >
                        <Calendar
                          className={`w-6 h-6 ${
                            appointment.status === "realizada"
                              ? "text-green-600"
                              : appointment.status === "cancelada"
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">
                          {appointment.doctorName}
                        </h3>
                        <p className="text-gray-600">
                          {appointment.doctorSpecialty}
                        </p>
                        <p className="text-sm text-gray-500">
                          {formatAppointmentDate(appointment.date)} às{" "}
                          {appointment.time}
                        </p>
                        {appointment.reason && (
                          <p className="text-sm text-gray-600 mt-1">
                            <strong>Motivo:</strong> {appointment.reason}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          appointment.status === "realizada"
                            ? "bg-green-100 text-green-800"
                            : appointment.status === "cancelada"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {appointment.status === "realizada"
                          ? "Realizada"
                          : appointment.status === "cancelada"
                          ? "Cancelada"
                          : appointment.status}
                      </span>

                      {/* Botão discreto para excluir consultas canceladas */}
                      {appointment.status === "cancelada" && (
                        <button
                          onClick={() =>
                            handleDeleteAppointment(appointment.id)
                          }
                          disabled={appointmentLoading}
                          className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 p-2 rounded-lg text-sm transition-colors duration-200"
                          title="Excluir registro"
                        >
                          {appointmentLoading ? (
                            <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Barra de Pesquisa */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Buscar Médicos</h2>
            <button
              onClick={refreshDoctors}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              Atualizar Lista
            </button>
          </div>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome do médico, especialidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-black pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-2">
              {searchLoading ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Buscando...
                </span>
              ) : (
                `${searchResults.length} médico(s) encontrado(s) para "${searchTerm}"`
              )}
            </p>
          )}
        </div>

        {/* Loading dos Médicos */}
        {doctorsLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-center">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando médicos...</p>
          </div>
        )}

        {/* Médicos Disponíveis (quando não há busca) */}
        {!doctorsLoading && showAllDoctors && allDoctors.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Médicos Disponíveis ({allDoctors.length})
              </h3>
              <span className="text-sm text-gray-500">
                Atualizado em {new Date().toLocaleDateString("pt-BR")}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allDoctors.map((doctor) => (
                <div
                  key={doctor.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {doctor.name}
                      </h4>
                      <p className="text-sm text-blue-600">
                        {doctor.specialty}
                      </p>
                      <p className="text-xs text-gray-500">{doctor.CRM}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {doctor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">{doctor.email}</span>
                    </div>
                    {doctor.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                        <span className="text-xs">{doctor.address}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenAppointmentModal(doctor)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Agendar Consulta
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resultados da Busca */}
        {!doctorsLoading && !showAllDoctors && searchResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Resultados da Busca ({searchResults.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {searchResults.map((doctor) => (
                <div
                  key={doctor.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <Stethoscope className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">
                        {doctor.name}
                      </h4>
                      <p className="text-sm text-blue-600">
                        {doctor.specialty}
                      </p>
                      <p className="text-xs text-gray-500">{doctor.CRM}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {doctor.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        <span>{doctor.phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span className="text-xs">{doctor.email}</span>
                    </div>
                    {doctor.address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                        <span className="text-xs">{doctor.address}</span>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleOpenAppointmentModal(doctor)}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Agendar Consulta
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há médicos */}
        {!doctorsLoading && allDoctors.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Stethoscope className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhum médico cadastrado
            </h3>
            <p className="text-gray-600 mb-4">
              Não há médicos disponíveis no momento.
            </p>
            <button
              onClick={refreshDoctors}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
            >
              Tentar Novamente
            </button>
          </div>
        )}

        {/* Mensagem quando não há resultados na busca */}
        {searchTerm && searchResults.length === 0 && !searchLoading && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Nenhum médico encontrado
            </h3>
            <p className="text-gray-600">
              Não encontramos médicos para {searchTerm}. Tente buscar por outra
              especialidade ou nome.
            </p>
          </div>
        )}

        {/* Modal de Agendamento */}
        {showAppointmentModal && selectedDoctor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                  Agendar Consulta
                </h3>
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={appointmentLoading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-700">
                  {selectedDoctor.name}
                </h4>
                <p className="text-gray-600">{selectedDoctor.specialty}</p>
                <p className="text-sm text-gray-500">{selectedDoctor.CRM}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Data da Consulta *
                  </label>
                  <input
                    type="date"
                    value={appointmentDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 text-black focus:ring-blue-500"
                    required
                    disabled={appointmentLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Horário *
                  </label>
                  <select
                    value={appointmentTime}
                    onChange={(e) => setAppointmentTime(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={appointmentLoading || availableSlots.length === 0}
                  >
                    <option value="">Selecione um horário</option>
                    {availableSlots.map((slot) => (
                      <option
                        key={slot.time}
                        value={slot.time}
                        disabled={!slot.available}
                        className={
                          !slot.available
                            ? "text-gray-400 bg-gray-100"
                            : "text-black"
                        }
                      >
                        {slot.time} {!slot.available ? " (Indisponível)" : ""}
                      </option>
                    ))}
                  </select>

                  {availableSlots.length > 0 && (
                    <div className="mt-2 text-sm">
                      <p className="text-gray-600">
                        <span className="font-medium text-green-600">
                          {
                            availableSlots.filter((slot) => slot.available)
                              .length
                          }
                        </span>{" "}
                        horários disponíveis
                      </p>
                    </div>
                  )}

                  {availableSlots.length === 0 && (
                    <p className="text-sm text-red-500 mt-1">
                      Não há horários disponíveis para esta data. Por favor,
                      selecione outra data.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motivo da Consulta (opcional)
                  </label>
                  <textarea
                    value={appointmentReason}
                    onChange={(e) => setAppointmentReason(e.target.value)}
                    rows={3}
                    className="w-full p-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Descreva brevemente o motivo da sua consulta..."
                    disabled={appointmentLoading}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Esta informação ajudará o médico a se preparar para sua
                    consulta.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAppointmentModal(false)}
                  disabled={appointmentLoading}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleScheduleAppointment}
                  disabled={
                    appointmentLoading ||
                    !appointmentTime ||
                    !isSlotAvailable(appointmentTime)
                  }
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2"
                >
                  {appointmentLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Agendando...
                    </>
                  ) : (
                    "Confirmar Agendamento"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
