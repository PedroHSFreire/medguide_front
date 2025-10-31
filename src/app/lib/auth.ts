// auth.ts - Versão com debug completo
import NextAuth, { type NextAuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

interface Credentials {
  login: string;
  password: string;
}

const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        login: { label: "Email ou CPF", type: "text" },
        password: { label: "Senha", type: "password" },
      },
      async authorize(credentials): Promise<User | null> {
        console.log(" authorize chamado com:", credentials);

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
        ];
        const hardcodedUser = hardcodedUsers.find(
          (user) =>
            user.login === credentials.login &&
            user.password === credentials.password
        );
        if (hardcodedUser) {
          console.log(
            "Login programado bem-sucedido:",
            hardcodedUser.user.email
          );
          return hardcodedUser.user;
        }
        if (!credentials?.login || !credentials?.password) {
          console.log(" Credenciais faltando");
          return null;
        }

        try {
          // Tenta login como PACIENTE
          console.log(" Tentando login como paciente...");
          const pacientResponse = await fetch(
            "https://medguide-y0j4.onrender.com/api/pacient/login",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                login: credentials.login,
                password: credentials.password,
              }),
            }
          );

          console.log(" Resposta paciente - Status:", pacientResponse.status);

          if (pacientResponse.ok) {
            const pacientData = await pacientResponse.json();
            console.log(" Dados paciente:", pacientData);

            if (pacientData.success && pacientData.data) {
              console.log("Login paciente bem-sucedido");
              return {
                id: pacientData.data.pacient?.id || pacientData.data.id,
                email:
                  pacientData.data.pacient?.email || pacientData.data.email,
                name: pacientData.data.pacient?.name || pacientData.data.name,
                cpf: pacientData.data.pacient?.cpf || pacientData.data.cpf,
                role: "pacient",
                accessToken: pacientData.data.token,
              };
            } else {
              console.log(" Paciente: success=false ou data faltando");
            }
          } else {
            console.log("Erro HTTP paciente:", pacientResponse.status);
          }

          // Tenta login como MÉDICO
          console.log("🔄 Tentando login como médico...");
          const doctorResponse = await fetch(
            "https://medguide-y0j4.onrender.com/api/doctor/login",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                login: credentials.login,
                password: credentials.password,
              }),
            }
          );

          console.log("📊 Resposta médico - Status:", doctorResponse.status);

          if (doctorResponse.ok) {
            const doctorData = await doctorResponse.json();
            console.log("📦 Dados médico:", doctorData);

            if (doctorData.success && doctorData.data) {
              console.log("✅ Login médico bem-sucedido");
              return {
                id: doctorData.data.doctor?.id || doctorData.data.id,
                email: doctorData.data.doctor?.email || doctorData.data.email,
                name: doctorData.data.doctor?.name || doctorData.data.name,
                crm: doctorData.data.doctor?.CRM || doctorData.data.CRM,
                specialty:
                  doctorData.data.doctor?.specialty ||
                  doctorData.data.specialty,
                role: "doctor",
                accessToken: doctorData.data.token,
              };
            } else {
              console.log("❌ Médico: success=false ou data faltando");
            }
          } else {
            console.log("❌ Erro HTTP médico:", doctorResponse.status);
          }

          console.log("❌ Ambos os logins falharam");
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
      console.log(" jwt callback - user:", user);
      if (user) {
        token.user = {
          id: user.id,
          name: user.name,
          email: user.email,
          cpf: user.cpf,
          crm: user.crm,
          specialty: user.specialty,
          role: user.role,
        };
        token.accessToken = user.accessToken;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log(" session callback - token:", token);
      if (token.user) {
        session.user = {
          id: token.user.id,
          name: token.user.name,
          email: token.user.email,
          cpf: token.user.cpf,
          crm: token.user.crm,
          specialty: token.user.specialty,
        };
        session.accessToken = token.accessToken;
        session.role = token.role;
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
  debug: true,
};

export default NextAuth(authOptions);

export const { auth, signIn, signOut } = NextAuth(authOptions);
