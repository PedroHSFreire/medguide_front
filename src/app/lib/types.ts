import "next-auth";
import "next-auth/jwt";
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    role?: string;
    user: {
      id: string;
      name: string;
      email: string;
      cpf?: string;
      crm?: number;
      specialty?: string;
    };
  }

  interface User {
    id: string;
    name: string;
    email: string;
    accessToken: string;
    role: string;
    cpf?: string;
    crm?: number;
    specialty?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: string;
    user?: {
      id: string;
      name: string;
      email: string;
      cpf?: string;
      crm?: number;
      specialty?: string;
      role: string;
    };
  }
}
