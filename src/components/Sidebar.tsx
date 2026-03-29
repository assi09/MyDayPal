import { useState, useEffect } from 'react';
import { Sun, Moon, Layers, Plus, Trash2, LayoutGrid, List, CalendarDays, Map, Archive, RotateCcw, Settings as SettingsIcon, FileDown } from 'lucide-react';
import { useStore } from '../store';
import iconMark from '../assets/icon-mark.svg';
import SettingsModal from './SettingsModal';
import { printHTML } from '../lib/pdf';
import { generateProjectReport } from '../lib/pdfTemplates';

const PROJECT_COLORS = [
  '#6366F1', '#EC4899', '#F59E0B', '#22C55E',
  '#14B8A6', '#3B82F6', '#EF4444', '#A855F7',
];

const ACCENT_COLORS = [
  '#6366F1', '#3B82F6', '#06B6D4', '#14B8A6',
  '#22C55E', '#F59E0B', '#F97316', '#EC4899',
  '#A855F7', '#F43F5E',
];

export default function Sidebar() {
  const {
    theme, toggleTheme,
    projects, activeProjectId, setActiveProject,
    addProject, updateProject, deleteProject, archiveProject,
    viewMode, setViewMode,
    accentColor, setAccentColor,
    tasks,
  } = useStore();

  const [addingProject, setAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState(PROJECT_COLORS[0]);
  const [hoveredProject, setHoveredProject] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Listen for open-settings event from global keyboard shortcuts
  useEffect(() => {
    function onOpenSettings() { setShowSettings(true); }
    window.addEventListener('open-settings', onOpenSettings);
    return () => window.removeEventListener('open-settings', onOpenSettings);
  }, []);

  const activeProjects = projects.filter(p => !p.archived);
  const archivedProjects = projects.filter(p => p.archived);

  function handleAddProject() {
    if (!newProjectName.trim()) return;
    addProject(newProjectName.trim(), newProjectColor);
    setNewProjectName('');
    setNewProjectColor(PROJECT_COLORS[0]);
    setAddingProject(false);
  }

  function handleUnarchiveProject(id: string) {
    updateProject(id, { archived: false });
  }

  async function handleExportProject(projectId: string) {
    const project = projects.find(p => p.id === projectId);
    if (!project) return;
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const done = projectTasks.filter(t => t.status === 'done').length;
    const ongoing = projectTasks.filter(t => t.status === 'ongoing').length;
    const todo = projectTasks.filter(t => t.status === 'todo').length;
    const html = generateProjectReport({
      generatedAt: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
      projectName: project.name,
      projectColor: project.color,
      tasks: projectTasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        dueDate: t.dueDate ?? undefined,
        subtasksDone: t.subtasks.filter(s => s.completed).length,
        subtasksTotal: t.subtasks.length,
        description: t.description || undefined,
      })),
      stats: { total: projectTasks.length, done, ongoing, todo },
    });
    await printHTML(html);
  }

  return (
    <>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      <aside style={{
        width: 252,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-sidebar)',
        borderRight: '1px solid var(--border)',
        overflow: 'hidden',
      }}>

        {/* ── Branding ── */}
        <div style={{
          padding: '22px 20px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <button
            onClick={() => setActiveProject(null)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 8,
            }}
          >
            <img
              src={iconMark}
              alt="MyDayPal"
              style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }}
            />
            <span style={{
              fontSize: 16,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: 'var(--text-primary)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
            }}>
              MyDayPal
            </span>
          </button>
        </div>

        {/* ── Nav ── */}
        <nav style={{ padding: '4px 12px 0', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <SectionLabel>Views</SectionLabel>

          <button
            className={`sidebar-item btn-press ${activeProjectId === null ? 'active' : ''}`}
            onClick={() => { setActiveProject(null); }}
          >
            <Layers size={15} strokeWidth={1.8} />
            All Tasks
          </button>
        </nav>

        {/* ── View Mode Switcher ── */}
        <div style={{ padding: '12px 12px 0' }}>
          <SectionLabel>Layout</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
            {[
              { id: 'kanban'   as const, label: 'Board',    icon: <LayoutGrid size={15} strokeWidth={1.8} /> },
              { id: 'list'     as const, label: 'List',     icon: <List size={15} strokeWidth={1.8} /> },
              { id: 'calendar' as const, label: 'Calendar', icon: <CalendarDays size={15} strokeWidth={1.8} /> },
              { id: 'roadmap'  as const, label: 'Roadmap',  icon: <Map size={15} strokeWidth={1.8} /> },
            ].map(v => (
              <button
                key={v.id}
                className={`sidebar-item btn-press ${viewMode === v.id ? 'active' : ''}`}
                onClick={() => setViewMode(v.id)}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Projects ── */}
        <div style={{ padding: '16px 12px 0', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 6 }}>
            <SectionLabel style={{ flex: 1, marginBottom: 0 }}>Projects</SectionLabel>
            <button
              onClick={() => setAddingProject(true)}
              style={{
                width: 22, height: 22,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                transition: 'background var(--t-base), color var(--t-base)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="New project"
            >
              <Plus size={13} strokeWidth={2.5} />
            </button>
          </div>

          {/* New project input */}
          {addingProject && (
            <div className="animate-fadeup" style={{ marginBottom: 6 }}>
              <input
                autoFocus
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddProject();
                  if (e.key === 'Escape') { setAddingProject(false); setNewProjectName(''); }
                }}
                placeholder="Project name…"
                className="field-focus"
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: 8,
                  border: '1px solid var(--border-strong)',
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  marginBottom: 6,
                }}
              />
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '0 2px 6px' }}>
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewProjectColor(c)}
                    style={{
                      width: 18, height: 18, borderRadius: '50%',
                      background: c,
                      border: newProjectColor === c ? `2.5px solid var(--text-primary)` : '2.5px solid transparent',
                      cursor: 'pointer',
                      transition: 'border-color var(--t-fast)',
                      outline: 'none',
                      boxShadow: newProjectColor === c ? `0 0 0 1px ${c}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Project list */}
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {activeProjects.length === 0 && !addingProject && (
              <div style={{
                padding: '12px 8px',
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.5,
              }}>
                No projects yet. Hit + to create one.
              </div>
            )}
            {activeProjects.map(p => (
              <div
                key={p.id}
                style={{ position: 'relative' }}
                onMouseEnter={() => setHoveredProject(p.id)}
                onMouseLeave={() => setHoveredProject(null)}
              >
                <button
                  className={`sidebar-item btn-press ${activeProjectId === p.id ? 'active' : ''}`}
                  onClick={() => setActiveProject(p.id)}
                  style={{ paddingRight: 78 }}
                >
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: p.color,
                    flexShrink: 0,
                    boxShadow: activeProjectId === p.id ? `0 0 6px ${p.color}88` : 'none',
                    transition: 'box-shadow var(--t-base)',
                  }} />
                  <span style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {p.name}
                  </span>
                </button>

                {/* Export button */}
                <button
                  onClick={e => { e.stopPropagation(); handleExportProject(p.id); }}
                  style={{
                    position: 'absolute',
                    right: 52, top: '50%', transform: 'translateY(-50%)',
                    width: 20, height: 20, borderRadius: 5,
                    border: 'none', background: 'transparent',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: hoveredProject === p.id ? 1 : 0,
                    transition: 'opacity var(--t-base), color var(--t-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Export project report"
                >
                  <FileDown size={11} />
                </button>

                {/* Archive button */}
                <button
                  onClick={e => { e.stopPropagation(); archiveProject(p.id); }}
                  style={{
                    position: 'absolute',
                    right: 30, top: '50%', transform: 'translateY(-50%)',
                    width: 20, height: 20, borderRadius: 5,
                    border: 'none', background: 'transparent',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: hoveredProject === p.id ? 1 : 0.3,
                    transition: 'opacity var(--t-base), color var(--t-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Archive project"
                >
                  <Archive size={11} />
                </button>

                {/* Delete button */}
                <button
                  onClick={e => { e.stopPropagation(); deleteProject(p.id); }}
                  style={{
                    position: 'absolute',
                    right: 8, top: '50%', transform: 'translateY(-50%)',
                    width: 20, height: 20, borderRadius: 5,
                    border: 'none', background: 'transparent',
                    color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    opacity: hoveredProject === p.id ? 1 : 0,
                    transition: 'opacity var(--t-base), color var(--t-fast)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--priority-high)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Delete project"
                >
                  <Trash2 size={11} />
                </button>
              </div>
            ))}

            {/* ── Archived section ── */}
            {archivedProjects.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => setShowArchived(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: 10.5, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    padding: '4px 4px', width: '100%', fontFamily: 'inherit',
                    transition: 'color var(--t-base)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >
                  <Archive size={10} strokeWidth={2} />
                  Archived ({archivedProjects.length})
                  <span style={{ marginLeft: 'auto', fontSize: 9 }}>{showArchived ? '▲' : '▼'}</span>
                </button>

                {showArchived && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                    {archivedProjects.map(p => (
                      <div
                        key={p.id}
                        style={{ position: 'relative' }}
                        onMouseEnter={() => setHoveredProject(p.id)}
                        onMouseLeave={() => setHoveredProject(null)}
                      >
                        <button
                          className="sidebar-item btn-press"
                          onClick={() => setActiveProject(p.id)}
                          style={{ paddingRight: 32, opacity: 0.55 }}
                        >
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%',
                            background: p.color, flexShrink: 0,
                          }} />
                          <span style={{
                            flex: 1, overflow: 'hidden',
                            textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            textDecoration: 'line-through',
                          }}>
                            {p.name}
                          </span>
                        </button>

                        {/* Unarchive button */}
                        <button
                          onClick={e => { e.stopPropagation(); handleUnarchiveProject(p.id); }}
                          style={{
                            position: 'absolute',
                            right: 8, top: '50%', transform: 'translateY(-50%)',
                            width: 20, height: 20, borderRadius: 5,
                            border: 'none', background: 'transparent',
                            color: 'var(--text-muted)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer',
                            opacity: hoveredProject === p.id ? 1 : 0,
                            transition: 'opacity var(--t-base), color var(--t-fast)',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
                          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                          title="Unarchive project"
                        >
                          <RotateCcw size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Bottom area ── */}
        <div style={{
          padding: '12px 12px 20px',
          borderTop: '1px solid var(--border)',
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* ── Appearance / Accent color ── */}
          <div>
            <SectionLabel style={{ marginBottom: 6 }}>Accent Color</SectionLabel>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', padding: '0 2px' }}>
              {ACCENT_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setAccentColor(c)}
                  title={c}
                  style={{
                    width: 16, height: 16, borderRadius: '50%',
                    background: c,
                    border: accentColor === c ? `2px solid var(--text-primary)` : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'border-color var(--t-fast), transform var(--t-fast)',
                    outline: 'none',
                    boxShadow: accentColor === c ? `0 0 0 1px ${c}` : 'none',
                    transform: accentColor === c ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* ── Theme toggle ── */}
          <button
            onClick={toggleTheme}
            className="sidebar-item btn-press"
            style={{ width: '100%', justifyContent: 'space-between' }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {theme === 'dark'
                ? <Moon size={15} strokeWidth={1.8} />
                : <Sun size={15} strokeWidth={1.8} />
              }
              {theme === 'dark' ? 'Dark mode' : 'Light mode'}
            </span>
            {/* Toggle pill */}
            <div style={{
              width: 34, height: 19, borderRadius: 10,
              background: theme === 'dark' ? 'var(--accent)' : 'var(--bg-hover)',
              border: '1px solid var(--border)',
              position: 'relative',
              transition: 'background var(--t-base)',
              flexShrink: 0,
            }}>
              <div style={{
                position: 'absolute',
                top: 2,
                left: theme === 'dark' ? 16 : 2,
                width: 13, height: 13,
                borderRadius: '50%',
                background: theme === 'dark' ? '#fff' : 'var(--text-muted)',
                transition: 'left var(--t-spring)',
              }} />
            </div>
          </button>

          {/* ── Settings gear button ── */}
          <button
            onClick={() => setShowSettings(true)}
            className="sidebar-item btn-press"
            style={{ width: '100%' }}
            title="Open Settings (⌘,)"
          >
            <SettingsIcon size={15} strokeWidth={1.8} />
            Settings
          </button>
        </div>
      </aside>
    </>
  );
}

function SectionLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      fontSize: 10.5,
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      color: 'var(--text-muted)',
      padding: '0 4px',
      marginBottom: 4,
      ...style,
    }}>
      {children}
    </div>
  );
}
