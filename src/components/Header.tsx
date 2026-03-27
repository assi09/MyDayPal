import { Search, LayoutGrid, List, X } from 'lucide-react';
import { useStore } from '../store';
import { Priority } from '../types';

export default function Header() {
  const {
    activeProjectId, projects, viewMode, setViewMode,
    searchQuery, setSearchQuery,
    filterPriority, setFilterPriority,
    filterTag, setFilterTag,
    tags,
  } = useStore();

  const projectName = activeProjectId
    ? projects.find(p => p.id === activeProjectId)?.name ?? 'Project'
    : 'All Tasks';

  const hasFilters = filterPriority !== 'all' || filterTag !== 'all' || searchQuery !== '';

  return (
    <header style={{
      padding: '28px 32px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 18,
      flexShrink: 0,
      borderBottom: '1px solid var(--border)',
      paddingBottom: 20,
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontSize: 28, fontWeight: 800, letterSpacing: '-0.8px',
            color: 'var(--text-primary)',
            lineHeight: 1,
          }}>
            {projectName}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 400 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* View toggle */}
        <div style={{
          display: 'flex', background: 'var(--bg-tertiary)',
          borderRadius: 12, padding: 4, border: '1px solid var(--border)',
          gap: 2,
        }}>
          {(['kanban', 'list'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 9, border: 'none',
                background: viewMode === mode ? 'var(--accent)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--text-secondary)',
                fontSize: 13, fontWeight: 600,
                transition: 'all var(--transition)',
                cursor: 'pointer',
              }}
            >
              {mode === 'kanban' ? <LayoutGrid size={15} /> : <List size={15} />}
              {mode === 'kanban' ? 'Board' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {/* Search + filters row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Search */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 12,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '11px 16px',
          transition: 'border-color var(--transition)',
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks…"
            style={{
              flex: 1, background: 'none', border: 'none',
              color: 'var(--text-primary)', fontSize: 14,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: 0, cursor: 'pointer' }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Priority filter */}
        <FilterSelect
          value={filterPriority}
          onChange={v => setFilterPriority(v as Priority | 'all')}
          options={[
            { value: 'all', label: 'All Priority' },
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ]}
        />

        {/* Tag filter */}
        <FilterSelect
          value={filterTag}
          onChange={v => setFilterTag(v)}
          options={[
            { value: 'all', label: 'All Tags' },
            ...tags.map(t => ({ value: t.id, label: t.name })),
          ]}
        />

        {/* Clear filters */}
        {hasFilters && (
          <button
            className="animate-fade"
            onClick={() => { setSearchQuery(''); setFilterPriority('all'); setFilterTag('all'); }}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 14px', borderRadius: 10, border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
              fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--priority-high)'; e.currentTarget.style.color = 'var(--priority-high)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={14} />
            Clear
          </button>
        )}
      </div>
    </header>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        padding: '10px 14px', borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
        fontSize: 13, fontWeight: 500, cursor: 'pointer',
        appearance: 'none', paddingRight: 30,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888a0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
