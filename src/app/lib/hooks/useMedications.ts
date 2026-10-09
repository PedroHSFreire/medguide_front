"use client";

import { useCallback, useEffect, useState } from "react";
import { medicationService } from "../service/medicationService";
import type {
  CreateMedicationBody,
  DoseConfirmationBody,
  DueDose,
  Medication,
  UpdateMedicationBody,
} from "../types/medications";

export function useMedications(enabled = true) {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [dueDoses, setDueDoses] = useState<DueDose[]>([]);
  const [loading, setLoading] = useState(false);
  const [dueLoading, setDueLoading] = useState(false);
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

  const refreshDue = useCallback(async () => {
    if (!enabled) return;
    setDueLoading(true);
    try {
      const doses = await medicationService.listDue();
      setDueDoses(doses);
    } catch {
      // Due endpoint may not be ready yet; keep list usable.
      setDueDoses([]);
    } finally {
      setDueLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void refresh();
    void refreshDue();
  }, [refresh, refreshDue]);

  const create = useCallback(async (body: CreateMedicationBody) => {
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
  }, []);

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

  const confirmDose = useCallback(
    async (medicationId: string, body: DoseConfirmationBody) => {
      setError(null);
      await medicationService.confirmDose(medicationId, body);
      setDueDoses((prev) =>
        prev.map((dose) =>
          dose.medicationId === medicationId &&
          dose.scheduledFor === body.scheduledFor
            ? { ...dose, status: body.status }
            : dose
        )
      );
    },
    []
  );

  return {
    medications,
    dueDoses,
    loading,
    dueLoading,
    error,
    refresh,
    refreshDue,
    create,
    update,
    toggleActive,
    remove,
    confirmDose,
  };
}
