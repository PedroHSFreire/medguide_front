"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  AlertCircle,
  CheckCircle2,
  Stethoscope,
  FileText,
  ClipboardList,
  Pill,
  Plus,
  Trash2,
} from "lucide-react";
import type { RecommendedMedication } from "../app/lib/types/prescriptions";

export interface ClinicalRecordFields {
  diagnosis?: string | null;
  prescription?: string | null;
  doctor_notes?: string | null;
  recommended_medications?: RecommendedMedication[];
}

interface ClinicalRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  initialValues?: ClinicalRecordFields;
  onSave: (data: ClinicalRecordFields) => Promise<void>;
}

type MedRow = {
  name: string;
  dosage: string;
  times: string[];
  durationDays: string;
};

interface FormData {
  diagnosis: string;
  prescription: string;
  doctor_notes: string;
  meds: MedRow[];
}

const emptyMedRow = (): MedRow => ({
  name: "",
  dosage: "",
  times: ["08:00"],
  durationDays: "7",
});

const INITIAL_FORM_DATA: FormData = {
  diagnosis: "",
  prescription: "",
  doctor_notes: "",
  meds: [],
};

function toMedRows(list?: RecommendedMedication[]): MedRow[] {
  if (!list?.length) return [];
  return list.map((m) => ({
    name: m.name,
    dosage: m.dosage || "",
    times: m.times.length ? [...m.times] : ["08:00"],
    durationDays: String(m.durationDays || 7),
  }));
}

