import { useRef, useState, useEffect, useCallback } from 'react';
import { Search, LayoutGrid, List, CalendarDays, Map, X, ChevronDown, Keyboard } from 'lucide-react';
import { format } from 'date-fns';
import { Priority } from '../types';
import { useStore } from '../store';

const MODES = [
  { id: 'kanban'   as const, label: 'Board',    icon: <LayoutGrid size={13} strokeWidth={2} /> },
  { id: 'list'     as const, label: 'List',     icon: <List size={13} strokeWidth={2} /> },
  { id: 'calendar' as const, label: 'Calendar', icon: <CalendarDays size={13} strokeWidth={2} /> },
  { id: 'roadmap'  as const, label: 'Roadmap',  icon: <Map size={13} strokeWidth={2} /> },
];

const PRIORITIES: { value: Priority | 'all'; label: string }[] = [
  { value: 'all',      label: 'All priorities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high',     label: 'High' },
  { value: 'medium',   label: 'Medium' },
  { value: 'low',      label: 'Low' },
];

export default function Header() {
  const {
    viewMode, setViewMode,
    searchQuery, setSearchQuery,
    filterPriority, setFilterPriority,
    filterTag, setFilterTag,
    tags, activeProjectId, projects,
  } = useStore();

  const searchRef = useRef<HTMLInputElement>(null);
  const controlRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const activeIdx = MODES.findIndex(m => m.id === viewMode);
  const hasFilters = searchQuery || filterPriority !== 'all' || filterTag !== 'all';

  const [pillStyle, setPillStyle] = useState<{ left: number; width: number }>({ left: 0, width: 0 });

  const measurePill = useCallback(() => {
    const btn = btnRefs.current[activeIdx];
    const container = controlRef.current;
    if (!btn || !container) return;
    const cRect = container.getBoundingClientRect();
    const bRect = btn.getBoundingClientRect();
    setPillStyle({ left: bRect.left - cRect.left, width: bRect.width });
  }, [activeIdx]);

  useEffect(() => { measurePill(); }, [measurePill]);

  const pageTitle = activeProjectId
    ? (projects.find(p => p.id === activeProjectId)?.name ?? 'Project')
    : 'All Tasks';

  function clearFilters() {
    setSearchQuery('');
    setFilterPriority('all');
    setFilterTag('all');
  }

  return (
    <header style={{
      padding: '18px 28px 0',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg-secondary)',
      flexShrink: 0,
    }}>
      {/* ── Title row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 0,
        marginBottom: 16,
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: 22,
            fontWeight: 800,
            letterSpacing: '-0.6px',
            color: 'var(--text-primary)',
            lineHeight: 1.15,
          }}>
            {pageTitle}
          </h1>
          <div style={{
            marginTop: 4,
            fontSize: 12.5,
            fontWeight: 500,
            color: 'var(--text-muted)',
            letterSpacing: '0.02em',
          }}>
            {format(new Date(), 'EEEE, MMMM d')}
          </div>
        </div>

        {/* ── Segmented view control ── */}
        <div ref={controlRef} className="seg-control" style={{ alignSelf: 'center' }}>
          {/* Sliding pill — positioned via measured refs */}
          <div
            className="seg-pill"
            style={{
              left: pillStyle.left,
              width: pillStyle.width,
            }}
          />
          {MODES.map((m, i) => (
            <button
              key={m.id}
              ref={el => { btnRefs.current[i] = el; }}
              className={`seg-btn btn-press ${viewMode === m.id ? 'active' : ''}`}
              onClick={() => setViewMode(m.id)}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Toolbar row ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 14,
      }}>
        {/* Search */}
        <div
          className="search-wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '0 12px',
            height: 36,
            borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg-tertiary)',
            flex: '1 1 0',
            maxWidth: 320,
          }}
        >
          <Search size={14} color="var(--text-muted)" strokeWidth={2} style={{ flexShrink: 0 }} />
          <input
            ref={searchRef}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search tasks…"
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              fontSize: 13,
              fontWeight: 500,
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                border: 'none', background: 'none',
                color: 'var(--text-muted)', cursor: 'pointer',
                display: 'flex', padding: 1, borderRadius: 4,
              }}
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 22, background: 'var(--border)', flexShrink: 0 }} />

        {/* Priority filter */}
        <FilterSelect
          value={filterPriority}
          onChange={v => setFilterPriority(v as Priority | 'all')}
          options={PRIORITIES}
          active={filterPriority !== 'all'}
        />

        {/* Tag filter */}
        {tags.length > 0 && (
          <FilterSelect
            value={filterTag}
            onChange={v => setFilterTag(v)}
            options={[
              { value: 'all', label: 'All tags' },
              ...tags.map(t => ({ value: t.id, label: t.name })),
            ]}
            active={filterTag !== 'all'}
          />
        )}

        {/* Shortcuts button */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-shortcuts'))}
          title="Keyboard shortcuts (?)"
          className="btn-press"
          style={{
            width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--r-sm)', border: '1px solid var(--border)',
            background: 'transparent', color: 'var(--text-muted)',
            cursor: 'pointer', flexShrink: 0,
            transition: 'color var(--t-base), border-color var(--t-base)',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <Keyboard size={14} strokeWidth={2} />
        </button>

        {/* Clear filters */}
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="btn-press"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 10px', height: 36, borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: 12.5, fontWeight: 500,
              cursor: 'pointer',
              transition: 'color var(--t-base), border-color var(--t-base)',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--priority-high)'; e.currentTarget.style.borderColor = 'var(--priority-high)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <X size={12} />
            Clear
          </button>
        )}
      </div>
    </header>
  );
}

function FilterSelect({
  value, onChange, options, active,
}: {
  value: Priority | 'all' | string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  active?: boolean;
}) {
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          appearance: 'none',
          padding: '0 28px 0 11px',
          height: 36,
          borderRadius: 'var(--r-sm)',
          border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
          background: active ? 'var(--accent-soft)' : 'var(--bg-tertiary)',
          color: active ? 'var(--accent)' : 'var(--text-secondary)',
          fontSize: 13,
          fontWeight: active ? 600 : 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
          transition: 'all var(--t-base)',
          whiteSpace: 'nowrap',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown
        size={13}
        style={{
          position: 'absolute', right: 9, pointerEvents: 'none',
          color: active ? 'var(--accent)' : 'var(--text-muted)',
        }}
      />
    </div>
  );
}
