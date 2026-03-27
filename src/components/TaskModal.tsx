import React, { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Trash2, Check, Calendar, Flag,
  Tag, AlignLeft, Layers, ChevronDown, CheckSquare
} from 'lucide-react';
import { Task, Priority, Status, SubTask } from '../types';
import { useStore } from '../store';
import { format } from 'date-fns';

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'high', label: 'High', color: 'var(--priority-high)' },
  { value: 'medium', label: 'Medium', color: 'var(--priority-medium)' },
  { value: 'low', label: 'Low', color: 'var(--priority-low)' },
];

const STATUSES: { value: Status; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'done', label: 'Done' },
];

interface Props {
  task: Task | null;
  onClose: () => void;
  defaultStatus?: Status;
}

export default function TaskModal({ task, onClose, defaultStatus = 'todo' }: Props) {
  const { projects, tags, addTask, updateTask, addTag, addSubtask, toggleSubtask, deleteSubtask } = useStore();

  const isNew = !task;

  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [status, setStatus] = useState<Status>(task?.status ?? defaultStatus);
  const [projectId, setProjectId] = useState<string | null>(task?.projectId ?? null);
  const [selectedTags, setSelectedTags] = useState<string[]>(task?.tags ?? []);
  const [dueDate, setDueDate] = useState<string>(task?.dueDate ?? '');
  const [newSubtask, setNewSubtask] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [addingTag, setAddingTag] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  // Sync live updates for existing task
  useEffect(() => {
    if (!isNew && task) {
      updateTask(task.id, { title, description, priority, status, projectId, tags: selectedTags, dueDate: dueDate || null });
    }
  }, [title, description, priority, status, projectId, selectedTags, dueDate]);

  function handleSave() {
    if (!title.trim()) return;
    if (isNew) {
      addTask({
        title: title.trim(),
        description,
        priority,
        status,
        projectId,
        tags: selectedTags,
        subtasks: [],
        dueDate: dueDate || null,
      });
    }
    onClose();
  }

  function handleAddSubtask() {
    if (!newSubtask.trim() || !task) return;
    addSubtask(task.id, newSubtask.trim());
    setNewSubtask('');
  }

  function handleAddTag() {
    if (!newTagName.trim()) return;
    const colors = ['#818cf8', '#34d399', '#f87171', '#fbbf24', '#60a5fa', '#f472b6'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const tag = addTag(newTagName.trim(), color);
    setSelectedTags(prev => [...prev, tag.id]);
    setNewTagName('');
    setAddingTag(false);
  }

  function toggleTag(id: string) {
    setSelectedTags(prev => prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]);
  }

  const currentTask = useStore(s => s.tasks.find(t => t.id === task?.id));

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) handleSave(); }}
    >
      <div
        className="animate-scale"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-strong)',
          borderRadius: 18,
          width: '100%', maxWidth: 580,
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'flex-start', gap: 12,
        }}>
          <input
            ref={titleRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') onClose(); }}
            placeholder="Task title…"
            style={{
              flex: 1, background: 'none', border: 'none',
              fontSize: 18, fontWeight: 600, color: 'var(--text-primary)',
              lineHeight: 1.3,
            }}
          />
          <button
            onClick={onClose}
            style={{
              background: 'var(--bg-hover)', border: 'none', borderRadius: 8,
              color: 'var(--text-secondary)', display: 'flex', padding: 6,
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {/* Metadata row */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {/* Status */}
            <MetaSelect
              label="Status"
              value={status}
              onChange={v => setStatus(v as Status)}
              options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
            />

            {/* Priority */}
            <div style={{ position: 'relative' }}>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                style={{
                  padding: '6px 12px', borderRadius: 8,
                  border: `1px solid ${PRIORITIES.find(p => p.value === priority)?.color}44`,
                  background: `${PRIORITIES.find(p => p.value === priority)?.color}18`,
                  color: PRIORITIES.find(p => p.value === priority)?.color,
                  fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  appearance: 'none', paddingRight: 24,
                }}
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label} Priority</option>
                ))}
              </select>
            </div>

            {/* Project */}
            <MetaSelect
              label="Project"
              value={projectId ?? ''}
              onChange={v => setProjectId(v || null)}
              options={[
                { value: '', label: 'No Project' },
                ...projects.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>

          {/* Description */}
          <Section icon={<AlignLeft size={14} />} label="Description">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={3}
              style={{
                width: '100%', background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)', borderRadius: 10,
                color: 'var(--text-primary)', fontSize: 13, padding: '10px 12px',
                resize: 'vertical', lineHeight: 1.6,
                transition: 'border-color var(--transition)',
              }}
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
              onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          </Section>

          {/* Due Date */}
          <Section icon={<Calendar size={14} />} label="Due Date">
            <input
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              style={{
                padding: '7px 12px', background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)', borderRadius: 8,
                color: 'var(--text-primary)', fontSize: 13,
                colorScheme: 'dark',
              }}
            />
            {dueDate && (
              <button
                onClick={() => setDueDate('')}
                style={{
                  background: 'none', border: 'none', color: 'var(--text-muted)',
                  fontSize: 12, cursor: 'pointer', marginLeft: 6,
                }}
              >
                Clear
              </button>
            )}
          </Section>

          {/* Tags */}
          <Section icon={<Tag size={14} />} label="Tags">
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              {tags.map(t => (
                <button
                  key={t.id}
                  onClick={() => toggleTag(t.id)}
                  style={{
                    padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                    border: `1px solid ${selectedTags.includes(t.id) ? t.color : 'var(--border)'}`,
                    background: selectedTags.includes(t.id) ? t.color + '22' : 'transparent',
                    color: selectedTags.includes(t.id) ? t.color : 'var(--text-muted)',
                    cursor: 'pointer', transition: 'all var(--transition)',
                  }}
                >
                  {t.name}
                </button>
              ))}
              {addingTag ? (
                <input
                  autoFocus
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') setAddingTag(false); }}
                  placeholder="Tag name…"
                  style={{
                    padding: '4px 8px', borderRadius: 8, fontSize: 12,
                    border: '1px solid var(--accent)', background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', width: 90,
                  }}
                />
              ) : (
                <button
                  onClick={() => setAddingTag(true)}
                  style={{
                    padding: '4px 8px', borderRadius: 99, fontSize: 12,
                    border: '1px dashed var(--border)', background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  <Plus size={11} /> New tag
                </button>
              )}
            </div>
          </Section>

          {/* Subtasks — only for existing tasks */}
          {!isNew && currentTask && (
            <Section icon={<CheckSquare size={14} />} label="Subtasks">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {currentTask.subtasks.map(s => (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button
                      onClick={() => toggleSubtask(task!.id, s.id)}
                      style={{
                        width: 18, height: 18, borderRadius: 5, border: `2px solid ${s.completed ? 'var(--accent)' : 'var(--border-strong)'}`,
                        background: s.completed ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', flexShrink: 0, transition: 'all var(--transition)',
                      }}
                    >
                      {s.completed && <Check size={10} color="#fff" strokeWidth={3} />}
                    </button>
                    <span style={{
                      flex: 1, fontSize: 13, color: 'var(--text-primary)',
                      textDecoration: s.completed ? 'line-through' : 'none',
                      opacity: s.completed ? 0.5 : 1,
                    }}>
                      {s.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(task!.id, s.id)}
                      style={{
                        background: 'none', border: 'none', color: 'var(--text-muted)',
                        cursor: 'pointer', display: 'flex', padding: 2, opacity: 0.5,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}

                {/* Add subtask */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
                  <input
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(); }}
                    placeholder="Add subtask…"
                    style={{
                      flex: 1, padding: '6px 10px', background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)', borderRadius: 8,
                      color: 'var(--text-primary)', fontSize: 13,
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                  <button
                    onClick={handleAddSubtask}
                    style={{
                      background: 'var(--accent-soft)', border: 'none',
                      color: 'var(--accent)', borderRadius: 8, padding: '6px 10px',
                      cursor: 'pointer', display: 'flex',
                    }}
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            </Section>
          )}
        </div>

        {/* Footer */}
        {isNew && (
          <div style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '9px 18px', borderRadius: 9, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', fontSize: 13,
                fontWeight: 500, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              style={{
                padding: '9px 22px', borderRadius: 9, border: 'none',
                background: title.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: title.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 600, cursor: title.trim() ? 'pointer' : 'not-allowed',
                boxShadow: title.trim() ? '0 4px 12px var(--accent-glow)' : 'none',
                transition: 'all var(--transition)',
              }}
            >
              Add Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: 'var(--text-muted)' }}>
        {icon}
        <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

function MetaSelect({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '6px 12px', borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        appearance: 'none', paddingRight: 24,
      }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
