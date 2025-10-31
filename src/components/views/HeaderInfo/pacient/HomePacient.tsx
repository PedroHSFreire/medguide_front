"use client";

import {
  User,
  LogOut,
  Search,
  Stethoscope,
  MapPin,
  Phone,
  Mail,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Interface para o médico
interface Doctor {
  id: string;
  name: string;
  specialty: string;
  crm: string;
  email: string;
  phone: string;
  address: string;
  image?: string;
}

export default function HomePacient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Doctor[]>([]);

  // Médico pré-cadastrado fixo
  const preCadastradoDoctor: Doctor = {
    id: "1",
    name: "Dr. Carlos Alberto Silva",
    specialty: "Cardiologista",
    crm: "CRM/SP 123.456",
    email: "carlos.silva@cardiohealth.com.br",
    phone: "(11) 99999-1234",
    address: "Av. Paulista, 1578 - Jardim Paulista, São Paulo - SP, 01310-200",
  };

  const allDoctors: Doctor[] = [
    preCadastradoDoctor,
    {
      id: "2",
      name: "Dra. Maria Santos Oliveira",
      specialty: "Dermatologista",
      crm: "CRM/SP 789.012",
      email: "maria.oliveira@dermacare.com.br",
      phone: "(11) 98888-5678",
      address: "Rua Augusta, 267 - Consolação, São Paulo - SP, 01304-000",
    },
    {
      id: "3",
      name: "Dr. Pedro Henrique Costa",
      specialty: "Ortopedista",
      crm: "CRM/SP 345.678",
      email: "pedro.costa@ortocenter.com.br",
      phone: "(11) 97777-9012",
      address: "Al. Santos, 987 - Cerqueira César, São Paulo - SP, 01418-100",
    },
  ];

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/pacient/login");
      return;
    }
  }, [session, status, router]);

  // Função para buscar médicos
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const filteredDoctors = allDoctors.filter(
      (doctor) =>
        doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doctor.crm.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setSearchResults(filteredDoctors);
  };

  // Busca automática ao digitar
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleSignOut = async () => {
    await signOut({
      callbackUrl: "/pacient/login",
      redirect: true,
    });
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-teal-100">
      {/* Header do Dashboard */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Painel do Paciente
              </h1>
              <p className="text-gray-600">Bem-vindo, {session.user?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
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

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Barra de Pesquisa */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            Buscar Médicos
          </h2>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar por nome do médico, especialidade ou CRM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-black pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={handleSearch}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Médico Pré-Cadastrado (Sempre Visível) */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">
            Seu Médico Pré-Cadastrado
          </h2>
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-xl p-6 border border-blue-200">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex shrink-0">
                <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto">
                  <Stethoscope className="w-12 h-12 text-white" />
                </div>
              </div>

              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">
                      {preCadastradoDoctor.name}
                    </h3>
                    <p className="text-lg text-blue-600 font-semibold">
                      {preCadastradoDoctor.specialty}
                    </p>
                    <p className="text-gray-600">{preCadastradoDoctor.crm}</p>
                  </div>
                  <div className="mt-4 md:mt-0">
                    <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200">
                      Agendar Consulta
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">
                      {preCadastradoDoctor.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">
                      {preCadastradoDoctor.email}
                    </span>
                  </div>
                  <div className="flex items-start gap-3 md:col-span-2">
                    <MapPin className="w-5 h-5 text-blue-500 mt-1 flex-shrink-0" />
                    <span className="text-gray-700">
                      {preCadastradoDoctor.address}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Resultados da Busca */}
        {searchResults.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Resultados da Busca ({searchResults.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <p className="text-xs text-gray-500">{doctor.crm}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>{doctor.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{doctor.email}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                      <span className="text-xs">{doctor.address}</span>
                    </div>
                  </div>
                  <button className="w-full mt-4 bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg font-medium transition-colors duration-200">
                    Agendar Consulta
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensagem quando não há resultados */}
        {searchTerm && searchResults.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
            <p className="text-gray-600">
              Nenhum médico encontrado para "{searchTerm}"
            </p>
          </div>
        )}

        {/* Conteúdo Original */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="text-center py-8">
            <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <User className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Olá, {session.user?.name}!
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Seu painel de saúde está pronto para uso.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Consultas</h3>
                <p className="text-blue-600">Agende suas consultas</p>
              </div>
              <div className="bg-green-50 p-6 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Exames</h3>
                <p className="text-green-600">Acompanhe seus exames</p>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg">
                <h3 className="font-semibold text-purple-800 mb-2">
                  Histórico
                </h3>
                <p className="text-purple-600">Ver seu histórico médico</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