export default function ClinicalRecordModal({
  isOpen,
  onClose,
  patientName,
  initialValues,
  onSave,
}: ClinicalRecordModalProps) {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !prevIsOpenRef.current) {
      const timer = setTimeout(() => {
        setFormData({
          diagnosis: initialValues?.diagnosis ?? "",
          prescription: initialValues?.prescription ?? "",
          doctor_notes: initialValues?.doctor_notes ?? "",
          meds: toMedRows(initialValues?.recommended_medications),
        });
        setError(null);
        setSuccess(false);
        setLoading(false);
      }, 0);
      prevIsOpenRef.current = isOpen;
      return () => clearTimeout(timer);
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, initialValues]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose, loading]);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [success, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const recommended: RecommendedMedication[] = [];
    for (const row of formData.meds) {
      const name = row.name.trim();
      if (!name && !row.dosage.trim() && row.times.every((t) => !t.trim())) {
        continue;
      }
      const times = row.times.map((t) => t.trim()).filter(Boolean);
      const durationDays = Number(row.durationDays);
      if (!name) {
        setError("Informe o nome de cada medicamento recomendado.");
        return;
      }
      if (!times.length || times.some((t) => !/^\d{2}:\d{2}$/.test(t))) {
        setError("Use horários no formato HH:mm em cada medicamento.");
        return;
      }
      if (!Number.isFinite(durationDays) || durationDays < 1) {
        setError("A duração deve ser um número inteiro de pelo menos 1 dia.");
        return;
      }
      recommended.push({
        name,
        dosage: row.dosage.trim() || undefined,
        times,
        durationDays: Math.floor(durationDays),
      });
    }

    setLoading(true);
    try {
      await onSave({
        diagnosis: formData.diagnosis.trim() || null,
        prescription: formData.prescription.trim() || null,
        doctor_notes: formData.doctor_notes.trim() || null,
        recommended_medications: recommended,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erro ao salvar histórico do atendimento"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const hasExistingRecord = Boolean(
    initialValues?.diagnosis ||
      initialValues?.prescription ||
      initialValues?.doctor_notes ||
      (initialValues?.recommended_medications &&
        initialValues.recommended_medications.length > 0)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="bg-linear-to-r from-blue-600 to-teal-500 p-6 text-white rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-bold">
                {hasExistingRecord
                  ? "Editar atendimento"
                  : "Registrar atendimento"}
              </h2>
              <p className="text-blue-100 mt-1">
                Diagnóstico, observações e medicamentos recomendados
              </p>
              {patientName && (
                <p className="text-blue-50 text-sm mt-2">
                  Paciente: {patientName}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-blue-200 transition-colors"
              disabled={loading}
              type="button"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center text-green-700">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                <span className="font-medium">
                  Atendimento salvo com sucesso!
                </span>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="font-medium">Erro ao salvar</span>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Stethoscope className="w-4 h-4 inline mr-1" />
              Diagnóstico
            </label>
            <textarea
              value={formData.diagnosis}
              onChange={(e) =>
                setFormData({ ...formData, diagnosis: e.target.value })
              }
              placeholder="Descreva o diagnóstico..."
              rows={3}
              disabled={loading || success}
              className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <ClipboardList className="w-4 h-4 inline mr-1" />
              Prescrição (texto livre)
            </label>
            <textarea
              value={formData.prescription}
              onChange={(e) =>
                setFormData({ ...formData, prescription: e.target.value })
              }
              placeholder="Orientações gerais em texto..."
              rows={2}
              disabled={loading || success}
              className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              Observações
            </label>
            <textarea
              value={formData.doctor_notes}
              onChange={(e) =>
                setFormData({ ...formData, doctor_notes: e.target.value })
              }
              placeholder="Observações clínicas adicionais..."
              rows={3}
              disabled={loading || success}
              className="w-full p-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
            />
          </div>

          <div className="border border-gray-200 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium text-gray-900 flex items-center gap-1">
                <Pill className="w-4 h-4 text-blue-600" />
                Medicamentos recomendados
              </h3>
              <button
                type="button"
                disabled={loading || success}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    meds: [...prev.meds, emptyMedRow()],
                  }))
                }
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Nome, dosagem, horários e duração. O paciente recebe esses
              medicamentos automaticamente após salvar.
            </p>

            {formData.meds.length === 0 && (
              <p className="text-sm text-gray-500">Nenhum medicamento ainda.</p>
            )}

            {formData.meds.map((med, index) => (
              <div
                key={index}
                className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-600">
                    Medicamento {index + 1}
                  </span>
                  <button
                    type="button"
                    disabled={loading || success}
                    onClick={() =>
                      setFormData((prev) => ({
                        ...prev,
                        meds: prev.meds.filter((_, i) => i !== index),
                      }))
                    }
                    className="text-red-600 hover:text-red-800 disabled:opacity-50"
                    aria-label="Remover medicamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    value={med.name}
                    disabled={loading || success}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const meds = [...prev.meds];
                        meds[index] = { ...meds[index], name: e.target.value };
                        return { ...prev, meds };
                      })
                    }
                    placeholder="Nome"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black disabled:bg-gray-100"
                  />
                  <input
                    value={med.dosage}
                    disabled={loading || success}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const meds = [...prev.meds];
                        meds[index] = {
                          ...meds[index],
                          dosage: e.target.value,
                        };
                        return { ...prev, meds };
                      })
                    }
                    placeholder="Dosagem (opcional)"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-black disabled:bg-gray-100"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {med.times.map((time, tIndex) => (
                    <div key={tIndex} className="flex items-center gap-1">
                      <input
                        type="time"
                        value={time}
                        disabled={loading || success}
                        onChange={(e) =>
                          setFormData((prev) => {
                            const meds = [...prev.meds];
                            const times = [...meds[index].times];
                            times[tIndex] = e.target.value;
                            meds[index] = { ...meds[index], times };
                            return { ...prev, meds };
                          })
                        }
                        className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-black disabled:bg-gray-100"
                      />
                      {med.times.length > 1 && (
                        <button
                          type="button"
                          disabled={loading || success}
                          onClick={() =>
                            setFormData((prev) => {
                              const meds = [...prev.meds];
                              meds[index] = {
                                ...meds[index],
                                times: meds[index].times.filter(
                                  (_, i) => i !== tIndex
                                ),
                              };
                              return { ...prev, meds };
                            })
                          }
                          className="text-red-600 text-xs disabled:opacity-50"
                        >
                          Remover
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    disabled={loading || success}
                    onClick={() =>
                      setFormData((prev) => {
                        const meds = [...prev.meds];
                        meds[index] = {
                          ...meds[index],
                          times: [...meds[index].times, "12:00"],
                        };
                        return { ...prev, meds };
                      })
                    }
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    + horário
                  </button>
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  Duração (dias)
                  <input
                    type="number"
                    min={1}
                    value={med.durationDays}
                    disabled={loading || success}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const meds = [...prev.meds];
                        meds[index] = {
                          ...meds[index],
                          durationDays: e.target.value,
                        };
                        return { ...prev, meds };
                      })
                    }
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-black disabled:bg-gray-100"
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3 px-4 text-black bg-gray-300 rounded-lg font-semibold hover:bg-gray-400 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Salvando...
                </div>
              ) : success ? (
                <div className="flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Salvo!
                </div>
              ) : (
                "Salvar"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
