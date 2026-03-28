export type Priority   = 'low' | 'medium' | 'high' | 'critical';
export type Status     = 'todo' | 'ongoing' | 'done';
export type ViewMode   = 'kanban' | 'list' | 'calendar' | 'roadmap';
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
