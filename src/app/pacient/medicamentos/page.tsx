"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Clock,
  Loader2,
  Pencil,
  Pill,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "../../lib/hooks/useAuth";
import { useMedications } from "../../lib/hooks/useMedications";
import type { Medication } from "../../lib/types/medications";

type FormState = {
  name: string;
  dosage: string;
  times: string[];
  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  dosage: "",
  times: ["08:00"],
  active: true,
});

export default function MedicamentosPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const {
    medications,
    loading,
    error: medsError,
    create,
    update,
    toggleActive,
    remove,
  } = useMedications(Boolean(isAuthenticated && user));

  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.push("/pacient/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
    setFormError(null);
  };

  const startEdit = (med: Medication) => {
    setEditingId(med.id);
    setForm({
      name: med.name,
      dosage: med.dosage || "",
      times: med.times.length ? [...med.times] : ["08:00"],
      active: med.active,
    });
    setFormError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError(null);
    setActionMessage(null);

    const name = form.name.trim();
    const times = form.times.map((t) => t.trim()).filter(Boolean);

    if (!name) {
      setFormError("Informe o nome do medicamento.");
      return;
    }
    if (!times.length) {
      setFormError("Adicione pelo menos um horário.");
      return;
    }
    if (times.some((t) => !/^\d{2}:\d{2}$/.test(t))) {
      setFormError("Use horários no formato HH:mm.");
      return;
    }

    setSaving(true);
    try {
      const body = {
        name,
        dosage: form.dosage.trim() || undefined,
        times,
        active: form.active,
      };

      if (editingId) {
        await update(editingId, body);
        setActionMessage("Medicamento atualizado.");
      } else {
        await create(body);
        setActionMessage("Medicamento cadastrado.");
      }
      resetForm();
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Não foi possível salvar"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (med: Medication) => {
    setActionMessage(null);
    try {
      await toggleActive(med.id, !med.active);
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Falha ao atualizar status"
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remover este medicamento?")) return;
    setActionMessage(null);
    try {
      await remove(id);
      if (editingId === id) resetForm();
      setActionMessage("Medicamento removido.");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Falha ao remover medicamento"
      );
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-teal-100">
      <header className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={() => router.push("/pacient/dashboard")}
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar ao dashboard
              </button>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Pill className="w-8 h-8 text-blue-600" />
                Medicamentos
              </h1>
              <p className="text-gray-600 mt-1">
                Cadastre medicamentos e horários de uso.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {editingId ? "Editar medicamento" : "Novo medicamento"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm text-gray-700">Nome</span>
                <input
                  value={form.name}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Ex: Losartana"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm text-gray-700">Dosagem (opcional)</span>
                <input
                  value={form.dosage}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, dosage: e.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2"
                  placeholder="Ex: 50mg / 1 comprimido"
                />
              </label>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700 flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Horários
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      times: [...prev.times, "12:00"],
                    }))
                  }
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Horário
                </button>
              </div>
              <div className="flex flex-wrap gap-3">
                {form.times.map((time, index) => (
                  <div key={`${index}-${time}`} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) =>
                        setForm((prev) => {
                          const times = [...prev.times];
                          times[index] = e.target.value;
                          return { ...prev, times };
                        })
                      }
                      className="rounded-lg border border-gray-300 px-3 py-2"
                    />
                    {form.times.length > 1 && (
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            times: prev.times.filter((_, i) => i !== index),
                          }))
                        }
                        className="text-red-600 hover:text-red-800"
                        aria-label="Remover horário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, active: e.target.checked }))
                }
              />
              Ativo
            </label>

            {(formError || medsError) && (
              <p className="text-red-600 text-sm">{formError || medsError}</p>
            )}
            {actionMessage && (
              <p className="text-green-700 text-sm">{actionMessage}</p>
            )}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                {saving
                  ? "Salvando..."
                  : editingId
                    ? "Salvar alterações"
                    : "Cadastrar"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800"
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Seus medicamentos
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              Carregando...
            </div>
          ) : medications.length === 0 ? (
            <p className="text-gray-600">Nenhum medicamento cadastrado ainda.</p>
          ) : (
            <ul className="space-y-3">
              {medications.map((med) => (
                <li
                  key={med.id}
                  className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div>
                    <p className="font-semibold text-gray-900">{med.name}</p>
                    {med.dosage && (
                      <p className="text-sm text-gray-600">{med.dosage}</p>
                    )}
                    <p className="text-sm text-gray-700 mt-1">
                      {med.times.join(" · ")}
                      {!med.active && (
                        <span className="ml-2 text-amber-700">(pausado)</span>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleToggle(med)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 hover:bg-gray-200"
                    >
                      {med.active ? "Pausar" : "Reativar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(med)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(med.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg text-red-700 border border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Apagar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
