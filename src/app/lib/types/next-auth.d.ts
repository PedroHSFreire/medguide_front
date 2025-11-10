// types/next-auth.d.ts - VERSÃO CORRIGIDA
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    role?: string;
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      cpf?: string;
      crm?: string;
      specialty?: string;
      phone?: string;
      address?: string;
      experience?: string;
      education?: string;
      bio?: string;
    };
  }

  interface User {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    accessToken?: string;
    cpf?: string;
    crm?: string;
    specialty?: string;
    phone?: string;
    address?: string;
    experience?: string;
    education?: string;
    bio?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: string;
    user?: {
      id: string;
      name?: string | null;
      email?: string | null;
      cpf?: string;
      crm?: string;
      specialty?: string;
      phone?: string;
      address?: string;
      experience?: string;
      education?: string;
      bio?: string;
      role?: string;
    };
  }
}
