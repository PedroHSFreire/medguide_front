export type RecommendedMedication = {
  name: string;
  dosage?: string;
  times: string[]; // ["08:00","20:00"]
  durationDays: number; // >= 1
};
