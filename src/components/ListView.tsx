import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Check, Calendar } from 'lucide-react';
import { Task, Status } from '../types';
import { useStore, useFilteredTasks } from '../store';
import { format, isPast, isToday, parseISO } from 'date-fns';
import TaskModal from './TaskModal';

const SECTIONS: { id: Status; label: string; accent: string }[] = [
  { id: 'todo', label: 'To Do', accent: '#818cf8' },
  { id: 'ongoing', label: 'In Progress', accent: '#f59e0b' },
  { id: 'done', label: 'Done', accent: '#10b981' },
];

const PRIORITY_COLOR: Record<string, string> = {
  high: 'var(--priority-high)',
  medium: 'var(--priority-medium)',
  low: 'var(--priority-low)',
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>
        {SECTIONS.map(section => {
          const tasks = filtered
            .filter(t => t.status === section.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div key={section.id} style={{ marginBottom: 32 }}>
              {/* Section header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  marginBottom: 8, cursor: 'pointer', userSelect: 'none',
                  padding: '8px 0',
                }}
                onClick={() => toggle(section.id)}
              >
                <div style={{
                  width: 12, height: 12, borderRadius: '50%',
                  background: section.accent,
                  boxShadow: `0 0 8px ${section.accent}88`,
                  flexShrink: 0,
                }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.2px' }}>
                  {section.label}
                </span>
                <span style={{
                  fontSize: 12, fontWeight: 700, padding: '3px 10px',
                  borderRadius: 99, background: section.accent + '20', color: section.accent,
                }}>
                  {tasks.length}
                </span>
                <div style={{ flex: 1 }} />
                <button
                  onClick={e => { e.stopPropagation(); setNewTaskStatus(section.id); setEditingTask('new'); }}
                  style={{
                    background: section.accent + '18', border: 'none',
                    color: section.accent,
                    display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer', padding: '6px 12px', borderRadius: 8,
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = section.accent; e.currentTarget.style.color = '#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = section.accent + '18'; e.currentTarget.style.color = section.accent; }}
                >
                  <Plus size={13} strokeWidth={2.5} /> Add
                </button>
                {collapsed[section.id]
                  ? <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />
                }
              </div>

              {/* Divider */}
              <div style={{
                height: 1.5,
                background: `linear-gradient(to right, ${section.accent}55, transparent)`,
                marginBottom: 10,
                borderRadius: 99,
              }} />

              {/* Tasks */}
              {!collapsed[section.id] && (
                <div style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  borderRadius: 14,
                  overflow: 'hidden',
                }}>
                  {tasks.map((task, i) => (
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
                  ))}
                  {tasks.length === 0 && (
                    <div style={{
                      padding: '28px 20px', color: 'var(--text-muted)',
                      fontSize: 13, textAlign: 'center',
                    }}>
                      No tasks here yet
                    </div>
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

  return (
    <div
      className="animate-fade"
      style={{ animationDelay: `${index * 0.03}s` }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 20px',
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'background var(--transition)',
        cursor: 'pointer',
        borderBottom: isLast ? 'none' : '1px solid var(--border)',
      }}
        onClick={onOpen}
      >
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); onToggleDone(); }}
          style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            border: `2px solid ${task.status === 'done' ? accent : 'var(--border-strong)'}`,
            background: task.status === 'done' ? accent : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all var(--transition)',
          }}
        >
          {task.status === 'done' && <Check size={11} color="#fff" strokeWidth={3} />}
        </button>

        {/* Priority dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: PRIORITY_COLOR[task.priority],
        }} />

        {/* Title */}
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 500,
          color: 'var(--text-primary)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          opacity: task.status === 'done' ? 0.45 : 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </span>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 5 }}>
            {tags.slice(0, 2).map(t => (
              <span key={t.id} style={{
                fontSize: 11, padding: '3px 8px', borderRadius: 99,
                background: t.color + '22', color: t.color, fontWeight: 600,
              }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Due date */}
        {due && (
          <span style={{
            fontSize: 12, fontWeight: 500,
            color: isOverdue ? 'var(--priority-high)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0,
          }}>
            <Calendar size={13} />
            {isToday(due) ? 'Today' : format(due, 'MMM d')}
          </span>
        )}

        {/* Subtask count */}
        {task.subtasks.length > 0 && (
          <span style={{
            fontSize: 12, color: 'var(--text-muted)', flexShrink: 0,
            background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: 99,
          }}>
            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
          </span>
        )}
      </div>
    </div>
  );
}
