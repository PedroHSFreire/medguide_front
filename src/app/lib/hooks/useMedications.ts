"use client";

import { useCallback, useEffect, useState } from "react";
import { medicationService } from "../service/medicationService";
import type {
  CreateMedicationBody,
  Medication,
  UpdateMedicationBody,
} from "../types/medications";

export function useMedications(enabled = true) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const list = await medicationService.list();
      setMedications(list);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar medicamentos"
      );
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (body: CreateMedicationBody) => {
      setError(null);
      const created = await medicationService.create({
        ...body,
        timezone:
          body.timezone ||
          Intl.DateTimeFormat().resolvedOptions().timeZone ||
          "America/Sao_Paulo",
      });
      setMedications((prev) => [created, ...prev]);
      return created;
    },
    []
  );

  const update = useCallback(async (id: string, body: UpdateMedicationBody) => {
    setError(null);
    const updated = await medicationService.update(id, body);
    setMedications((prev) =>
      prev.map((med) => (med.id === id ? updated : med))
    );
    return updated;
  }, []);

  const toggleActive = useCallback(
    async (id: string, active: boolean) => update(id, { active }),
    [update]
  );

  const remove = useCallback(async (id: string) => {
    setError(null);
    await medicationService.remove(id);
    setMedications((prev) => prev.filter((med) => med.id !== id));
  }, []);

  return {
    medications,
    loading,
    error,
    refresh,
    create,
    update,
    toggleActive,
    remove,
  };
}
