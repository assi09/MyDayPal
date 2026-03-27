import { useState } from 'react';
import { Plus, ChevronDown, ChevronRight, Check, Calendar } from 'lucide-react';
import { Task, Status } from '../types';
import { useStore, useFilteredTasks } from '../store';
import { format, isPast, isToday, parseISO } from 'date-fns';
import TaskModal from './TaskModal';

const SECTIONS: { id: Status; label: string; emoji: string; accent: string }[] = [
  { id: 'todo', label: 'To Do', emoji: '📋', accent: '#818cf8' },
  { id: 'ongoing', label: 'Ongoing', emoji: '⚡', accent: '#fbbf24' },
  { id: 'done', label: 'Done', emoji: '✅', accent: '#34d399' },
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
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 40px' }}>
        {SECTIONS.map(section => {
          const tasks = filtered
            .filter(t => t.status === section.id)
            .sort((a, b) => a.order - b.order);

          return (
            <div key={section.id} style={{ marginBottom: 28 }}>
              {/* Section header */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4,
                  cursor: 'pointer', userSelect: 'none',
                  padding: '6px 0',
                }}
                onClick={() => toggle(section.id)}
              >
                <span style={{ fontSize: 16 }}>{section.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
                  {section.label}
                </span>
                <span style={{
                  fontSize: 11, fontWeight: 600, padding: '2px 7px',
                  borderRadius: 99, background: section.accent + '22', color: section.accent,
                }}>
                  {tasks.length}
                </span>
                <div style={{ flex: 1 }} />
                <button
                  onClick={e => { e.stopPropagation(); setNewTaskStatus(section.id); setEditingTask('new'); }}
                  style={{
                    background: 'none', border: 'none', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                    cursor: 'pointer', padding: '4px 8px', borderRadius: 6,
                    transition: 'all var(--transition)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = section.accent; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.background = 'none'; }}
                >
                  <Plus size={13} /> Add
                </button>
                {collapsed[section.id]
                  ? <ChevronRight size={15} style={{ color: 'var(--text-muted)' }} />
                  : <ChevronDown size={15} style={{ color: 'var(--text-muted)' }} />
                }
              </div>

              {/* Divider */}
              <div style={{
                height: 1, background: `linear-gradient(to right, ${section.accent}44, transparent)`,
                marginBottom: 8,
              }} />

              {/* Tasks */}
              {!collapsed[section.id] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {tasks.map((task, i) => (
                    <ListRow
                      key={task.id}
                      task={task}
                      tags={tags.filter(t => task.tags.includes(t.id))}
                      onOpen={() => setEditingTask(task)}
                      onToggleDone={() => moveTask(task.id, task.status === 'done' ? 'todo' : 'done')}
                      index={i}
                    />
                  ))}
                  {tasks.length === 0 && (
                    <div style={{
                      padding: '16px 0', color: 'var(--text-muted)',
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

function ListRow({ task, tags, onOpen, onToggleDone, index }: {
  task: Task;
  tags: { id: string; name: string; color: string }[];
  onOpen: () => void;
  onToggleDone: () => void;
  index: number;
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
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '10px 12px', borderRadius: 10,
        background: hovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'background var(--transition)',
        cursor: 'pointer',
      }}
        onClick={onOpen}
      >
        {/* Checkbox */}
        <button
          onClick={e => { e.stopPropagation(); onToggleDone(); }}
          style={{
            width: 18, height: 18, borderRadius: 5, flexShrink: 0,
            border: `2px solid ${task.status === 'done' ? '#34d399' : 'var(--border-strong)'}`,
            background: task.status === 'done' ? '#34d399' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all var(--transition)',
          }}
        >
          {task.status === 'done' && <Check size={10} color="#fff" strokeWidth={3} />}
        </button>

        {/* Priority dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
          background: PRIORITY_COLOR[task.priority],
        }} />

        {/* Title */}
        <span style={{
          flex: 1, fontSize: 14, fontWeight: 400,
          color: 'var(--text-primary)',
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          opacity: task.status === 'done' ? 0.5 : 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {task.title}
        </span>

        {/* Tags */}
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 4 }}>
            {tags.slice(0, 2).map(t => (
              <span key={t.id} style={{
                fontSize: 10, padding: '2px 6px', borderRadius: 99,
                background: t.color + '22', color: t.color, fontWeight: 500,
              }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Due date */}
        {due && (
          <span style={{
            fontSize: 11, fontWeight: 500,
            color: isOverdue ? 'var(--priority-high)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            <Calendar size={11} />
            {isToday(due) ? 'Today' : format(due, 'MMM d')}
          </span>
        )}

        {/* Subtask count */}
        {task.subtasks.length > 0 && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
            {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
          </span>
        )}
      </div>
    </div>
  );
}
