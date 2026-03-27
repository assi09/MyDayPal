import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Project, Tag, Status, Priority, ViewMode, Theme, SubTask } from './types';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Work', color: '#818cf8' },
  { id: 'tag-2', name: 'Personal', color: '#34d399' },
  { id: 'tag-3', name: 'Urgent', color: '#f87171' },
  { id: 'tag-4', name: 'Ideas', color: '#fbbf24' },
];

interface AppState {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  activeProjectId: string | null; // null = All Tasks
  viewMode: ViewMode;
  theme: Theme;
  searchQuery: string;
  filterPriority: Priority | 'all';
  filterTag: string | 'all';

  // Actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: Status) => void;
  reorderTasks: (tasks: Task[]) => void;

  addProject: (name: string, color: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  addTag: (name: string, color: string) => Tag;
  deleteTag: (id: string) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  setActiveProject: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleTheme: () => void;
  setSearchQuery: (q: string) => void;
  setFilterPriority: (p: Priority | 'all') => void;
  setFilterTag: (t: string | 'all') => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      tags: DEFAULT_TAGS,
      activeProjectId: null,
      viewMode: 'kanban',
      theme: 'dark',
      searchQuery: '',
      filterPriority: 'all',
      filterTag: 'all',

      addTask: (task) => {
        const tasks = get().tasks;
        const statusTasks = tasks.filter(t => t.status === task.status);
        const newTask: Task = {
          ...task,
          id: uid(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          order: statusTasks.length,
        };
        set({ tasks: [...tasks, newTask] });
      },

      updateTask: (id, updates) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t
          ),
        });
      },

      deleteTask: (id) => {
        set({ tasks: get().tasks.filter(t => t.id !== id) });
      },

      moveTask: (id, status) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
          ),
        });
      },

      reorderTasks: (tasks) => set({ tasks }),

      addProject: (name, color) => {
        const project: Project = {
          id: uid(),
          name,
          color,
          createdAt: new Date().toISOString(),
        };
        set({ projects: [...get().projects, project] });
      },

      updateProject: (id, updates) => {
        set({
          projects: get().projects.map(p => p.id === id ? { ...p, ...updates } : p),
        });
      },

      deleteProject: (id) => {
        set({
          projects: get().projects.filter(p => p.id !== id),
          tasks: get().tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t),
        });
        if (get().activeProjectId === id) set({ activeProjectId: null });
      },

      addTag: (name, color) => {
        const tag: Tag = { id: uid(), name, color };
        set({ tags: [...get().tags, tag] });
        return tag;
      },

      deleteTag: (id) => {
        set({
          tags: get().tags.filter(t => t.id !== id),
          tasks: get().tasks.map(t => ({ ...t, tags: t.tags.filter(tid => tid !== id) })),
        });
      },

      addSubtask: (taskId, title) => {
        const subtask: SubTask = { id: uid(), title, completed: false };
        set({
          tasks: get().tasks.map(t =>
            t.id === taskId ? { ...t, subtasks: [...t.subtasks, subtask] } : t
          ),
        });
      },

      toggleSubtask: (taskId, subtaskId) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === taskId
              ? {
                  ...t,
                  subtasks: t.subtasks.map(s =>
                    s.id === subtaskId ? { ...s, completed: !s.completed } : s
                  ),
                }
              : t
          ),
        });
      },

      deleteSubtask: (taskId, subtaskId) => {
        set({
          tasks: get().tasks.map(t =>
            t.id === taskId
              ? { ...t, subtasks: t.subtasks.filter(s => s.id !== subtaskId) }
              : t
          ),
        });
      },

      setActiveProject: (id) => set({ activeProjectId: id }),
      setViewMode: (mode) => set({ viewMode: mode }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterPriority: (p) => set({ filterPriority: p }),
      setFilterTag: (t) => set({ filterTag: t }),
    }),
    { name: 'mydaypal-storage' }
  )
);

export function useFilteredTasks() {
  const { tasks, activeProjectId, searchQuery, filterPriority, filterTag } = useStore();
  return tasks.filter(t => {
    if (activeProjectId && t.projectId !== activeProjectId) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterTag !== 'all' && !t.tags.includes(filterTag)) return false;
    return true;
  });
}
