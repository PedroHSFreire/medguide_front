// lib/auth.ts - VERSÃO SIMPLIFICADA E CORRIGIDA
import NextAuth, {
  type NextAuthOptions,
  User as NextAuthUser,
} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://medguide-y0j4.onrender.com";

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

type ApiResponse = {
  success?: boolean;
  data?: {
    pacient?: { id?: string; email?: string; name?: string; cpf?: string };
    doctor?: {
      id?: string;
      email?: string;
      name?: string;
      CRM?: string;
      specialty?: string;
    };
    id?: string;
    email?: string;
    name?: string;
    cpf?: string;
    token?: string;
  };
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
          // Tenta login como PACIENTE
          // O backend pode esperar { email, password } ou { cpf, password }.
          const loginValue = String(credentials.login).trim();

          const tryPacientLogin = async (
            payload: Record<string, unknown>
          ): Promise<ApiResponse | null> => {
            const res = await fetch(`${API_BASE_URL}/pacient/login`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              // tenta ler corpo para ajudar no debug
              const text = await res.text().catch(() => "");
              console.warn(
                `[auth] /pacient/login -> status=${res.status} body=${text}`
              );
              return null;
            }

            const data = (await res
              .json()
              .catch(() => null)) as ApiResponse | null;
            if (data && (data.success || data.data)) return data;
            return null;
          };

          // 1) se for email, tente { email, password }
          let pacientData: ApiResponse | null = null;
          if (loginValue.includes("@")) {
            pacientData = await tryPacientLogin({
              email: loginValue,
              password: credentials.password,
            });
          }

          // 2) se parecer CPF (apenas dígitos), tente { cpf, password }
          if (!pacientData) {
            const onlyDigits = loginValue.replace(/\D/g, "");
            if (onlyDigits.length === 11) {
              pacientData = await tryPacientLogin({
                cpf: onlyDigits,
                password: credentials.password,
              });
            }
          }

          // 3) fallback: tente { login, password } (compatibilidade)
          if (!pacientData) {
            pacientData = await tryPacientLogin({
              login: loginValue,
              password: credentials.password,
            });
          }

          if (pacientData) {
            return {
              id: String(
                pacientData.data?.pacient?.id || pacientData.data?.id || ""
              ),
              email: String(
                pacientData.data?.pacient?.email ||
                  pacientData.data?.email ||
                  ""
              ),
              name: String(
                pacientData.data?.pacient?.name || pacientData.data?.name || ""
              ),
              cpf: String(
                pacientData.data?.pacient?.cpf || pacientData.data?.cpf || ""
              ),
              role: "pacient",
              accessToken: String(pacientData.data?.token || ""),
            } as unknown as NextAuthUser;
          }

          // Tenta login como MÉDICO
          const doctorResponse = await fetch(`${API_BASE_URL}/doctor/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              login: credentials.login,
              password: credentials.password,
            }),
          });

          if (doctorResponse.ok) {
            const doctorData = (await doctorResponse
              .json()
              .catch(() => null)) as ApiResponse | null;
            if (doctorData && doctorData.data) {
              const dd = doctorData.data as ApiResponse["data"] | undefined;
              return {
                id: String(dd?.doctor?.id || dd?.id || ""),
                email: String(dd?.doctor?.email || dd?.email || ""),
                name: String(dd?.doctor?.name || dd?.name || ""),
                role: "doctor",
                accessToken: String(dd?.token || ""),
              } as unknown as NextAuthUser;
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
      // ✅ CORREÇÃO: Sem `any` - usando type assertion com CustomUser
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
    signIn: "/pacient/login",
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
