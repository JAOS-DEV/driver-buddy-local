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

export interface ChatMessage {
  sender: "user" | "bot";
  text: string;
}

export enum View {
  WORK = "WORK",
  CHAT = "CHAT",
}

export enum WorkTab {
  TRACKER = "TRACKER",
  WAGE = "WAGE",
  LAW = "LAW",
}
