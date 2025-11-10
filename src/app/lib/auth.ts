// lib/auth.ts - VERSÃO SIMPLIFICADA E CORRIGIDA
import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Configuração da URL da API
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://medguide-y0j4.onrender.com";

// Usuários pré-programados para demo
const hardcodedUsers = [
  {
    login: "demo@medguide.com",
    password: "demo123",
    user: {
      id: "demo-user-123",
      email: "demo@medguide.com",
      name: "Usuário Demo",
      role: "pacient",
      accessToken: "demo-token-123456",
      cpf: "123.456.789-00",
    },
  },
  {
    login: "doctor@medguide.com",
    password: "doctor123",
    user: {
      id: "demo-doctor-456",
      email: "doctor@medguide.com",
      name: "Dr. Carlos Silva",
      role: "doctor",
      accessToken: "demo-token-doctor-456",
      crm: "CRM/SP 123.456",
      specialty: "Cardiologista",
    },
  },
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Email ou CPF", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Tentando autenticação para:", credentials?.login);

        // Verifica usuários pré-programados primeiro
        const hardcodedUser = hardcodedUsers.find(
          (user) =>
            user.login === credentials?.login &&
            user.password === credentials?.password
        );

        if (hardcodedUser) {
          console.log("✅ Login pré-programado bem-sucedido");
          return hardcodedUser.user;
        }

        if (!credentials?.login || !credentials?.password) {
          throw new Error("Email/CPF e senha são obrigatórios");
        }

        try {
          // Tenta login como PACIENTE
          const pacientResponse = await fetch(
            `${API_BASE_URL}/api/pacient/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                login: credentials.login,
                password: credentials.password,
              }),
            }
          );

          if (pacientResponse.ok) {
            const pacientData = await pacientResponse.json();
            if (pacientData.success && pacientData.data) {
              return {
                id: pacientData.data.pacient?.id || pacientData.data.id,
                email:
                  pacientData.data.pacient?.email || pacientData.data.email,
                name: pacientData.data.pacient?.name || pacientData.data.name,
                cpf: pacientData.data.pacient?.cpf || pacientData.data.cpf,
                role: "pacient",
                accessToken: pacientData.data.token,
              };
            }
          }

          // Tenta login como MÉDICO
          const doctorResponse = await fetch(
            `${API_BASE_URL}/api/doctor/login`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                login: credentials.login,
                password: credentials.password,
              }),
            }
          );

          if (doctorResponse.ok) {
            const doctorData = await doctorResponse.json();
            if (doctorData.success && doctorData.data) {
              return {
                id: doctorData.data.doctor?.id || doctorData.data.id,
                email: doctorData.data.doctor?.email || doctorData.data.email,
                name: doctorData.data.doctor?.name || doctorData.data.name,
                crm: String(doctorData.data.doctor?.CRM || doctorData.data.CRM),
                specialty:
                  doctorData.data.doctor?.specialty ||
                  doctorData.data.specialty,
                role: "doctor",
                accessToken: doctorData.data.token,
              };
            }
          }

          return null;
        } catch (error) {
          console.error("🚨 Erro no authorize:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = user;
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.user) {
        session.user = {
          ...session.user,
          ...token.user,
        };
        session.accessToken = token.accessToken as string;
        session.role = token.role as string;
      }
      return session;
    },
  },

  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  debug: process.env.NODE_ENV === "development",
};

// Exportação CORRETA - apenas isso
export default NextAuth(authOptions);
