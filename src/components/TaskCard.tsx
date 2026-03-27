import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Calendar, Tag, CheckSquare, ChevronRight,
  Flag, GripVertical, Trash2
} from 'lucide-react';
import { Task } from '../types';
import { useStore } from '../store';
import { format, isToday, isTomorrow, isPast, parseISO } from 'date-fns';

const PRIORITY_CONFIG = {
  high: { color: 'var(--priority-high)', bg: 'var(--priority-high-bg)', label: 'High' },
  medium: { color: 'var(--priority-medium)', bg: 'var(--priority-medium-bg)', label: 'Medium' },
  low: { color: 'var(--priority-low)', bg: 'var(--priority-low-bg)', label: 'Low' },
};

function formatDue(dateStr: string) {
  const d = parseISO(dateStr);
  if (isToday(d)) return { label: 'Today', overdue: false };
  if (isTomorrow(d)) return { label: 'Tomorrow', overdue: false };
  if (isPast(d)) return { label: format(d, 'MMM d'), overdue: true };
  return { label: format(d, 'MMM d'), overdue: false };
}

interface Props {
  task: Task;
  onOpen: (task: Task) => void;
  overlay?: boolean;
}

export default function TaskCard({ task, onOpen, overlay }: Props) {
  const { tags, deleteTask } = useStore();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });

  const [hovered, setHovered] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  };

  const p = PRIORITY_CONFIG[task.priority];
  const completedSubs = task.subtasks.filter(s => s.completed).length;
  const taskTags = tags.filter(t => task.tags.includes(t.id));
  const due = task.dueDate ? formatDue(task.dueDate) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={overlay ? 'drag-overlay' : ''}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
          borderRadius: 12,
          padding: '13px 14px',
          cursor: 'pointer',
          transition: 'border-color var(--transition), box-shadow var(--transition), transform var(--transition)',
          boxShadow: hovered ? '0 4px 20px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-1px)' : 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          position: 'relative',
        }}
        onClick={() => onOpen(task)}
      >
        {/* Top row: priority + drag + delete */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Priority badge */}
          <span style={{
            fontSize: 10, fontWeight: 600, padding: '2px 7px',
            borderRadius: 99, background: p.bg, color: p.color,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            {p.label}
          </span>

          <div style={{ flex: 1 }} />

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            onClick={e => e.stopPropagation()}
            style={{
              color: 'var(--text-muted)', cursor: 'grab', display: 'flex',
              opacity: hovered ? 1 : 0, transition: 'opacity var(--transition)',
              padding: 2,
            }}
          >
            <GripVertical size={14} />
          </div>

          {/* Delete */}
          <button
            onClick={e => { e.stopPropagation(); deleteTask(task.id); }}
            style={{
              background: 'none', border: 'none', color: 'var(--text-muted)',
              display: 'flex', padding: 2, borderRadius: 5,
              opacity: hovered ? 1 : 0, transition: 'opacity var(--transition), color var(--transition)',
              cursor: 'pointer',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--priority-high)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <Trash2 size={13} />
          </button>
        </div>

        {/* Title */}
        <p style={{
          fontSize: 14, fontWeight: 500, color: 'var(--text-primary)',
          lineHeight: 1.4,
          textDecoration: task.status === 'done' ? 'line-through' : 'none',
          opacity: task.status === 'done' ? 0.6 : 1,
        }}>
          {task.title}
        </p>

        {/* Description preview */}
        {task.description && (
          <p style={{
            fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {task.description}
          </p>
        )}

        {/* Tags */}
        {taskTags.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {taskTags.map(t => (
              <span key={t.id} style={{
                fontSize: 11, padding: '2px 8px', borderRadius: 99,
                background: t.color + '22', color: t.color, fontWeight: 500,
              }}>
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* Footer: subtasks + due date */}
        {(task.subtasks.length > 0 || task.dueDate) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            paddingTop: 8, borderTop: '1px solid var(--border)',
          }}>
            {task.subtasks.length > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 5,
                color: completedSubs === task.subtasks.length ? 'var(--priority-low)' : 'var(--text-muted)',
                fontSize: 11, fontWeight: 500,
              }}>
                <CheckSquare size={12} />
                {completedSubs}/{task.subtasks.length}
                {task.subtasks.length > 0 && (
                  <div style={{
                    flex: 1, height: 3, background: 'var(--bg-hover)',
                    borderRadius: 99, overflow: 'hidden', width: 36,
                    marginLeft: 2,
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      background: 'var(--priority-low)',
                      width: `${(completedSubs / task.subtasks.length) * 100}%`,
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                )}
              </div>
            )}

            <div style={{ flex: 1 }} />

            {due && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 500,
                color: due.overdue ? 'var(--priority-high)' : 'var(--text-muted)',
              }}>
                <Calendar size={11} />
                {due.label}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
