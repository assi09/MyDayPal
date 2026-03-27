import { useState } from 'react';
import { Plus, ChevronDown, Check, Calendar } from 'lucide-react';
import { Task, Status } from '../types';
import { useStore, useFilteredTasks } from '../store';
import { format, isPast, isToday, parseISO } from 'date-fns';
import TaskModal from './TaskModal';

const SECTIONS: { id: Status; label: string; accent: string }[] = [
  { id: 'todo',    label: 'To Do',       accent: '#6366F1' },
  { id: 'ongoing', label: 'In Progress', accent: '#F59E0B' },
  { id: 'done',    label: 'Done',        accent: '#22C55E' },
];

const PRIORITY_HEX: Record<string, string> = {
  critical: '#DC2626',
  high:     '#F97316',
  medium:   '#F59E0B',
  low:      '#22C55E',
};

export default function ListView() {
  const { moveTask, tags } = useStore();
  const filtered = useFilteredTasks();
  const [collapsed, setCollapsed] = useState<Record<Status, boolean>>({ todo: false, ongoing: false, done: false });
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<Status>('todo');

  function toggle(status: Status) {
    setCollapsed(prev => ({ ...prev, [status]: !prev[status] }));
  }

  return (
    <>
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 40px' }}>
        {SECTIONS.map(section => {
          const tasks = filtered
            .filter(t => t.status === section.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div key={section.id} style={{ marginBottom: 24 }}>
              {/* ── Section header ── */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 4px',
                  cursor: 'pointer', userSelect: 'none',
                  marginBottom: 6,
                }}
                onClick={() => toggle(section.id)}
              >
                {/* Chevron */}
                <div style={{
                  color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center',
                  transition: 'transform var(--t-base)',
                  transform: collapsed[section.id] ? 'rotate(-90deg)' : 'rotate(0deg)',
                }}>
                  <ChevronDown size={15} strokeWidth={2} />
                </div>

                {/* Status dot */}
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: section.accent,
                  flexShrink: 0,
                  boxShadow: `0 0 0 2px ${section.accent}28`,
                }} />

                <span style={{
                  fontWeight: 700, fontSize: 14,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.2px',
                  flex: 1,
                }}>
                  {section.label}
                </span>

                {/* Count */}
                <span style={{
                  fontSize: 11, fontWeight: 700,
                  minWidth: 22, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 'var(--r-xs)',
                  background: section.accent + '18',
                  color: section.accent,
                  letterSpacing: '-0.2px',
                }}>
                  {tasks.length}
                </span>

                {/* Add button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setNewTaskStatus(section.id);
                    setEditingTask('new');
                  }}
                  className="btn-press"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 'var(--r-sm)',
                    border: 'none',
                    background: section.accent + '16',
                    color: section.accent,
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background var(--t-base), color var(--t-base)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = section.accent; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = section.accent + '16'; e.currentTarget.style.color = section.accent; }}
                >
                  <Plus size={12} strokeWidth={2.5} />
                  Add
                </button>
              </div>

              {/* ── Accent divider ── */}
              <div style={{
                height: 1,
                background: `linear-gradient(to right, ${section.accent}40, transparent 70%)`,
                marginBottom: 8,
                borderRadius: 'var(--r-full)',
              }} />

              {/* ── Task rows ── */}
              {!collapsed[section.id] && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-xs)',
                }}>
                  {tasks.length === 0 ? (
                    <div style={{
                      padding: '24px 20px',
                      color: 'var(--text-muted)',
                      fontSize: 13,
                      textAlign: 'center',
                      fontWeight: 500,
                    }}>
                      No tasks here yet
                    </div>
                  ) : (
                    tasks.map((task, i) => (
                      <ListRow
                        key={task.id}
                        task={task}
                        accent={section.accent}
                        tags={tags.filter(t => task.tags.includes(t.id))}
                        onOpen={() => setEditingTask(task)}
                        onToggleDone={() => moveTask(task.id, task.status === 'done' ? 'todo' : 'done')}
                        index={i}
                        isLast={i === tasks.length - 1}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask === 'new' ? null : editingTask}
          defaultStatus={editingTask === 'new' ? newTaskStatus : undefined}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}

function ListRow({ task, accent, tags, onOpen, onToggleDone, index, isLast }: {
  task: Task;
  accent: string;
  tags: { id: string; name: string; color: string }[];
  onOpen: () => void;
  onToggleDone: () => void;
  index: number;
  isLast: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const due = task.dueDate ? parseISO(task.dueDate) : null;
  const isOverdue = due && isPast(due) && !isToday(due) && task.status !== 'done';
  const isDone = task.status === 'done';

  return (
    <div
      className="animate-fade"
      style={{ animationDelay: `${index * 0.025}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 16px',
          background: hovered ? 'var(--bg-hover)' : 'transparent',
          transition: 'background var(--t-base)',
          cursor: 'pointer',
          borderBottom: isLast ? 'none' : '1px solid var(--border)',
          borderLeft: `3px solid ${PRIORITY_HEX[task.priority]}`,
          opacity: isDone ? 0.6 : 1,
        }}
        onClick={onOpen}
      >
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); onToggleDone(); }}
          className="btn-press"
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            border: `2px solid ${isDone ? accent : 'var(--border-strong)'}`,
            background: isDone ? accent : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all var(--t-base)',
          }}
        >
          {isDone && <Check size={10} color="#fff" strokeWidth={3} />}
        </button>

        {/* Title */}
        <span style={{
          flex: 1, fontSize: 13.5, fontWeight: 500,
          color: 'var(--text-primary)',
          letterSpacing: '-0.1px',
          textDecoration: isDone ? 'line-through' : 'none',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </span>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {tags.slice(0, 2).map(t => (
              <span key={t.id} style={{
                fontSize: 10.5, fontWeight: 600,
                padding: '2px 7px', borderRadius: 'var(--r-full)',
                background: t.color + '1E', color: t.color,
              }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Due date */}
        {due && (
          <span style={{
            fontSize: 11.5, fontWeight: 600,
            color: isOverdue ? 'var(--priority-high)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
            background: isOverdue ? 'var(--priority-high-bg)' : 'transparent',
            padding: isOverdue ? '2px 7px' : '0',
            borderRadius: 'var(--r-xs)',
          }}>
            <Calendar size={11} strokeWidth={2} />
            {isToday(due) ? 'Today' : format(due, 'MMM d')}
          </span>
        )}

        {/* Subtask count */}
        {task.subtasks.length > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: 'var(--text-muted)', flexShrink: 0,
            background: 'var(--bg-hover)',
            padding: '2px 8px', borderRadius: 'var(--r-full)',
          }}>
            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
          </span>
        )}
      </div>
    </div>
  );
}
