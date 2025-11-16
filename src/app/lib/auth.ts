// lib/auth.ts - VERSÃO CORRIGIDA E FUNCIONAL
import NextAuth, {
  type NextAuthOptions,
  User as NextAuthUser,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface CustomUser extends NextAuthUser {
  role: string;
  accessToken: string;
  cpf?: string;
  crm?: string;
  specialty?: string;
  phone?: string;
  address?: string;
  experience?: string;
  education?: string;
  bio?: string;
}
interface BaseUserInfo {
  id?: string;
  email?: string;
  name?: string;
}
interface PackentUserInfo extends BaseUserInfo {
  crm?: string;
  specialty?: string;
}

type ApiResponse = {
  success?: boolean;
  data?: {
    pacient?: {
      id?: string;
      email?: string;
      name?: string;
      cpf?: string;
      token?: string;
    };
    doctor?: {
      id?: string;
      email?: string;
      name?: string;
      CRM?: string;
      specialty?: string;
      token?: string;
    };
    id?: string;
    email?: string;
    name?: string;
    cpf?: string;
    token?: string;
  };
  token?: string;
  message?: string;
};

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

        // 1. Primeiro verifica usuários pré-programados
        const hardcodedUser = hardcodedUsers.find(
          (user) =>
            user.login === credentials?.login &&
            user.password === credentials?.password
        );

        if (hardcodedUser) {
          console.log("✅ Login pré-programado bem-sucedido");
          return hardcodedUser.user as unknown as NextAuthUser;
        }

        if (!credentials?.login || !credentials?.password) {
          throw new Error("Email/CPF e senha são obrigatórios");
        }

        try {
          // 🔥 CORREÇÃO: Função simplificada para login de paciente
          const tryPacientLogin = async (): Promise<ApiResponse | null> => {
            try {
              console.log("🔄 Tentando login paciente...");
              const response = await fetch(`${API_BASE_URL}/pacient/login`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  login: credentials!.login, // ← ENVIA COMO "login"
                  password: credentials!.password,
                }),
              });

              console.log("📊 Status da resposta:", response.status);

              if (!response.ok) {
                const errorText = await response.text();
                console.log("❌ Login paciente falhou:", errorText);
                return null;
              }

              const data = await response.json();
              console.log("✅ Resposta do login paciente:", data);
              return data;
            } catch (error) {
              console.error("💥 Erro no login paciente:", error);
              return null;
            }
          };

          // 🔥 CORREÇÃO: Função simplificada para login de médico
          const tryDoctorLogin = async (): Promise<ApiResponse | null> => {
            try {
              console.log("🔄 Tentando login médico...");
              const response = await fetch(`${API_BASE_URL}/doctor/login`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  login: credentials!.login, // ← ENVIA COMO "login"
                  password: credentials!.password,
                }),
              });

              console.log("📊 Status da resposta médico:", response.status);

              if (!response.ok) {
                const errorText = await response.text();
                console.log("❌ Login médico falhou:", errorText);
                return null;
              }

              const data = await response.json();
              console.log("✅ Resposta do login médico:", data);
              return data;
            } catch (error) {
              console.error("💥 Erro no login médico:", error);
              return null;
            }
          };

          // 🔥 CORREÇÃO: Tenta primeiro como paciente
          let userData: ApiResponse | null = await tryPacientLogin();

          // Se paciente falhou, tenta como médico
          if (!userData || !userData.success) {
            console.log("🔄 Tentando como médico...");
            userData = await tryDoctorLogin();
          }

          // Se algum login funcionou
          if (userData && userData.success) {
            console.log("✅ Login bem-sucedido no backend");

            // Determina se é paciente ou médico
            const isPacient = !!userData.data?.pacient;
            const userInfo = isPacient
              ? userData.data?.pacient
              : userData.data?.doctor;

            if (userInfo) {
              const user = userInfo as PackentUserInfo;
              return {
                id: user.id || "",
                email: user.email || "",
                name: user.name || "",
                role: isPacient ? "pacient" : "doctor",
                accessToken:
                  userData.data?.token || userData.token || "default-token",
                ...(isPacient && {
                  crm: user.crm || "",
                  specialty: user.specialty || "",
                }),
              } as NextAuthUser;
            }
          }

          console.log("❌ Todas as tentativas de login falharam");
          return null;
        } catch (error) {
          console.error("🚨 Erro crítico no authorize:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const customUser = user as CustomUser;

        token.user = {
          id: customUser.id || "",
          email: customUser.email || "",
          name: customUser.name || "",
          role: customUser.role || "pacient",
          accessToken: customUser.accessToken || "",
          cpf: customUser.cpf,
          crm: customUser.crm,
          specialty: customUser.specialty,
        };

        token.accessToken = customUser.accessToken;
        token.role = customUser.role;
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
    signIn: "/pacient/login", // ← CORRIGIDO: URL do frontend
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 dias
  },

  debug: process.env.NODE_ENV === "development",
};

export default NextAuth(authOptions);
