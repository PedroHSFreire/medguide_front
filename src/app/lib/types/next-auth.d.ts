// types/next-auth.d.ts - VERSÃO COMPLETA
import NextAuth from "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
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

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      cpf?: string;
      crm?: string;
      specialty?: string;
      phone?: string;
      address?: string;
      experience?: string;
      education?: string;
      bio?: string;
    };
    accessToken?: string;
    role?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    user?: {
      id: string;
      email: string;
      name: string;
      role: string;
      accessToken?: string;
      cpf?: string;
      crm?: string;
      specialty?: string;
    };
    accessToken?: string;
    role?: string;
  }
}
