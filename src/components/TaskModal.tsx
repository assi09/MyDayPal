import { useState, useEffect, useRef } from 'react';
import {
  X, Plus, Trash2, Check, Calendar,
  Tag, AlignLeft, CheckSquare, Zap,
} from 'lucide-react';
import { Task, Priority, Status, Complexity } from '../types';
import { useStore } from '../store';

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'critical', label: 'Critical', color: '#DC2626' },
  { value: 'high',     label: 'High',     color: '#F97316' },
  { value: 'medium',   label: 'Medium',   color: '#F59E0B' },
  { value: 'low',      label: 'Low',      color: '#22C55E' },
];

const STATUSES: { value: Status; label: string }[] = [
  { value: 'todo',    label: 'To Do' },
  { value: 'ongoing', label: 'In Progress' },
  { value: 'done',    label: 'Done' },
];

interface Props {
  task: Task | null;
  onClose: () => void;
  defaultStatus?: Status;
  defaultDueDate?: string;
}

export default function TaskModal({ task, onClose, defaultStatus = 'todo', defaultDueDate = '' }: Props) {
  const { projects, tags, addTask, updateTask, addTag, addSubtask, toggleSubtask, deleteSubtask } = useStore();

  const isNew = !task;

  const [title, setTitle]               = useState(task?.title ?? '');
  const [description, setDescription]   = useState(task?.description ?? '');
  const [priority, setPriority]         = useState<Priority>(task?.priority ?? 'medium');
  const [status, setStatus]             = useState<Status>(task?.status ?? defaultStatus);
  const [projectId, setProjectId]       = useState<string | null>(task?.projectId ?? null);
  const [selectedTags, setSelectedTags] = useState<string[]>(task?.tags ?? []);
  const [dueDate, setDueDate]           = useState<string>(task?.dueDate ?? defaultDueDate);
  const [complexity, setComplexity]     = useState<Complexity>(task?.complexity ?? 3);
  const [newSubtask, setNewSubtask]     = useState('');
  const [newTagName, setNewTagName]     = useState('');
  const [addingTag, setAddingTag]       = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => titleRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (!isNew && task) {
      updateTask(task.id, {
        title, description, priority, status,
        projectId, tags: selectedTags,
        dueDate: dueDate || null, complexity,
      });
    }
  }, [title, description, priority, status, projectId, selectedTags, dueDate, complexity]);

  function handleSave() {
    if (!title.trim()) return;
    if (isNew) {
      addTask({
        title: title.trim(), description, priority, status,
        projectId, tags: selectedTags, subtasks: [],
        dueDate: dueDate || null, complexity,
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
    const colors = ['#6366F1', '#22C55E', '#EF4444', '#F59E0B', '#3B82F6', '#EC4899'];
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
  const activePriority = PRIORITIES.find(p => p.value === priority)!;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.50)',
        backdropFilter: 'blur(6px)',
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
          borderRadius: 'var(--r-xl)',
          width: '100%', maxWidth: 560,
          maxHeight: '88vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: 'var(--shadow-modal)',
          overflow: 'hidden',
        }}
      >
        {/* ── Modal header ── */}
        <div style={{
          padding: '20px 22px 16px',
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
              fontSize: 18, fontWeight: 700, color: 'var(--text-primary)',
              letterSpacing: '-0.4px', lineHeight: 1.3,
              fontFamily: 'inherit',
            }}
          />
          <button
            onClick={onClose}
            className="btn-press"
            style={{
              background: 'var(--bg-hover)', border: 'none',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text-muted)', display: 'flex', padding: 7,
              cursor: 'pointer', flexShrink: 0,
              transition: 'background var(--t-base), color var(--t-base)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {/* ── Metadata pills ── */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
            {/* Status */}
            <MetaChip
              value={status}
              onChange={v => setStatus(v as Status)}
              options={STATUSES.map(s => ({ value: s.value, label: s.label }))}
            />

            {/* Priority */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as Priority)}
                style={{
                  appearance: 'none',
                  padding: '5px 24px 5px 10px',
                  borderRadius: 'var(--r-full)',
                  border: `1px solid ${activePriority.color}40`,
                  background: activePriority.color + '14',
                  color: activePriority.color,
                  fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'all var(--t-base)',
                }}
              >
                {PRIORITIES.map(p => (
                  <option key={p.value} value={p.value}>{p.label} Priority</option>
                ))}
              </select>
              <div style={{
                width: 5, height: 5, borderRadius: '50%',
                background: activePriority.color,
                position: 'absolute', right: 10, pointerEvents: 'none',
              }} />
            </div>

            {/* Project */}
            <MetaChip
              value={projectId ?? ''}
              onChange={v => setProjectId(v || null)}
              options={[
                { value: '', label: 'No Project' },
                ...projects.map(p => ({ value: p.id, label: p.name })),
              ]}
            />
          </div>

          {/* ── Description ── */}
          <FieldSection icon={<AlignLeft size={13} />} label="Description">
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Add a description…"
              rows={3}
              className="field-focus"
              style={{
                width: '100%', background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-sm)',
                color: 'var(--text-primary)', fontSize: 13,
                padding: '10px 12px', resize: 'vertical',
                lineHeight: 1.6, fontFamily: 'inherit',
              }}
            />
          </FieldSection>

          {/* ── Due Date ── */}
          <FieldSection icon={<Calendar size={13} />} label="Due Date">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="field-focus"
                style={{
                  padding: '7px 11px',
                  background: 'var(--bg-tertiary)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  color: 'var(--text-primary)', fontSize: 13,
                  fontFamily: 'inherit',
                  colorScheme: 'light dark',
                }}
              />
              {dueDate && (
                <button
                  onClick={() => setDueDate('')}
                  style={{
                    background: 'none', border: 'none',
                    color: 'var(--text-muted)', fontSize: 12,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          </FieldSection>

          {/* ── Complexity ── */}
          <FieldSection icon={<Zap size={13} />} label="Complexity">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {([1, 2, 3, 4, 5] as Complexity[]).map(n => {
                const labels = ['Trivial', 'Simple', 'Moderate', 'Hard', 'Epic'];
                const active = n <= complexity;
                return (
                  <button
                    key={n}
                    onClick={() => setComplexity(n)}
                    title={labels[n - 1]}
                    className="btn-press"
                    style={{
                      width: 28, height: 28,
                      borderRadius: 'var(--r-sm)',
                      border: `1.5px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                      background: active ? 'var(--accent-soft)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 12, fontWeight: 700,
                      cursor: 'pointer', fontFamily: 'inherit',
                      transition: 'all var(--t-base)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {n}
                  </button>
                );
              })}
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 6 }}>
                {['Trivial', 'Simple', 'Moderate', 'Hard', 'Epic'][complexity - 1]}
              </span>
            </div>
          </FieldSection>

          {/* ── Tags ── */}
          <FieldSection icon={<Tag size={13} />} label="Tags">
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
              {tags.map(t => {
                const active = selectedTags.includes(t.id);
                return (
                  <button
                    key={t.id}
                    onClick={() => toggleTag(t.id)}
                    className="btn-press"
                    style={{
                      padding: '4px 10px', borderRadius: 'var(--r-full)',
                      fontSize: 12, fontWeight: 600,
                      border: `1px solid ${active ? t.color + '60' : 'var(--border)'}`,
                      background: active ? t.color + '18' : 'transparent',
                      color: active ? t.color : 'var(--text-muted)',
                      cursor: 'pointer', transition: 'all var(--t-base)',
                      fontFamily: 'inherit',
                    }}
                  >
                    {t.name}
                  </button>
                );
              })}
              {addingTag ? (
                <input
                  autoFocus
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddTag();
                    if (e.key === 'Escape') setAddingTag(false);
                  }}
                  placeholder="Tag name…"
                  className="field-focus"
                  style={{
                    padding: '4px 9px', borderRadius: 'var(--r-sm)',
                    fontSize: 12, fontFamily: 'inherit',
                    border: '1px solid var(--accent)',
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)', width: 90,
                  }}
                />
              ) : (
                <button
                  onClick={() => setAddingTag(true)}
                  style={{
                    padding: '4px 9px', borderRadius: 'var(--r-full)',
                    fontSize: 12, fontWeight: 500,
                    border: '1.5px dashed var(--border)',
                    background: 'transparent',
                    color: 'var(--text-muted)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 4,
                    fontFamily: 'inherit',
                    transition: 'border-color var(--t-base), color var(--t-base)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <Plus size={11} strokeWidth={2.5} /> New tag
                </button>
              )}
            </div>
          </FieldSection>

          {/* ── Subtasks (existing tasks only) ── */}
          {!isNew && currentTask && (
            <FieldSection icon={<CheckSquare size={13} />} label="Subtasks">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {currentTask.subtasks.map(s => (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 9,
                    padding: '6px 4px', borderRadius: 'var(--r-sm)',
                  }}>
                    <button
                      onClick={() => toggleSubtask(task!.id, s.id)}
                      className="btn-press"
                      style={{
                        width: 17, height: 17, borderRadius: 5, flexShrink: 0,
                        border: `2px solid ${s.completed ? 'var(--accent)' : 'var(--border-strong)'}`,
                        background: s.completed ? 'var(--accent)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', transition: 'all var(--t-base)',
                      }}
                    >
                      {s.completed && <Check size={9} color="#fff" strokeWidth={3} />}
                    </button>
                    <span style={{
                      flex: 1, fontSize: 13, color: 'var(--text-primary)',
                      textDecoration: s.completed ? 'line-through' : 'none',
                      opacity: s.completed ? 0.45 : 1,
                    }}>
                      {s.title}
                    </span>
                    <button
                      onClick={() => deleteSubtask(task!.id, s.id)}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        display: 'flex', padding: 2, opacity: 0.4,
                        transition: 'opacity var(--t-base)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '0.4')}
                    >
                      <Trash2 size={12} strokeWidth={1.8} />
                    </button>
                  </div>
                ))}

                {/* Add subtask input */}
                <div style={{ display: 'flex', gap: 7, alignItems: 'center', marginTop: 4 }}>
                  <input
                    value={newSubtask}
                    onChange={e => setNewSubtask(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') handleAddSubtask(); }}
                    placeholder="Add subtask…"
                    className="field-focus"
                    style={{
                      flex: 1, padding: '6px 10px',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      color: 'var(--text-primary)', fontSize: 13,
                      fontFamily: 'inherit',
                    }}
                  />
                  <button
                    onClick={handleAddSubtask}
                    className="btn-press"
                    style={{
                      background: 'var(--accent-soft)', border: 'none',
                      color: 'var(--accent)', borderRadius: 'var(--r-sm)',
                      padding: '6px 9px', cursor: 'pointer', display: 'flex',
                    }}
                  >
                    <Plus size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>
            </FieldSection>
          )}
        </div>

        {/* ── Footer (new task only) ── */}
        {isNew && (
          <div style={{
            padding: '14px 22px',
            borderTop: '1px solid var(--border)',
            display: 'flex', gap: 8, justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              className="btn-press"
              style={{
                padding: '9px 18px', borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'background var(--t-base)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              className="btn-press"
              style={{
                padding: '9px 22px', borderRadius: 'var(--r-md)', border: 'none',
                background: title.trim() ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: title.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 700, letterSpacing: '-0.1px',
                cursor: title.trim() ? 'pointer' : 'not-allowed',
                boxShadow: title.trim() ? '0 4px 14px var(--accent-glow)' : 'none',
                transition: 'all var(--t-base)',
                fontFamily: 'inherit',
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

function FieldSection({ icon, label, children }: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        marginBottom: 8, color: 'var(--text-muted)',
      }}>
        {icon}
        <span style={{
          fontSize: 10.5, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.08em',
        }}>
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

function MetaChip({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          padding: '5px 22px 5px 10px',
          borderRadius: 'var(--r-full)',
          border: '1px solid var(--border)',
          background: 'var(--bg-tertiary)',
          color: 'var(--text-secondary)',
          fontSize: 12, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div style={{
        position: 'absolute', right: 8, pointerEvents: 'none',
        width: 4, height: 4, borderRadius: '50%',
        background: 'var(--text-muted)',
      }} />
    </div>
  );
}
