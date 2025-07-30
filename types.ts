export interface TimeEntry {
  id: number;
  startTime: string;
  endTime: string;
}

export interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export enum View {
  WORK = 'WORK',
  CHAT = 'CHAT',
}

export enum WorkTab {
  TRACKER = 'TRACKER',
  WAGE = 'WAGE',
  LAW = 'LAW',
}
