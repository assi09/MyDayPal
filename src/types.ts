export type Priority   = 'low' | 'medium' | 'high' | 'critical';
export type Status     = 'todo' | 'ongoing' | 'done';
export type ViewMode   = 'kanban' | 'list' | 'calendar' | 'roadmap' | 'settings';
export type Theme      = 'dark' | 'light';
export type Complexity = 1 | 2 | 3 | 4 | 5;

export type RecurrenceType = 'daily' | 'weekly' | 'monthly';

export interface Recurrence {
  type: RecurrenceType;
  interval: number; // every N units
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  complexity?: Complexity;  // 1=trivial → 5=epic; defaults to 3
  projectId: string | null;
  tags: string[];           // tag ids
  subtasks: SubTask[];
  dueDate: string | null;   // ISO date string yyyy-MM-dd
  createdAt: string;
  updatedAt: string;
  order: number;
  recurrence?: Recurrence;
  estimatedMinutes?: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  archived?: boolean;
}

export interface AppSettings {
  // Auto-archive
  autoArchiveTasks: 'never' | '7days' | '30days';
  autoArchiveProjects: 'never' | '7days' | '30days';
  // Overdue escalation
  overdueEscalationEnabled: boolean;
  overdueEscalationDays: number;
  // Stale task detection
  staleTaskEnabled: boolean;
  staleTaskDays: number;
  // Due date buffer (early warning)
  dueDateBufferEnabled: boolean;
  dueDateBufferDays: number;
  // Focus mode
  focusModeEnabled: boolean;
  // Daily task cap
  dailyTaskCapEnabled: boolean;
  dailyTaskCap: number;
  // Complexity balance
  complexityBalanceEnabled: boolean;
  complexityBalanceMax: number;
  // XP bonuses
  streakBonusEnabled: boolean;
  earlyBirdBonusEnabled: boolean;
}
