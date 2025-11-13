// hooks/useAuth.tsx - VERSÃO CORRIGIDA
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, getSession } from "next-auth/react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "pacient" | "doctor";
  cpf?: string;
  crm?: string;
  specialty?: string;
  phone?: string;
  address?: string;
  experience?: string;
  education?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (
    login: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      setLoading(true);
      const session = await getSession();

      if (session?.user && session.accessToken) {
        const userData: User = {
          id: session.user.id || "",
          name: session.user.name || "",
          email: session.user.email || "",
          role: (session.role as "pacient" | "doctor") || "pacient",
          cpf: session.user.cpf,
          crm: session.user.crm,
          specialty: session.user.specialty,
          phone: session.user.phone,
          address: session.user.address,
          experience: session.user.experience,
          education: session.user.education,
          bio: session.user.bio,
        };

        setUser(userData);
        setToken(session.accessToken);

        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", session.accessToken);
      } else {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        } else {
          setUser(null);
          setToken(null);
        }
      }
    } catch (error) {
      console.error("Erro ao verificar autenticação:", error);
      setUser(null);
      setToken(null);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (
    login: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);

      const result = await signIn("credentials", {
        login,
        password,
        redirect: false,
      });

      if (result?.error) {
        return {
          success: false,
          error:
            result.error === "CredentialsSignin"
              ? "Credenciais inválidas"
              : result.error,
        };
      }

      if (result?.ok) {
        // Aguardar um pouco para a sessão ser estabelecida
        await new Promise((resolve) => setTimeout(resolve, 500));
        await checkAuth();

        return { success: true };
      }

      return {
        success: false,
        error: "Erro desconhecido no login",
      };
    } catch (error) {
      console.error("Erro no login:", error);
      return {
        success: false,
        error: "Erro de conexão",
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);

      // Limpar estado local
      setUser(null);
      setToken(null);

      // Limpar localStorage
      localStorage.removeItem("user");
      localStorage.removeItem("token");

      // Fazer logout no NextAuth
      await signOut({
        redirect: false,
        callbackUrl: "/pacient/login",
      });

      router.push("/pacient/login");
    } catch (error) {
      console.error("Erro no logout:", error);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    checkAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}
