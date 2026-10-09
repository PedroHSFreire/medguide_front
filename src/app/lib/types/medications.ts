export type MedicationSource = "patient" | "doctor";

export type Medication = {
  id: string;
  name: string;
  dosage?: string;
  times: string[];
  active: boolean;
  timezone: string;
  durationDays?: number | null;
  source?: MedicationSource;
  appointmentId?: string | null;
  endsAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateMedicationBody = {
  name: string;
  dosage?: string;
  times: string[];
  active?: boolean;
  timezone?: string;
  durationDays?: number;
};

export type UpdateMedicationBody = Partial<CreateMedicationBody>;

export type DoseConfirmationBody = {
  scheduledFor: string;
  status: "taken" | "skipped";
};

export type DueDose = {
  medicationId: string;
  medicationName: string;
  dosage?: string;
  scheduledFor: string;
  status?: "pending" | "taken" | "skipped";
};

export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
};
