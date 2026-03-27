import { differenceInCalendarDays, parseISO, isValid } from 'date-fns';
import { Task, Priority } from '../types';

// ─── Public Types ───────────────────────────────────────────────────────────

export type RoadmapModeId = 'priority' | 'duedate' | 'complexity' | 'score' | 'flow';

export interface RoadmapGroup {
  id: string;
  label: string;
  description: string;
  accent: string;
  bgTint: string;
  tasks: Task[];
  emptyMessage: string;
  meta?: Record<string, unknown>;
}

export interface ScoringWeights {
  priority: number;   // 0–1
  urgency: number;    // 0–1
  complexity: number; // 0–1 (penalty)
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  priority: 0.45,
  urgency: 0.35,
  complexity: 0.20,
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const PRIORITY_VALUES: Record<Priority, number> = {
  critical: 40,
  high:     30,
  medium:   20,
  low:      10,
};

const COMPLEXITY_DIVISORS: Record<number, number> = {
  1: 0.6,
  2: 0.8,
  3: 1.0,
  4: 1.3,
  5: 1.7,
};

function getComplexity(task: Task): 1 | 2 | 3 | 4 | 5 {
  return task.complexity ?? 3;
}

function getDaysUntilDue(task: Task): number | null {
  if (!task.dueDate) return null;
  const d = parseISO(task.dueDate);
  if (!isValid(d)) return null;
  return differenceInCalendarDays(d, new Date());
}

function urgencyPoints(task: Task): number {
  const days = getDaysUntilDue(task);
  if (days === null) return 0;
  if (days < 0)   return 40;
  if (days === 0) return 35;
  if (days <= 2)  return 28;
  if (days <= 7)  return 20;
  if (days <= 14) return 12;
  if (days <= 30) return 6;
  return 2;
}

function subtaskBonus(task: Task): number {
  if (!task.subtasks.length) return 0;
  const ratio = task.subtasks.filter(s => s.completed).length / task.subtasks.length;
  return Math.round(ratio * 10);
}

/** Compute a composite score for a task (higher = do sooner). */
export function scoreTask(task: Task): number {
  const P = PRIORITY_VALUES[task.priority] ?? 10;
  const D = urgencyPoints(task);
  const S = subtaskBonus(task);
  const C = COMPLEXITY_DIVISORS[getComplexity(task)] ?? 1.0;
  return Math.round((P + D + S) / C);
}

/** XP value displayed in Flow mode (gamification). */
export function taskXP(task: Task): number {
  return scoreTask(task) * 10;
}

function getUrgencyBucket(task: Task): string {
  const days = getDaysUntilDue(task);
  if (days === null)  return 'no-date';
  if (days < 0)       return 'overdue';
  if (days === 0)     return 'today';
  if (days <= 7)      return 'this-week';
  if (days <= 30)     return 'this-month';
  return 'later';
}

// ─── Mode: Priority ──────────────────────────────────────────────────────────

export function priorityMode(tasks: Task[]): RoadmapGroup[] {
  const active = tasks.filter(t => t.status !== 'done');

  const defs: Array<{ id: Priority; label: string; description: string; accent: string; bgTint: string; emptyMessage: string }> = [
    { id: 'critical', label: 'Critical',  description: 'Needs immediate attention',  accent: '#DC2626', bgTint: 'rgba(220,38,38,0.035)',   emptyMessage: 'No critical tasks — you\'re clear' },
    { id: 'high',     label: 'High',      description: 'Important, tackle these next', accent: '#F97316', bgTint: 'rgba(249,115,22,0.035)', emptyMessage: 'No high priority tasks' },
    { id: 'medium',   label: 'Medium',    description: 'Handle when capacity allows', accent: '#F59E0B', bgTint: 'rgba(245,158,11,0.035)', emptyMessage: 'No medium priority tasks' },
    { id: 'low',      label: 'Low',       description: 'Nice to have',                accent: '#22C55E', bgTint: 'rgba(34,197,94,0.035)',  emptyMessage: 'No low priority tasks' },
  ];

  return defs.map(g => ({
    ...g,
    tasks: active
      .filter(t => t.priority === g.id)
      .sort((a, b) => scoreTask(b) - scoreTask(a)),
  }));
}

// ─── Mode: Due Date ──────────────────────────────────────────────────────────

export function dueDateMode(tasks: Task[]): RoadmapGroup[] {
  const active = tasks.filter(t => t.status !== 'done');

  const defs = [
    { id: 'overdue',    label: 'Overdue',      description: 'Past due — act now',       accent: '#EF4444', bgTint: 'rgba(239,68,68,0.040)',   emptyMessage: 'Nothing overdue — great work' },
    { id: 'today',      label: 'Due Today',    description: 'Complete before end of day', accent: '#F97316', bgTint: 'rgba(249,115,22,0.035)', emptyMessage: 'Nothing due today' },
    { id: 'this-week',  label: 'This Week',    description: 'Next 7 days',               accent: '#F59E0B', bgTint: 'rgba(245,158,11,0.035)', emptyMessage: 'Nothing due this week' },
    { id: 'this-month', label: 'This Month',   description: 'Next 30 days',              accent: '#6366F1', bgTint: 'rgba(99,102,241,0.035)', emptyMessage: 'Nothing due this month' },
    { id: 'later',      label: 'Later',        description: 'More than 30 days out',     accent: '#22C55E', bgTint: 'rgba(34,197,94,0.035)',  emptyMessage: 'Nothing scheduled further out' },
    { id: 'no-date',    label: 'No Due Date',  description: 'Schedule these tasks',      accent: '#9CA3AF', bgTint: 'rgba(156,163,175,0.03)', emptyMessage: 'All tasks have due dates' },
  ];

  return defs.map(g => ({
    ...g,
    tasks: active
      .filter(t => getUrgencyBucket(t) === g.id)
      .sort((a, b) => {
        // Primary: due date ascending (earliest first)
        const dA = getDaysUntilDue(a) ?? 9999;
        const dB = getDaysUntilDue(b) ?? 9999;
        if (dA !== dB) return dA - dB;
        // Secondary: score descending
        return scoreTask(b) - scoreTask(a);
      }),
  }));
}

// ─── Mode: Complexity ────────────────────────────────────────────────────────

export function complexityMode(tasks: Task[]): RoadmapGroup[] {
  const active = tasks.filter(t => t.status !== 'done');

  const defs = [
    { id: 'c1', label: 'Trivial',    description: 'Complexity 1 — wrap it up fast',         accent: '#22C55E', bgTint: 'rgba(34,197,94,0.035)',   emptyMessage: 'No trivial tasks' },
    { id: 'c2', label: 'Simple',     description: 'Complexity 2 — short focused session',   accent: '#6366F1', bgTint: 'rgba(99,102,241,0.035)',   emptyMessage: 'No simple tasks' },
    { id: 'c3', label: 'Moderate',   description: 'Complexity 3 — steady effort required',  accent: '#F59E0B', bgTint: 'rgba(245,158,11,0.035)',   emptyMessage: 'No moderate tasks' },
    { id: 'c4', label: 'Hard',       description: 'Complexity 4 — save for deep work time', accent: '#F97316', bgTint: 'rgba(249,115,22,0.035)',   emptyMessage: 'No hard tasks' },
    { id: 'c5', label: 'Epic',       description: 'Complexity 5 — major undertaking',       accent: '#DC2626', bgTint: 'rgba(220,38,38,0.035)',    emptyMessage: 'No epic tasks' },
  ];

  const complexityBucket = (t: Task) => `c${getComplexity(t)}`;

  return defs.map(g => ({
    ...g,
    tasks: active
      .filter(t => complexityBucket(t) === g.id)
      .sort((a, b) => scoreTask(b) - scoreTask(a)),
  }));
}

// ─── Mode: Score ─────────────────────────────────────────────────────────────

export function scoreMode(tasks: Task[]): RoadmapGroup[] {
  const active = tasks
    .filter(t => t.status !== 'done')
    .map(t => ({ task: t, score: scoreTask(t) }))
    .sort((a, b) => b.score - a.score);

  const n = active.length;
  const topCut     = Math.max(1, Math.ceil(n * 0.20));
  const middleCut  = Math.max(topCut, Math.ceil(n * 0.70));

  const top    = active.slice(0, topCut).map(x => x.task);
  const mid    = active.slice(topCut, middleCut).map(x => x.task);
  const bottom = active.slice(middleCut).map(x => x.task);

  if (n <= 3) {
    return [
      { id: 'top', label: 'Best Next Moves', description: 'Ranked by priority × urgency ÷ complexity', accent: '#6366F1', bgTint: 'rgba(99,102,241,0.04)', tasks: active.map(x => x.task), emptyMessage: 'All caught up' },
    ];
  }

  return [
    { id: 'top',    label: 'Top Priority',  description: 'Do these first',          accent: '#EF4444', bgTint: 'rgba(239,68,68,0.04)',   tasks: top,    emptyMessage: '' },
    { id: 'active', label: 'Active Queue',  description: 'Work through these next', accent: '#6366F1', bgTint: 'rgba(99,102,241,0.04)', tasks: mid,    emptyMessage: '' },
    { id: 'later',  label: 'Backlog',       description: 'Lower urgency',           accent: '#9CA3AF', bgTint: 'rgba(156,163,175,0.03)', tasks: bottom, emptyMessage: '' },
  ];
}

// ─── Mode: Flow ──────────────────────────────────────────────────────────────

export function flowMode(tasks: Task[]): RoadmapGroup[] {
  const byScore = (arr: Task[]) => [...arr].sort((a, b) => scoreTask(b) - scoreTask(a));

  return [
    {
      id: 'ongoing', label: 'In Progress', description: 'Your active work',
      accent: '#F59E0B', bgTint: 'rgba(245,158,11,0.04)',
      tasks: byScore(tasks.filter(t => t.status === 'ongoing')),
      emptyMessage: 'No tasks in progress',
    },
    {
      id: 'todo', label: 'Up Next', description: 'Best task to start now',
      accent: '#6366F1', bgTint: 'rgba(99,102,241,0.04)',
      tasks: byScore(tasks.filter(t => t.status === 'todo')),
      emptyMessage: 'No pending tasks',
    },
    {
      id: 'done', label: 'Completed', description: 'XP earned',
      accent: '#22C55E', bgTint: 'rgba(34,197,94,0.04)',
      tasks: byScore(tasks.filter(t => t.status === 'done')),
      emptyMessage: 'No completed tasks yet',
      meta: {
        totalXP: tasks
          .filter(t => t.status === 'done')
          .reduce((sum, t) => sum + taskXP(t), 0),
      },
    },
  ];
}

// ─── Dispatcher ──────────────────────────────────────────────────────────────

export function groupTasksForRoadmap(
  tasks: Task[],
  mode: RoadmapModeId,
): RoadmapGroup[] {
  switch (mode) {
    case 'priority':   return priorityMode(tasks);
    case 'duedate':    return dueDateMode(tasks);
    case 'complexity': return complexityMode(tasks);
    case 'score':      return scoreMode(tasks);
    case 'flow':       return flowMode(tasks);
  }
}
