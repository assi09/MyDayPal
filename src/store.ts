import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Project, Tag, Status, Priority, ViewMode, Theme, SubTask, Recurrence } from './types';
import { RoadmapModeId } from './lib/roadmapEngine';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function nextRecurrenceDate(dateStr: string, rec: Recurrence): string {
  const d = new Date(dateStr + 'T00:00:00');
  if (rec.type === 'daily')   d.setDate(d.getDate() + rec.interval);
  if (rec.type === 'weekly')  d.setDate(d.getDate() + rec.interval * 7);
  if (rec.type === 'monthly') d.setMonth(d.getMonth() + rec.interval);
  return d.toISOString().slice(0, 10);
}

const DEFAULT_TAGS: Tag[] = [
  { id: 'tag-1', name: 'Work',     color: '#6366F1' },
  { id: 'tag-2', name: 'Personal', color: '#22C55E' },
  { id: 'tag-3', name: 'Urgent',   color: '#EF4444' },
  { id: 'tag-4', name: 'Ideas',    color: '#F59E0B' },
];

interface AppState {
  tasks: Task[];
  projects: Project[];
  tags: Tag[];
  activeProjectId: string | null;
  viewMode: ViewMode;
  roadmapMode: RoadmapModeId;
  theme: Theme;
  searchQuery: string;
  filterPriority: Priority | 'all';
  filterTag: string | 'all';
  accentColor: string;
  weeklyXPGoal: number;
  earnedBadges: string[];

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (id: string, status: Status) => void;
  reorderTasks: (tasks: Task[]) => void;

  // Project actions
  addProject: (name: string, color: string) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;

  // Tag actions
  addTag: (name: string, color: string) => Tag;
  deleteTag: (id: string) => void;

  // Subtask actions
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;

  // View / filter actions
  setActiveProject: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setRoadmapMode: (mode: RoadmapModeId) => void;
  toggleTheme: () => void;
  setSearchQuery: (q: string) => void;
  setFilterPriority: (p: Priority | 'all') => void;
  setFilterTag: (t: string | 'all') => void;

  // Appearance / gamification actions
  setAccentColor: (color: string) => void;
  setWeeklyXPGoal: (xp: number) => void;
  awardBadge: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: [],
      projects: [],
      tags: DEFAULT_TAGS,
      activeProjectId: null,
      viewMode: 'kanban',
      roadmapMode: 'priority',
      theme: 'dark',
      searchQuery: '',
      filterPriority: 'all',
      filterTag: 'all',
      accentColor: '#6366F1',
      weeklyXPGoal: 500,
      earnedBadges: [],

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

      deleteTask: (id) => set({ tasks: get().tasks.filter(t => t.id !== id) }),

      moveTask: (id, status) => {
        const tasks = get().tasks;
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const updatedTasks = tasks.map(t =>
          t.id === id ? { ...t, status, updatedAt: new Date().toISOString() } : t
        );

        // Auto-create next recurrence when marking done
        if (status === 'done' && task.recurrence && task.dueDate) {
          const nextDate = nextRecurrenceDate(task.dueDate, task.recurrence);
          const recurringTasks = updatedTasks.filter(t => t.status === 'todo');
          const newTask: Task = {
            ...task,
            id: uid(),
            status: 'todo',
            dueDate: nextDate,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            order: recurringTasks.length,
            subtasks: task.subtasks.map(s => ({ ...s, completed: false })),
          };
          set({ tasks: [...updatedTasks, newTask] });
        } else {
          set({ tasks: updatedTasks });
        }
      },

      reorderTasks: (tasks) => set({ tasks }),

      addProject: (name, color) => {
        const project: Project = { id: uid(), name, color, createdAt: new Date().toISOString() };
        set({ projects: [...get().projects, project] });
      },

      updateProject: (id, updates) => {
        set({ projects: get().projects.map(p => p.id === id ? { ...p, ...updates } : p) });
      },

      deleteProject: (id) => {
        set({
          projects: get().projects.filter(p => p.id !== id),
          tasks: get().tasks.map(t => t.projectId === id ? { ...t, projectId: null } : t),
        });
        if (get().activeProjectId === id) set({ activeProjectId: null });
      },

      archiveProject: (id) => {
        set({ projects: get().projects.map(p => p.id === id ? { ...p, archived: true } : p) });
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
              ? { ...t, subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s) }
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

      setActiveProject:  (id)   => set({ activeProjectId: id }),
      setViewMode:       (mode) => set({ viewMode: mode }),
      setRoadmapMode:    (mode) => set({ roadmapMode: mode }),
      toggleTheme:       ()     => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setSearchQuery:    (q)    => set({ searchQuery: q }),
      setFilterPriority: (p)    => set({ filterPriority: p }),
      setFilterTag:      (t)    => set({ filterTag: t }),

      setAccentColor: (color) => set({ accentColor: color }),
      setWeeklyXPGoal: (xp) => set({ weeklyXPGoal: xp }),
      awardBadge: (id) => {
        if (!get().earnedBadges.includes(id)) {
          set({ earnedBadges: [...get().earnedBadges, id] });
        }
      },
    }),
    { name: 'mydaypal-storage' }
  )
);

export function useFilteredTasks() {
  const { tasks, projects, activeProjectId, searchQuery, filterPriority, filterTag } = useStore();
  const archivedProjectIds = new Set(projects.filter(p => p.archived).map(p => p.id));
  return tasks.filter(t => {
    // When viewing All Tasks, hide tasks belonging to archived projects
    if (!activeProjectId && t.projectId && archivedProjectIds.has(t.projectId)) return false;
    if (activeProjectId && t.projectId !== activeProjectId) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (filterTag !== 'all' && !t.tags.includes(filterTag)) return false;
    return true;
  });
}
