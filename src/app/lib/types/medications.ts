export type Medication = {
  id: string;
  name: string;
  dosage?: string;
  times: string[];
  active: boolean;
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMedicationBody = {
  name: string;
  dosage?: string;
  times: string[];
  active?: boolean;
  timezone?: string;
};

export type UpdateMedicationBody = Partial<CreateMedicationBody>;

export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
};
