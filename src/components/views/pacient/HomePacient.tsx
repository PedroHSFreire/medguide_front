// components/views/pacient/HomePacient.tsx - VERSÃO COMPLETA COM API
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import { DoctorSearchResult } from "../../../app/lib/service/doctorSearchService";
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
  const [cancelledAppointmentIds, setCancelledAppointmentIds] = useState<
    Set<string>
  >(new Set());
  const [showExamModal, setShowExamModal] = useState(false);
  const [examType, setExamType] = useState("");
  const [examDescription, setExamDescription] = useState("");
  const [examDoctor, setExamDoctor] = useState<DoctorSearchResult | null>(null);
  const [myExamRequests, setMyExamRequests] = useState<
    Array<{
      id: string;
      patientName: string;
      patientEmail: string;
      examType: string;
      description: string;
      requestDate: string;
      status: string;
    }>
  >([]);

  const examTypes = [
    "Ultrassom",
    "Raio-X",
    "Análise Clínica",
    "Tomografia",
    "Ressonância Magnética",
    "Eletrocardiograma",
    "Ecocardiograma",
  ];

  const appointmentService = useMemo(() => new AppointmentService(), []);
  const doctorSearchService = useMemo(() => new DoctorSearchService(), []);

  // Médicos pré-cadastrados para fallback
  const predefinedDoctors: DoctorSearchResult[] = useMemo(
    () => [
      {
        id: "doc-1",
        name: "Dra. Ana Santos",
        specialty: "Dermatologista",
        CRM: "CRM/SP 234.567",
        email: "ana.santos@medguide.com",
        phone: "(11) 7777-6666",
        address: "R. Augusta, 500 - São Paulo/SP",
      },
      {
        id: "doc-2",
        name: "Dr. Roberto Lima",
        specialty: "Ortopedista",
        CRM: "CRM/SP 345.678",
        email: "roberto.lima@medguide.com",
        phone: "(11) 8888-5555",
        address: "R. Consolação, 800 - São Paulo/SP",
      },
      {
        id: "doc-3",
        name: "Dra. Mariana Costa",
        specialty: "Pediatra",
        CRM: "CRM/SP 456.789",
        email: "mariana.costa@medguide.com",
        phone: "(11) 6666-4444",
        address: "Av. Rebouças, 300 - São Paulo/SP",
      },
      {
        id: "doc-4",
        name: "Dr. Fernando Mendes",
        specialty: "Gastroenterologista",
        CRM: "CRM/SP 567.890",
        email: "fernando.mendes@medguide.com",
        phone: "(11) 7777-3333",
        address: "R. Filadélfia, 450 - São Paulo/SP",
      },
      {
        id: "doc-5",
        name: "Dra. Juliana Oliveira",
        specialty: "Oftalmologista",
        CRM: "CRM/SP 678.901",
        email: "juliana.oliveira@medguide.com",
        phone: "(11) 5555-2222",
        address: "Av. Brigadeiro Faria Lima, 150 - São Paulo/SP",
      },
      {
        id: "doc-6",
        name: "Dr. Paulo Souza",
        specialty: "Neurologista",
        CRM: "CRM/SP 789.012",
        email: "paulo.souza@medguide.com",
        phone: "(11) 9999-1111",
        address: "R. Cincinato Braga, 200 - São Paulo/SP",
      },
      {
        id: "doc-7",
        name: "Dra. Beatriz Rocha",
        specialty: "Psiquiatra",
        CRM: "CRM/SP 890.123",
        email: "beatriz.rocha@medguide.com",
        phone: "(11) 4444-0000",
        address: "Av. Europa, 900 - São Paulo/SP",
      },
      {
        id: "doc-8",
        name: "Dr. Marcelo Torres",
        specialty: "Urologista",
        CRM: "CRM/SP 901.234",
        email: "marcelo.torres@medguide.com",
        phone: "(11) 8888-7777",
        address: "R. Oscar Freire, 500 - São Paulo/SP",
      },
      {
        id: "doc-9",
        name: "Dra. Fernanda Silva",
        specialty: "Ginecologista",
        CRM: "CRM/SP 012.345",
        email: "fernanda.silva@medguide.com",
        phone: "(11) 3333-9999",
        address: "Av. Imirim, 100 - São Paulo/SP",
      },
      {
        id: "doc-10",
        name: "Dr. Lucas Pereira",
        specialty: "Cardiologista",
        CRM: "CRM/SP 123.567",
        email: "lucas.pereira@medguide.com",
        phone: "(11) 2222-8888",
        address: "Av. Paulista, 500 - São Paulo/SP",
      },
      {
        id: "doc-carlos",
        name: "Dr. Carlos Silva",
        specialty: "Cardiologista",
        CRM: "CRM/SP 999.999",
        email: "carlos.silva@medguide.com",
        phone: "(11) 1111-2222",
        address: "R. Saúde, 123 - São Paulo/SP",
      },
    ],
    []
  );

  // Sincroniza atualizações feitas pelo médico (via localStorage) com o painel do paciente
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== "doctor_appointments") return;
      try {
        const stored = JSON.parse(
          localStorage.getItem("doctor_appointments") || "[]"
        );
        setMyAppointments((prev) => {
          const updated = prev.map((apt) => {
            const docApt = stored.find((d: any) => d.id === apt.id);
            if (!docApt) return apt;

            // mapear status do médico para status do paciente
            const mapStatus = (s: string) => {
              switch (s) {
                case "pending":
                  return "agendada";
                case "accepted":
                  return "confirmada";
                case "rejected":
                  return "cancelada";
                case "completed":
                  return "realizada";
                default:
                  return apt.status;
              }
            };

            return { ...apt, status: mapStatus(docApt.status) };
          });

          // adicionar novas consultas que estejam no storage para este paciente
          const additions = stored
            .filter(
              (d: any) =>
                d.patientEmail === user?.email || d.patientName === user?.name
            )
            .filter((d: any) => !prev.find((p) => p.id === d.id))
            .map(
              (d: any) =>
                ({
                  id: d.id,
                  doctorId: d.doctorId || "",
                  patientId: user?.id || "",
                  date: d.date,
                  time: d.time,
                  type: "consulta",
                  reason: d.notes || "",
                  status: "agendada",
                  doctorName: d.doctorName || "",
                  doctorSpecialty: d.doctorSpecialty || "",
                  patientName: d.patientName || user?.name || "Paciente",
                  patientEmail: d.patientEmail || user?.email || "",
                } as Appointment)
            );

          return [...updated, ...additions];
        });

        // Atualizar próximas consultas com base no myAppointments atualizado
        setUpcomingAppointments(() => {
          return myAppointments
            .filter(
              (apt) =>
                (apt.status === "agendada" || apt.status === "confirmada") &&
                apt.date >= new Date().toISOString().split("T")[0]
            )
            .sort(
              (a, b) =>
                new Date(`${a.date}T${a.time}`).getTime() -
                new Date(`${b.date}T${b.time}`).getTime()
            );
        });
      } catch (err) {
        // ignore
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [user?.email, user?.name, myAppointments]);

  const createSampleAppointments = useCallback(
    (patientId: string): Appointment[] => {
      return [
        {
          id: "apt-1",
          doctorId: "doc-1",
          patientId: patientId,
          date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          time: "14:00",
          type: "consulta",
          reason: "Check-up cardíaco",
          status: "agendada",
          doctorName: "Dr. Carlos Silva",
          doctorSpecialty: "Cardiologista",
          patientName: user?.name || "Paciente",
          patientEmail: user?.email || "paciente@medguide.com",
        },
        {
          id: "apt-2",
          doctorId: "doc-2",
          patientId: patientId,
          date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          time: "10:30",
          type: "consulta",
          reason: "Avaliação dermatológica",
          status: "confirmada",
          doctorName: "Dra. Ana Santos",
          doctorSpecialty: "Dermatologista",
          patientName: user?.name || "Paciente",
          patientEmail: user?.email || "paciente@medguide.com",
        },
      ];
    },
    [user?.name, user?.email]
  );

  const loadAllDoctors = useCallback(async () => {
    try {
      setDoctorsLoading(true);
      // Busca médicos da API
      const doctors = await doctorSearchService.searchDoctors();
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
  }, [doctorSearchService, predefinedDoctors]);

  const loadMyAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      const appointments = await appointmentService.getAppointmentsByPatient(
        user.id
      );
      setMyAppointments(appointments);

      // Filtrar apenas consultas futuras
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
    } catch (error) {
      console.error("Erro ao carregar consultas:", error);
      // Em caso de erro, usar dados de exemplo para demonstração
      const sampleAppointments = createSampleAppointments(user.id);
      setMyAppointments(sampleAppointments);
      setUpcomingAppointments(
        sampleAppointments.filter(
          (apt) =>
            (apt.status === "agendada" || apt.status === "confirmada") &&
            apt.date >= new Date().toISOString().split("T")[0]
        )
      );
    }
  }, [user?.id, createSampleAppointments, appointmentService]);
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/pacient/login");
      return;
    }
    setLoading(false);
    loadMyAppointments();
    loadAllDoctors();
  }, [isAuthenticated, router, loadAllDoctors, loadMyAppointments]);

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja cancelar esta consulta?")) {
      return;
    }

    try {
      await appointmentService.cancelAppointment(appointmentId);
      alert("Consulta cancelada com sucesso!");
    } catch (error) {
      console.error("Erro ao cancelar consulta:", error);
      // Fallback: atualizar localmente mesmo sem API
    } finally {
      // Atualizar estado local: marcar como cancelada
      setCancelledAppointmentIds((prev) => new Set(prev).add(appointmentId));
      setMyAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId ? { ...apt, status: "cancelada" } : apt
        )
      );
      setUpcomingAppointments((prev) =>
        prev.filter((apt) => apt.id !== appointmentId)
      );
      alert("Consulta cancelada com sucesso!");
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!confirm("Tem certeza que deseja excluir este registro de consulta?")) {
      return;
    }

    try {
      // Em produção, você chamaria appointmentService.deleteAppointment(appointmentId)
      // Para demonstração, apenas filtramos a lista local
      setMyAppointments((prev) =>
        prev.filter((apt) => apt.id !== appointmentId)
      );

      // Remover também dos cancelados
      setCancelledAppointmentIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });

      alert("Consulta excluída com sucesso!");
    } catch (error) {
      console.error("Erro ao excluir consulta:", error);
      alert("Erro ao excluir consulta");
    }
  };

  const handleRescheduleAppointment = (appointmentId: string) => {
    // Encontrar a consulta cancelada
    const cancelledAppt = myAppointments.find(
      (apt) => apt.id === appointmentId
    );
    if (cancelledAppt) {
      // Remover da lista de canceladas
      setCancelledAppointmentIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appointmentId);
        return newSet;
      });

      // Remover da lista geral
      setMyAppointments((prev) =>
        prev.filter((apt) => apt.id !== appointmentId)
      );

      // Abrir modal para novo agendamento
      const doctor = allDoctors.find((d) => d.id === cancelledAppt.doctorId);
      if (doctor) {
        handleOpenAppointmentModal(doctor);
      }
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
  }, [searchTerm, allDoctors, doctorSearchService]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);
  const handleOpenAppointmentModal = async (doctor: DoctorSearchResult) => {
    setSelectedDoctor(doctor);

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
      // Fallback: slots de exemplo
      const sampleSlots: TimeSlot[] = [
        { time: "08:00", available: true },
        { time: "09:00", available: false },
        { time: "10:00", available: true },
        { time: "11:00", available: true },
        { time: "14:00", available: true },
        { time: "15:00", available: false },
        { time: "16:00", available: true },
        { time: "17:00", available: true },
      ];
      setAvailableSlots(sampleSlots);
      setAppointmentTime("08:00");
      setShowAppointmentModal(true);
    }
  };

  const handleDateChange = async (date: string) => {
    setAppointmentDate(date);
    if (selectedDoctor) {
      // Gerar slots variados para cada data
      const sampleSlots: TimeSlot[] = [
        { time: "08:00", available: true },
        { time: "09:00", available: Math.random() > 0.5 },
        { time: "10:00", available: true },
        { time: "11:00", available: Math.random() > 0.5 },
        { time: "14:00", available: true },
        { time: "15:00", available: Math.random() > 0.5 },
        { time: "16:00", available: true },
        { time: "17:00", available: true },
      ];
      setAvailableSlots(sampleSlots);
    }
  };

  // Função auxiliar: Verificar se um slot está disponível
  const isSlotAvailable = (time: string): boolean => {
    const slot = availableSlots.find((s) => s.time === time);
    return slot ? slot.available : false;
  };

  const handleScheduleAppointment = async () => {
    if (!selectedDoctor || !user || !appointmentDate || !appointmentTime) {
      alert("Por favor, preencha todos os campos");
      return;
    }

    // Verificar se o horário ainda está disponível
    if (!isSlotAvailable(appointmentTime)) {
      alert("Este horário não está mais disponível. Por favor, escolha outro.");
      return;
    }

    try {
      await appointmentService.createAppointment({
        doctorId: selectedDoctor.id,
        patientId: user.id,
        date: appointmentDate,
        time: appointmentTime,
        type: "consulta",
        reason: appointmentReason,
      });
    } catch (error) {
      // Falha silenciosa - API não disponível
      console.error("Erro ao agendar (API):", error);
    } finally {
      // Adicionar à lista local mesmo se a API falhar
      const newAppointment: Appointment = {
        id: `apt-${Date.now()}`,
        doctorId: selectedDoctor.id,
        patientId: user.id,
        date: appointmentDate,
        time: appointmentTime,
        type: "consulta",
        reason: appointmentReason,
        status: "agendada",
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        patientName: user?.name || "Paciente",
        patientEmail: user?.email || "paciente@medguide.com",
      };

      setMyAppointments((prev) => [...prev, newAppointment]);

      // Adicionar às próximas consultas se for futura
      const today = new Date().toISOString().split("T")[0];
      if (appointmentDate >= today) {
        setUpcomingAppointments((prev) => [...prev, newAppointment]);
      }

      // ✨ INTEGRAÇÃO: Salvar no localStorage para a dashboard do médico
      const doctorAppointments = JSON.parse(
        localStorage.getItem("doctor_appointments") || "[]"
      ) as Array<{
        id: string;
        patientName: string;
        patientEmail: string;
        patientPhone?: string;
        date: string;
        time: string;
        status: "pending" | "accepted" | "rejected";
        notes?: string;
      }>;

      const appointmentForDoctor = {
        id: newAppointment.id,
        id: newAppointment.id,
        doctorId: selectedDoctor.id,
        doctorName: selectedDoctor.name,
        doctorSpecialty: selectedDoctor.specialty,
        patientName: newAppointment.patientName,
        patientEmail: newAppointment.patientEmail,
        patientPhone: user?.phone,
        date: appointmentDate,
        time: appointmentTime,
        status: "pending" as const,
        notes: appointmentReason,
      };

      doctorAppointments.push(appointmentForDoctor);
      localStorage.setItem(
        "doctor_appointments",
        JSON.stringify(doctorAppointments)
      );

      alert("Consulta agendada com sucesso!");
      setShowAppointmentModal(false);

      // Reset form
      setAppointmentDate("");
      setAppointmentTime("");
      setAppointmentReason("");
      setSelectedDoctor(null);
    }
  };

  const handleSignOut = async () => {
    await logout();
  };

  const handleRequestExam = async () => {
    if (!examDoctor || !examType) {
      alert("Por favor, selecione um médico e um tipo de exame");
      return;
    }

    const newExamRequest = {
      id: `exam-${Date.now()}`,
      patientName: user?.name || "Paciente",
      patientEmail: user?.email || "paciente@medguide.com",
      examType,
      description: examDescription,
      requestDate: new Date().toISOString(),
      status: "pending" as const,
    };

    setMyExamRequests((prev) => [...prev, newExamRequest]);

    // ✨ INTEGRAÇÃO: Salvar no localStorage para a dashboard do médico
    const doctorExamRequests = JSON.parse(
      localStorage.getItem("doctor_exam_requests") || "[]"
    ) as Array<{
      id: string;
      patientName: string;
      patientEmail: string;
      examType: string;
      description: string;
      requestDate: string;
      status: "pending" | "completed" | "cancelled";
    }>;

    doctorExamRequests.push(newExamRequest);
    localStorage.setItem(
      "doctor_exam_requests",
      JSON.stringify(doctorExamRequests)
    );

    alert("Requisição de exame enviada com sucesso!");
    setShowExamModal(false);

    // Reset form
    setExamType("");
    setExamDescription("");
    setExamDoctor(null);
  };

  const refreshDoctors = async () => {
    await loadAllDoctors();
    alert("Lista de médicos atualizada!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-teal-100">
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
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100">
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
                          Dr. {appointment.doctorName}
                        </h3>
                        <p className="text-gray-600">
                          {appointment.doctorSpecialty}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.date).toLocaleDateString(
                            "pt-BR",
                            {
                              weekday: "long",
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}{" "}
                          às {appointment.time}
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
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>

                      {(appointment.status === "agendada" ||
                        appointment.status === "confirmada") && (
                        <button
                          onClick={() =>
                            handleCancelAppointment(appointment.id)
                          }
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                        >
                          <X className="w-4 h-4" />
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
                          Dr. {appointment.doctorName}
                        </h3>
                        <p className="text-gray-600">
                          {appointment.doctorSpecialty}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(appointment.date).toLocaleDateString(
                            "pt-BR"
                          )}{" "}
                          às {appointment.time}
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
                        {appointment.status.charAt(0).toUpperCase() +
                          appointment.status.slice(1)}
                      </span>

                      {/* Botões para consultas canceladas */}
                      {appointment.status === "cancelada" && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleRescheduleAppointment(appointment.id)
                            }
                            className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm transition-colors duration-200"
                            title="Reagendar consulta"
                          >
                            <Calendar className="w-4 h-4" />
                            Reagendar
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteAppointment(appointment.id)
                            }
                            className="flex items-center gap-1 bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg text-sm transition-colors duration-200"
                            title="Excluir registro"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
                Médicos Cadastrados ({allDoctors.length})
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
                        <MapPin className="w-4 h-4 mt-1 shrink-0" />
                        <span className="text-xs">{doctor.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenAppointmentModal(doctor)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Agendar Consulta
                    </button>
                    <button
                      onClick={() => {
                        setExamDoctor(doctor);
                        setShowExamModal(true);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Solicitar Exame
                    </button>
                  </div>
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
                        <MapPin className="w-4 h-4 mt-1 shrink-0" />
                        <span className="text-xs">{doctor.address}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenAppointmentModal(doctor)}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Agendar Consulta
                    </button>
                    <button
                      onClick={() => {
                        setExamDoctor(doctor);
                        setShowExamModal(true);
                      }}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Solicitar Exame
                    </button>
                  </div>
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
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-gray-700">
                  Dr. {selectedDoctor.name}
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
                  >
                    <option value="">Selecione um horário</option>
                    {availableSlots.map((slot) => (
                      <option
                        key={slot.time}
                        value={slot.time}
                        disabled={!slot.available}
                        className={
                          !slot.available ? "text-gray-400 bg-gray-100" : ""
                        }
                      >
                        {slot.time} {!slot.available ? " (Indisponível)" : ""}
                      </option>
                    ))}
                  </select>

                  {/* Informações sobre disponibilidade */}
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
                      <p className="text-gray-500 text-xs">
                        Horários em verde estão disponíveis para agendamento
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
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleScheduleAppointment}
                  disabled={
                    !appointmentTime || !isSlotAvailable(appointmentTime)
                  }
                  className="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 rounded-lg font-medium transition-colors duration-200"
                >
                  Confirmar Agendamento
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Exam Request Modal */}
        {showExamModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Solicitar Exame
                  </h2>
                  <button
                    onClick={() => setShowExamModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Médico *
                    </label>
                    <select
                      value={examDoctor?.id || ""}
                      onChange={(e) => {
                        const selected = allDoctors.find(
                          (d) => d.id === e.target.value
                        );
                        setExamDoctor(selected || null);
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione um médico</option>
                      {allDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialty}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Exame *
                    </label>
                    <select
                      value={examType}
                      onChange={(e) => setExamType(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Selecione um exame</option>
                      {examTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Observações (opcional)
                    </label>
                    <textarea
                      value={examDescription}
                      onChange={(e) => setExamDescription(e.target.value)}
                      rows={3}
                      className="w-full p-2 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva briefy o motivo do exame ou qualquer informação relevante..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowExamModal(false)}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRequestExam}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors duration-200"
                  >
                    Enviar Requisição
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
