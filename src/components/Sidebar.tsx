import { useState } from 'react';
import {
  LayoutDashboard, Plus, Trash2, Sun, Moon,
  CheckSquare, ChevronRight,
} from 'lucide-react';
import { useStore } from '../store';

const PROJECT_COLORS = [
  '#7c6af7', '#f87171', '#34d399', '#fbbf24',
  '#60a5fa', '#f472b6', '#a78bfa', '#2dd4bf',
];

export default function Sidebar() {
  const {
    projects, activeProjectId, theme,
    addProject, deleteProject, setActiveProject, toggleTheme,
  } = useStore();

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);

  function handleAdd() {
    if (!newName.trim()) return;
    addProject(newName.trim(), newColor);
    setNewName('');
    setNewColor(PROJECT_COLORS[0]);
    setAdding(false);
  }

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        height: '100vh',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        gap: 0,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '0 20px 24px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg, #7c6af7, #a78bfa)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(124,106,247,0.4)',
        }}>
          <CheckSquare size={17} color="#fff" strokeWidth={2.5} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px', color: 'var(--text-primary)' }}>
          MyDayPal
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '0 10px' }}>
        {/* All Tasks */}
        <SidebarItem
          icon={<LayoutDashboard size={16} />}
          label="All Tasks"
          active={activeProjectId === null}
          onClick={() => setActiveProject(null)}
        />

        {/* Projects section */}
        <div style={{ marginTop: 20 }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '0 10px', marginBottom: 6,
          }}>
            <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)' }}>
              Projects
            </span>
            <button
              onClick={() => setAdding(true)}
              style={{
                background: 'none', border: 'none', color: 'var(--text-muted)',
                cursor: 'pointer', padding: 2, borderRadius: 4, display: 'flex',
                transition: 'color var(--transition)',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <Plus size={14} />
            </button>
          </div>

          {projects.map(p => (
            <div
              key={p.id}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <SidebarItem
                icon={
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: p.color, display: 'inline-block', flexShrink: 0,
                  }} />
                }
                label={p.name}
                active={activeProjectId === p.id}
                onClick={() => setActiveProject(p.id)}
                style={{ flex: 1 }}
              />
              <button
                onClick={() => deleteProject(p.id)}
                style={{
                  background: 'none', border: 'none', color: 'transparent',
                  cursor: 'pointer', padding: '6px 6px', borderRadius: 6,
                  display: 'flex', transition: 'color var(--transition)',
                  flexShrink: 0,
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--priority-high)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'transparent')}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Add project form */}
          {adding && (
            <div className="animate-fade" style={{
              margin: '8px 4px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              padding: 10,
            }}>
              <input
                autoFocus
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setAdding(false); }}
                placeholder="Project name…"
                style={{
                  width: '100%', background: 'none', border: 'none',
                  color: 'var(--text-primary)', fontSize: 13, marginBottom: 8,
                  padding: '2px 0',
                }}
              />
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 8 }}>
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    style={{
                      width: 16, height: 16, borderRadius: '50%', background: c,
                      border: newColor === c ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer', padding: 0,
                      outline: newColor === c ? `2px solid ${c}` : 'none',
                      outlineOffset: 1,
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleAdd}
                  style={{
                    flex: 1, background: 'var(--accent)', border: 'none', color: '#fff',
                    borderRadius: 6, padding: '5px 0', fontSize: 12, fontWeight: 600,
                  }}
                >
                  Add
                </button>
                <button
                  onClick={() => setAdding(false)}
                  style={{
                    flex: 1, background: 'var(--bg-hover)', border: 'none',
                    color: 'var(--text-secondary)', borderRadius: 6, padding: '5px 0', fontSize: 12,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Bottom: theme toggle */}
      <div style={{ padding: '12px 10px 0', borderTop: '1px solid var(--border)' }}>
        <SidebarItem
          icon={theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          label={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
          active={false}
          onClick={toggleTheme}
        />
      </div>
    </aside>
  );
}

function SidebarItem({
  icon, label, active, onClick, style: extraStyle,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
        background: active ? 'var(--accent-soft)' : 'transparent',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        fontSize: 13, fontWeight: active ? 600 : 400,
        transition: 'background var(--transition), color var(--transition)',
        textAlign: 'left',
        ...extraStyle,
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'var(--bg-hover)';
          e.currentTarget.style.color = 'var(--text-primary)';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = 'var(--text-secondary)';
        }
      }}
    >
      {icon}
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
      {active && <ChevronRight size={12} style={{ opacity: 0.5, flexShrink: 0 }} />}
    </button>
  );
}
