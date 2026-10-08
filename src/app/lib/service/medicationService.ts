import type {
  CreateMedicationBody,
  Medication,
  UpdateMedicationBody,
} from "../types/medications";

class MedicationService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  }

  private getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem("token");
    }
    return null;
  }

  private async request<T>(
    path: string,
    init: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && "message" in data
          ? String((data as { message: unknown }).message)
          : null) || `Erro na requisição (${res.status})`;
      throw new Error(message);
    }

    return data as T;
  }

  async list(): Promise<Medication[]> {
    const data = await this.request<Medication[] | { medications: Medication[] }>(
      "/api/medications"
    );
    if (Array.isArray(data)) return data;
    return data.medications ?? [];
  }

  async create(body: CreateMedicationBody): Promise<Medication> {
    return this.request<Medication>("/api/medications", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async update(id: string, body: UpdateMedicationBody): Promise<Medication> {
    return this.request<Medication>(`/api/medications/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async remove(id: string): Promise<void> {
    await this.request<unknown>(`/api/medications/${id}`, {
      method: "DELETE",
    });
  }
}

export const medicationService = new MedicationService();
