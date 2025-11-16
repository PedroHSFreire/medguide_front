const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

type RegisterPayload = {
  name: string;
  email: string;
  cpf: string;
  password: string;
};

export default class PacientService {
  baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl ?? (API_BASE_URL || "");
  }

  private async tryFetch(path: string, init: RequestInit) {
    const url = this.baseUrl ? `${this.baseUrl}${path}` : path;
    try {
      const res = await fetch(url, init);
      const json = await res.json().catch(() => null);
      return { ok: res.ok, status: res.status, data: json };
    } catch {
      return { ok: false, status: 0, data: null };
    }
  }

  async registerPacient(payload: RegisterPayload) {
    const result = await this.tryFetch("/pacient/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (result.ok) return { data: result.data };

    type ApiError = Error & {
      response?: { status: number; data: unknown };
    };
    const error = new Error("Erro ao registrar paciente") as ApiError;
    error.response = { status: result.status, data: result.data };
    throw error;
  }

  async updateProfile(data: Partial<RegisterPayload>) {
    const result = await this.tryFetch("/pacient/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (result.ok) return { data: result.data };

    type ApiError = Error & { response?: { status: number; data: unknown } };
    const error = new Error("Erro ao atualizar perfil") as ApiError;
    error.response = { status: result.status, data: result.data };
    throw error;
  }
}
