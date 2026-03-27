export type Priority = 'low' | 'medium' | 'high';
export type Status = 'todo' | 'ongoing' | 'done';
export type ViewMode = 'kanban' | 'list';
export type Theme = 'dark' | 'light';

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
  projectId: string | null;
  tags: string[]; // tag ids
  subtasks: SubTask[];
  dueDate: string | null; // ISO string
  createdAt: string;
  updatedAt: string;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}
