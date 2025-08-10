import { FieldValue } from "firebase/firestore";

export interface TimeEntry {
  id: number;
  startTime: string;
  endTime: string;
}

export interface DailySubmission {
  date: string; // YYYY-MM-DD format
  timestamp: string; // ISO string of when submitted
  entries: TimeEntry[];
  totalMinutes: number;
}

export interface DailyPay {
  id: string; // Unique submission ID
  date: string; // YYYY-MM-DD format - the date the pay is for
  timestamp: string; // ISO string of when submitted
  submissionTime: string; // Time of submission (HH:MM format)
  standardHours: number;
  standardMinutes: number;
  standardRate: number;
  standardPay: number;
  overtimeHours: number;
  overtimeMinutes: number;
  overtimeRate: number;
  overtimePay: number;
  totalPay: number;
  calculationMethod: "timeTracker" | "manualHours";
  taxAmount?: number; // Tax amount if tax calculations were enabled
  afterTaxPay?: number; // After-tax pay if tax calculations were enabled
  taxRate?: number; // Tax rate used for calculation
  niAmount?: number; // NI amount if NI calculations were enabled
  afterNiPay?: number; // After-NI pay if NI calculations were enabled
  notes?: string; // Optional notes for the user
}

export interface PayHistory {
  dailyPays: DailyPay[];
}

export interface StandardRate {
  id: string;
  name: string;
  rate: number;
}

export interface OvertimeRate {
  id: string;
  name: string;
  rate: number;
}

export type WeekStartDay =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export interface Settings {
  weekStartDay: WeekStartDay;
  standardRates?: Array<{ id: string; name: string; rate: number }>;
  overtimeRates?: Array<{ id: string; name: string; rate: number }>;
  enableTaxCalculations: boolean;
  taxRate: number;
  enableNiCalculations: boolean;
  currency: string;
  weeklyGoal: number;
  monthlyGoal: number;
  darkMode: boolean;
  storageMode: "local" | "cloud";
  lastSyncAt?: import("firebase/firestore").FieldValue | string;
}

export type UserRole = "free" | "premium" | "admin" | "beta";

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  premiumUntil?: string; // ISO date
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export enum View {
  WORK = "work",
  PAY = "pay",
  LAW_LIMITS = "law_limits",
  CHAT = "chat",
  SETTINGS = "settings",
  ADMIN = "admin",
}

export enum WorkTab {
  TRACKER = "tracker",
  PAY = "pay",
  LAW = "law",
}
