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
