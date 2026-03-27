import React from 'react';
import { Search, LayoutGrid, List, SlidersHorizontal, X } from 'lucide-react';
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
      padding: '20px 28px 0',
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      flexShrink: 0,
    }}>
      {/* Title row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{
            fontSize: 22, fontWeight: 700, letterSpacing: '-0.5px',
            color: 'var(--text-primary)',
          }}>
            {projectName}
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* View toggle */}
        <div style={{
          display: 'flex', background: 'var(--bg-tertiary)',
          borderRadius: 10, padding: 3, border: '1px solid var(--border)',
        }}>
          {(['kanban', 'list'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '6px 12px', borderRadius: 7, border: 'none',
                background: viewMode === mode ? 'var(--accent)' : 'transparent',
                color: viewMode === mode ? '#fff' : 'var(--text-secondary)',
                fontSize: 12, fontWeight: 500,
                transition: 'all var(--transition)',
                cursor: 'pointer',
              }}
            >
              {mode === 'kanban' ? <LayoutGrid size={14} /> : <List size={14} />}
              {mode === 'kanban' ? 'Board' : 'List'}
            </button>
          ))}
        </div>
      </div>

      {/* Search + filters row */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        {/* Search */}
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', gap: 10,
          background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
          borderRadius: 10, padding: '9px 14px',
          transition: 'border-color var(--transition)',
        }}
          onFocusCapture={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
          onBlurCapture={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <Search size={15} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks…"
            style={{
              flex: 1, background: 'none', border: 'none',
              color: 'var(--text-primary)', fontSize: 13,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', display: 'flex', padding: 0 }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Priority filter */}
        <FilterSelect
          value={filterPriority}
          onChange={v => setFilterPriority(v as Priority | 'all')}
          options={[
            { value: 'all', label: 'All Priority' },
            { value: 'high', label: '🔴 High' },
            { value: 'medium', label: '🟡 Medium' },
            { value: 'low', label: '🟢 Low' },
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
              padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
              fontSize: 12, fontWeight: 500,
              transition: 'all var(--transition)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--priority-high)'; e.currentTarget.style.color = 'var(--priority-high)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <X size={13} />
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
        padding: '8px 12px', borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
        fontSize: 12, fontWeight: 500, cursor: 'pointer',
        appearance: 'none', paddingRight: 28,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%238888a0' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 8px center',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  );
}
