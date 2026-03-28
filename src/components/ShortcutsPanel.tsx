import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

interface ShortcutGroup {
  category: string;
  items: Shortcut[];
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent);
const CMD = isMac ? '⌘' : 'Ctrl';

const SHORTCUTS: ShortcutGroup[] = [
  {
    category: 'Tasks',
    items: [
      { keys: [`${CMD}N`],          description: 'Quick capture — add a task instantly' },
    ],
  },
  {
    category: 'Views',
    items: [
      { keys: [`${CMD}1`], description: 'Switch to Board view' },
      { keys: [`${CMD}2`], description: 'Switch to List view' },
      { keys: [`${CMD}3`], description: 'Switch to Calendar view' },
      { keys: [`${CMD}4`], description: 'Switch to Roadmap view' },
    ],
  },
  {
    category: 'Navigation',
    items: [
      { keys: [`${CMD}F`],     description: 'Focus search' },
      { keys: [`${CMD},`],     description: 'Open Settings' },
      { keys: ['?'],           description: 'Open this shortcuts panel' },
      { keys: ['Esc'],         description: 'Close any modal' },
    ],
  },
];

function KbdKey({ label }: { label: string }) {
  return (
    <kbd style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 22, height: 22, padding: '0 6px',
      background: 'var(--bg-tertiary)',
      border: '1px solid var(--border-strong)',
      borderRadius: 5,
      fontSize: 11, fontWeight: 700,
      color: 'var(--text-secondary)',
      fontFamily: 'inherit',
      letterSpacing: '0.01em',
      boxShadow: '0 1.5px 0 var(--border-strong)',
      whiteSpace: 'nowrap',
    }}>
      {label}
    </kbd>
  );
}

export default function ShortcutsPanel({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(4px)',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-fadeup"
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--bg)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-xl, 16px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.4px', margin: 0 }}>
              Keyboard Shortcuts
            </h2>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
              Press <strong style={{ color: 'var(--text-secondary)' }}>?</strong> to toggle this panel
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all var(--t-base)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={13} strokeWidth={2.2} />
          </button>
        </div>

        {/* Shortcuts list */}
        <div style={{ padding: '16px 22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {SHORTCUTS.map(group => (
            <div key={group.category}>
              <div style={{
                fontSize: 10.5, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--text-muted)',
                marginBottom: 8,
              }}>
                {group.category}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex', alignItems: 'center',
                      padding: '7px 10px',
                      borderRadius: 'var(--r-sm)',
                      gap: 12,
                      background: 'var(--bg-secondary)',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {item.keys.map((k, ki) => (
                        <KbdKey key={ki} label={k} />
                      ))}
                    </div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                      {item.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
