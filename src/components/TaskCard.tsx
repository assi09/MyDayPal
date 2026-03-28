import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, CheckSquare, GripVertical, Trash2, Timer } from 'lucide-react';
import { Task } from '../types';
import { useStore } from '../store';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

const PRIORITY_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  critical: { color: 'var(--priority-critical)', bg: 'var(--priority-critical-bg)', label: 'Crit' },
  high:     { color: 'var(--priority-high)',     bg: 'var(--priority-high-bg)',     label: 'High' },
  medium:   { color: 'var(--priority-medium)',   bg: 'var(--priority-medium-bg)',   label: 'Med'  },
  low:      { color: 'var(--priority-low)',      bg: 'var(--priority-low-bg)',      label: 'Low'  },
};

// Raw hex for inset shadow (CSS vars don't work inside box-shadow property)
const PRIORITY_HEX: Record<string, string> = {
  critical: '#DC2626',
  high:     '#F97316',
  medium:   '#F59E0B',
  low:      '#22C55E',
};

function formatDue(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d))    return { label: 'Today',    overdue: false };
  if (isTomorrow(d)) return { label: 'Tomorrow', overdue: false };
  if (isPast(d))     return { label: format(d, 'MMM d'), overdue: true };
  return { label: format(d, 'MMM d'), overdue: false };
}

interface Props {
  task: Task;
  onOpen: (task: Task) => void;
  overlay?: boolean;
}

export default function TaskCard({ task, onOpen, overlay }: Props) {
  const { tags, deleteTask, settings, startPomodoro, pomodoroTaskId } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  const p = PRIORITY_CONFIG[task.priority];
  const hex = PRIORITY_HEX[task.priority];
  const completedSubs = task.subtasks.filter(s => s.completed).length;
  const taskTags = tags.filter(t => task.tags.includes(t.id));
  const due = task.dueDate ? formatDue(task.dueDate) : null;
  const isDone = task.status === 'done';

  const daysSinceUpdate = Math.floor((Date.now() - new Date(task.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
  const isStale = settings.staleTaskEnabled && task.status !== 'done' && daysSinceUpdate >= settings.staleTaskDays;

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, cursor: isDragging ? 'grabbing' : 'grab' }}
      className={overlay ? 'drag-overlay' : ''}
      {...attributes}
      {...listeners}
    >
      <div
        className="task-card"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--bg-card)',
          borderRadius: 'var(--r-md)',
          padding: '12px 13px 11px',
          cursor: 'inherit',
          // Left accent stripe via inset box-shadow + layered outer shadow
          boxShadow: hovered
            ? `inset 3px 0 0 0 ${hex}, var(--shadow-md)`
            : `inset 3px 0 0 0 ${hex}, var(--shadow-sm)`,
          border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          position: 'relative',
          opacity: isDone ? 0.65 : 1,
        }}
        onClick={() => { if (!isDragging) onOpen(task); }}
      >
        {/* ── Top row: actions ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {/* Priority label */}
          <span style={{
            fontSize: 10,
            fontWeight: 700,
            padding: '2px 6px',
            borderRadius: 'var(--r-xs)',
            background: p.bg,
            color: p.color,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            flexShrink: 0,
          }}>
            {p.label}
          </span>

          <div style={{ flex: 1 }} />

          {/* Drag hint icon */}
          <div style={{
            color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center',
            opacity: hovered ? 0.5 : 0,
            transition: 'opacity var(--t-base)',
            padding: '1px 2px',
          }}>
            <GripVertical size={13} strokeWidth={2} />
          </div>

          {/* Pomodoro start */}
          <button
            onClick={e => { e.stopPropagation(); startPomodoro(task.id, task.title); }}
            style={{
              background: 'none', border: 'none',
              color: pomodoroTaskId === task.id ? 'var(--accent)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
              padding: '1px 2px', borderRadius: 4,
              opacity: hovered || pomodoroTaskId === task.id ? 1 : 0,
              transition: 'opacity var(--t-base), color var(--t-fast)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={e => (e.currentTarget.style.color = pomodoroTaskId === task.id ? 'var(--accent)' : 'var(--text-muted)')}
            title="Start Pomodoro timer"
          >
            <Timer size={13} strokeWidth={1.8} />
          </button>

          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
            style={{
              background: 'none', border: 'none',
              color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center',
              padding: '1px 2px', borderRadius: 4,
              opacity: hovered ? 1 : 0,
              transition: 'opacity var(--t-base), color var(--t-fast)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--priority-high)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={13} strokeWidth={1.8} />
          </button>
        </div>

        {/* ── Title ── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
          <p style={{
            fontSize: 13.5,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            letterSpacing: '-0.15px',
            textDecoration: isDone ? 'line-through' : 'none',
            margin: 0,
            flex: 1,
          }}>
            {task.title}
          </p>
          {isStale && (
            <span style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: 'var(--r-xs)',
              background: '#F59E0B22',
              color: '#F59E0B',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              flexShrink: 0,
              marginTop: 1,
            }}>
              Stale
            </span>
          )}
        </div>

        {/* ── Description preview ── */}
        {task.description && (
          <p style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {task.description}
          </p>
        )}

        {/* ── Tags ── */}
        {taskTags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {taskTags.map(t => (
              <span key={t.id} style={{
                fontSize: 10.5,
                fontWeight: 600,
                padding: '2px 7px',
                borderRadius: 'var(--r-full)',
                background: t.color + '1E',
                color: t.color,
                letterSpacing: '0.02em',
              }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* ── Footer: subtasks + due date ── */}
        {(task.subtasks.length > 0 || task.dueDate) && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            paddingTop: 7,
            borderTop: '1px solid var(--border)',
            marginTop: 1,
          }}>
            {task.subtasks.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                color: completedSubs === task.subtasks.length
                  ? 'var(--priority-low)'
                  : 'var(--text-muted)',
                fontSize: 11, fontWeight: 600,
              }}>
                <CheckSquare size={11} strokeWidth={2} />
                <span>{completedSubs}/{task.subtasks.length}</span>
                {/* Progress bar */}
                <div style={{
                  width: 32, height: 2.5,
                  background: 'var(--bg-hover)',
                  borderRadius: 'var(--r-full)',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 'var(--r-full)',
                    background: 'var(--priority-low)',
                    width: `${(completedSubs / task.subtasks.length) * 100}%`,
                    transition: 'width 0.3s ease',
                  }} />
                </div>
              </div>
            )}

            <div style={{ flex: 1 }} />

            {due && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, fontWeight: 600,
                color: due.overdue ? 'var(--priority-high)' : 'var(--text-muted)',
                background: due.overdue ? 'var(--priority-high-bg)' : 'transparent',
                padding: due.overdue ? '2px 6px' : '2px 0',
                borderRadius: 'var(--r-xs)',
              }}>
                <Calendar size={11} strokeWidth={2} />
                {due.label}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
