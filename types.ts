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

export interface DailyWage {
  id: string; // Unique submission ID
  date: string; // YYYY-MM-DD format - the date the wage is for
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
  totalWage: number;
  calculationMethod: "timeTracker" | "manualHours";
  taxAmount?: number; // Tax amount if tax calculations were enabled
  afterTaxWage?: number; // After-tax wage if tax calculations were enabled
  taxRate?: number; // Tax rate used for calculation
  notes?: string; // Optional notes for the user
}

export interface WageHistory {
  dailyWages: DailyWage[];
}

export interface Settings {
  weekStartDay:
    | "monday"
    | "tuesday"
    | "wednesday"
    | "thursday"
    | "friday"
    | "saturday"
    | "sunday";
  defaultHourlyRate: number;
  defaultOvertimeRate: number;
  enableTaxCalculations: boolean;
  taxRate: number; // Percentage as decimal (0.20 for 20%)
  currency: string;
  weeklyGoal: number;
  monthlyGoal: number;
}

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export enum View {
  WORK = "WORK",
  CHAT = "CHAT",
  SETTINGS = "SETTINGS",
}

export enum WorkTab {
  TRACKER = "TRACKER",
  WAGE = "WAGE",
  WAGE_HISTORY = "WAGE_HISTORY",
  SETTINGS = "SETTINGS",
  LAW = "LAW",
}
