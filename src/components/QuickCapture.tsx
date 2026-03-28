import { useState, useEffect, useRef } from 'react';
import { X, Zap } from 'lucide-react';
import { Priority } from '../types';
import { useStore } from '../store';

interface Props {
  onClose: () => void;
  onOpenFull?: (taskId: string) => void;
}

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'low',      label: 'Low',      color: 'var(--priority-low)'      },
  { value: 'medium',   label: 'Medium',   color: 'var(--priority-medium)'   },
  { value: 'high',     label: 'High',     color: 'var(--priority-high)'     },
  { value: 'critical', label: 'Critical', color: 'var(--priority-critical)' },
];

export default function QuickCapture({ onClose }: Props) {
  const { projects, addTask, activeProjectId } = useStore();
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState<string | null>(activeProjectId);
  const [priority, setPriority] = useState<Priority>('medium');
  const [saved, setSaved] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const activeProjects = projects.filter(p => !p.archived);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleSave() {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask({
      title: trimmed,
      description: '',
      status: 'todo',
      priority,
      projectId,
      tags: [],
      subtasks: [],
      dueDate: null,
    });
    setSaved(true);
    setTimeout(() => {
      setTitle('');
      setSaved(false);
      inputRef.current?.focus();
    }, 600);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1100,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-fadeup"
        style={{
          width: '100%',
          maxWidth: 480,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-xl, 16px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 3, background: 'var(--accent)' }} />

        <div style={{ padding: '16px 18px 18px' }}>
          {/* Header row */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: 'var(--r-sm)',
              background: 'var(--accent-soft)', color: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Zap size={14} strokeWidth={2.5} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', flex: 1 }}>
              Quick Capture
            </span>
            <button
              onClick={onClose}
              style={{
                width: 24, height: 24, borderRadius: 'var(--r-xs)',
                border: 'none', background: 'transparent',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'color var(--t-fast)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <X size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* Title input */}
          <input
            ref={inputRef}
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text-primary)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'inherit',
              outline: 'none',
              letterSpacing: '-0.2px',
              transition: 'border-color var(--t-base)',
              marginBottom: 12,
            }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
          />

          {/* Controls row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Priority pills */}
            <div style={{ display: 'flex', gap: 4 }}>
              {PRIORITIES.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPriority(p.value)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 'var(--r-full)',
                    border: `1px solid ${priority === p.value ? p.color : 'var(--border)'}`,
                    background: priority === p.value ? p.color + '1A' : 'transparent',
                    color: priority === p.value ? p.color : 'var(--text-muted)',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all var(--t-fast)',
                    letterSpacing: '0.03em',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <div style={{ flex: 1 }} />

            {/* Project selector */}
            {activeProjects.length > 0 && (
              <select
                value={projectId ?? ''}
                onChange={e => setProjectId(e.target.value || null)}
                style={{
                  padding: '5px 10px',
                  borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)',
                  color: 'var(--text-secondary)',
                  fontSize: 12, fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                <option value="">No project</option>
                {activeProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            )}
          </div>

          {/* Save button */}
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Press <kbd style={{ background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 10 }}>Enter</kbd> to save, <kbd style={{ background: 'var(--bg-hover)', padding: '1px 5px', borderRadius: 4, border: '1px solid var(--border)', fontSize: 10 }}>Esc</kbd> to close
            </span>
            <button
              onClick={handleSave}
              disabled={!title.trim()}
              style={{
                padding: '7px 18px',
                borderRadius: 'var(--r-sm)',
                border: 'none',
                background: saved ? '#22C55E' : (title.trim() ? 'var(--accent)' : 'var(--bg-hover)'),
                color: title.trim() ? '#fff' : 'var(--text-muted)',
                fontSize: 13, fontWeight: 700, cursor: title.trim() ? 'pointer' : 'default',
                fontFamily: 'inherit',
                transition: 'all var(--t-base)',
                boxShadow: title.trim() ? '0 2px 8px var(--accent-glow)' : 'none',
              }}
            >
              {saved ? 'Saved!' : 'Add Task'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
