import { useMemo, useState, useRef, useEffect } from 'react';
import {
  Target, Clock, Zap, TrendingUp, Play,
  CheckCircle2, Calendar, Layers,
  GitBranch, LayoutList, BarChart3,
  ZoomIn, ZoomOut, Maximize2,
} from 'lucide-react';
import { format, parseISO, differenceInCalendarDays, isValid } from 'date-fns';
import { Task } from '../types';
import { useStore, useFilteredTasks } from '../store';
import {
  RoadmapModeId, RoadmapGroup,
  groupTasksForRoadmap, scoreTask, taskXP,
} from '../lib/roadmapEngine';
import TaskModal from './TaskModal';
import XPDashboard from './XPDashboard';

// ─── Mode catalogue ──────────────────────────────────────────────────────────

const MODES: { id: RoadmapModeId; label: string; tagline: string; icon: React.ReactNode }[] = [
  { id: 'priority',   label: 'Priority',   tagline: 'What matters most',  icon: <Target size={13} strokeWidth={2} /> },
  { id: 'duedate',    label: 'Due Date',   tagline: "What's urgent",       icon: <Clock size={13} strokeWidth={2} /> },
  { id: 'complexity', label: 'Complexity', tagline: 'Match your energy',   icon: <Zap size={13} strokeWidth={2} /> },
  { id: 'score',      label: 'Score',      tagline: 'Best next moves',     icon: <TrendingUp size={13} strokeWidth={2} /> },
  { id: 'flow',       label: 'Flow',       tagline: 'Work in order',       icon: <Play size={13} strokeWidth={2} /> },
];

// ─── Layout constants ────────────────────────────────────────────────────────

const L = {
  PAD_X:       52,
  PAD_Y:       36,
  ROOT_W:      200,
  ROOT_H:      58,
  GROUP_W:     164,
  GROUP_H:     52,
  TASK_W:      204,
  TASK_H:      104,
  TASK_GAP:    12,   // horizontal gap between sibling task nodes
  GROUP_GAP:   40,   // horizontal gap between group subtrees
  LEVEL_GAP_1: 82,   // root  → groups
  LEVEL_GAP_2: 72,   // groups → tasks
  MAX_TASKS:   6,    // max task nodes per group (extras get "+N more" node)
};

// ─── Types ───────────────────────────────────────────────────────────────────

interface Edge { d: string; color: string; opacity: number }
interface NodePos { x: number; y: number; cx: number; cy: number }

interface TreeLayout {
  canvasW: number;
  canvasH: number;
  rootPos: NodePos;
  groupPos: NodePos[];
  taskPos: NodePos[][];   // [groupIdx][taskIdx]
  overflows: number[];    // hidden task count per group
  edges: Edge[];
}

// ─── Layout computation (pure) ───────────────────────────────────────────────

function computeLayout(groups: RoadmapGroup[]): TreeLayout {
  const { PAD_X, PAD_Y, ROOT_W, ROOT_H, GROUP_W, GROUP_H,
          TASK_W, TASK_H, TASK_GAP, GROUP_GAP,
          LEVEL_GAP_1, LEVEL_GAP_2, MAX_TASKS } = L;

  const overflows = groups.map(g => Math.max(0, g.tasks.length - MAX_TASKS));
  // visible slots: up to MAX_TASKS task nodes + 1 overflow node if needed
  const visibleCounts = groups.map((g, i) =>
    Math.min(g.tasks.length, MAX_TASKS) + (overflows[i] > 0 ? 1 : 0)
  );

  // Width of each group's subtree
  const subtreeW = groups.map((_, i) => {
    const n = Math.max(1, visibleCounts[i]);
    return Math.max(GROUP_W, n * TASK_W + (n - 1) * TASK_GAP);
  });

  const totalGroupsW =
    subtreeW.reduce((a, b) => a + b, 0) +
    Math.max(0, groups.length - 1) * GROUP_GAP;

  const canvasW = Math.max(ROOT_W, totalGroupsW) + 2 * PAD_X;
  const canvasH = PAD_Y + ROOT_H + LEVEL_GAP_1 + GROUP_H + LEVEL_GAP_2 + TASK_H + PAD_Y;

  const rootCX = canvasW / 2;
  const rootPos: NodePos = {
    x: rootCX - ROOT_W / 2, y: PAD_Y, cx: rootCX, cy: PAD_Y + ROOT_H / 2,
  };

  // Group positions: centered within their subtrees, subtrees packed left→right
  const groupsStartX = PAD_X + (canvasW - 2 * PAD_X - totalGroupsW) / 2;
  let curX = groupsStartX;
  const groupPos: NodePos[] = groups.map((_, i) => {
    const cx = curX + subtreeW[i] / 2;
    const y  = PAD_Y + ROOT_H + LEVEL_GAP_1;
    curX += subtreeW[i] + GROUP_GAP;
    return { x: cx - GROUP_W / 2, y, cx, cy: y + GROUP_H / 2 };
  });

  // Task positions
  curX = groupsStartX;
  const taskPos: NodePos[][] = groups.map((_, gi) => {
    const startX = curX;
    curX += subtreeW[gi] + GROUP_GAP;
    const y = PAD_Y + ROOT_H + LEVEL_GAP_1 + GROUP_H + LEVEL_GAP_2;
    const n = visibleCounts[gi];
    return Array.from({ length: n }, (__, ti) => {
      const x = startX + ti * (TASK_W + TASK_GAP);
      return { x, y, cx: x + TASK_W / 2, cy: y + TASK_H / 2 };
    });
  });

  // Bezier edges
  const edges: Edge[] = [];

  // Root → groups
  groups.forEach((g, gi) => {
    const p1y = rootPos.y + ROOT_H;
    const p2y = groupPos[gi].y;
    const mid = p1y + (p2y - p1y) * 0.55;
    edges.push({
      d: `M ${rootCX} ${p1y} C ${rootCX} ${mid}, ${groupPos[gi].cx} ${mid}, ${groupPos[gi].cx} ${p2y}`,
      color: g.accent, opacity: 0.38,
    });
  });

  // Groups → tasks
  groups.forEach((g, gi) => {
    const p1y = groupPos[gi].y + GROUP_H;
    taskPos[gi].forEach(tp => {
      const p2y = tp.y;
      const mid = p1y + (p2y - p1y) * 0.55;
      edges.push({
        d: `M ${groupPos[gi].cx} ${p1y} C ${groupPos[gi].cx} ${mid}, ${tp.cx} ${mid}, ${tp.cx} ${p2y}`,
        color: g.accent, opacity: 0.20,
      });
    });
  });

  return { canvasW, canvasH, rootPos, groupPos, taskPos, overflows, edges };
}

// ─── Priority colors (hex for inline use) ────────────────────────────────────

const P_COLOR: Record<string, string> = {
  critical: '#DC2626', high: '#F97316', medium: '#F59E0B', low: '#22C55E',
};

// ─── Due-date helper ─────────────────────────────────────────────────────────

function dueLabel(task: Task): { text: string; urgent: boolean } | null {
  if (!task.dueDate) return null;
  const d = parseISO(task.dueDate);
  if (!isValid(d)) return null;
  const days = differenceInCalendarDays(d, new Date());
  if (days < 0)   return { text: `${Math.abs(days)}d overdue`, urgent: true };
  if (days === 0) return { text: 'Due today', urgent: true };
  if (days === 1) return { text: 'Tomorrow', urgent: false };
  return { text: format(d, 'MMM d'), urgent: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// Main export
// ═══════════════════════════════════════════════════════════════════════════

export default function RoadmapView() {
  const { roadmapMode, setRoadmapMode, moveTask } = useStore();
  const allTasks = useFilteredTasks();
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [viewType, setViewType] = useState<'tree' | 'list' | 'stats'>('tree');

  const allGroups  = useMemo(() => groupTasksForRoadmap(allTasks, roadmapMode), [allTasks, roadmapMode]);
  const treeGroups = useMemo(() => allGroups.filter(g => g.tasks.length > 0), [allGroups]);

  const totalDone = allTasks.filter(t => t.status === 'done').length;
  const total     = allTasks.length;
  const progress  = total > 0 ? Math.round((totalDone / total) * 100) : 0;

  function handleComplete(task: Task) { moveTask(task.id, 'done'); }

  return (
    <>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* ── Top bar: mode tabs + progress ── */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border)',
          flexShrink: 0,
          padding: '10px 24px 0',
        }}>
          {/* Progress strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              flex: 1, height: 3, background: 'var(--bg-hover)',
              borderRadius: 'var(--r-full)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--accent), #22C55E)',
                borderRadius: 'var(--r-full)',
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
            <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {totalDone}/{total} complete · {progress}%
            </span>

            {/* View-type toggle */}
            <div style={{
              display: 'flex', gap: 1,
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              padding: 2,
            }}>
              {([
                { id: 'tree' as const, icon: <GitBranch size={13} strokeWidth={2} />, label: 'Tree' },
                { id: 'list' as const, icon: <LayoutList size={13} strokeWidth={2} />, label: 'List' },
                { id: 'stats' as const, icon: <BarChart3 size={13} strokeWidth={2} />, label: 'Stats' },
              ] as const).map(v => (
                <button
                  key={v.id}
                  onClick={() => setViewType(v.id)}
                  className="btn-press"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 'calc(var(--r-sm) - 2px)',
                    border: 'none', fontFamily: 'inherit',
                    background: viewType === v.id ? 'var(--bg-card)' : 'transparent',
                    color: viewType === v.id ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: 12, fontWeight: viewType === v.id ? 600 : 500,
                    cursor: 'pointer',
                    boxShadow: viewType === v.id ? 'var(--shadow-sm)' : 'none',
                    transition: 'all var(--t-base)',
                  }}
                >
                  {v.icon}{v.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 0, alignItems: 'flex-end' }}>
            {MODES.map(m => {
              const active = roadmapMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setRoadmapMode(m.id)}
                  className="btn-press"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                    gap: 1, padding: '8px 14px 10px',
                    border: 'none', borderRadius: 'var(--r-sm) var(--r-sm) 0 0',
                    background: active ? 'var(--bg)' : 'transparent',
                    cursor: 'pointer', fontFamily: 'inherit',
                    borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
                    transition: 'background var(--t-base)',
                    position: 'relative', top: 1,
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    color: active ? 'var(--accent)' : 'var(--text-secondary)',
                    transition: 'color var(--t-base)',
                  }}>
                    {m.icon}
                    <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{m.label}</span>
                  </div>
                  <span style={{
                    fontSize: 10, color: active ? 'var(--accent)' : 'var(--text-muted)',
                    fontWeight: 500, paddingLeft: 19, transition: 'color var(--t-base)',
                  }}>
                    {m.tagline}
                  </span>
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            <div style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0 4px 10px', color: 'var(--text-muted)', fontSize: 12,
            }}>
              <Layers size={13} strokeWidth={2} />
              <span style={{ fontWeight: 600 }}>{allTasks.filter(t => t.status !== 'done').length}</span>
              <span>active tasks</span>
            </div>
          </div>
        </div>

        {/* ── Content area ── */}
        {viewType === 'tree' ? (
          <TreeView
            key={roadmapMode}
            groups={treeGroups}
            mode={roadmapMode}
            onOpen={t => setEditingTask(t)}
            onShowList={() => setViewType('list')}
          />
        ) : viewType === 'stats' ? (
          <XPDashboard tasks={allTasks} />
        ) : (
          <LaneView
            key={roadmapMode}
            groups={allGroups}
            onOpen={t => setEditingTask(t)}
            onComplete={handleComplete}
          />
        )}
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask === 'new' ? null : editingTask}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Tree view
// ═══════════════════════════════════════════════════════════════════════════

function TreeView({
  groups, mode, onOpen, onShowList,
}: {
  groups: RoadmapGroup[];
  mode: RoadmapModeId;
  onOpen: (t: Task) => void;
  onShowList: () => void;
}) {
  const layout = useMemo(() => computeLayout(groups), [groups]);
  const modeInfo = MODES.find(m => m.id === mode)!;
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const pendingScroll = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PAD = 40;
  const fitScaleX = containerSize.w > 0 ? (containerSize.w - PAD) / layout.canvasW : 1;
  const fitScaleY = containerSize.h > 0 ? (containerSize.h - PAD) / layout.canvasH : 1;
  const fitScale  = Math.min(1, fitScaleX, fitScaleY);
  const scale     = fitScale * zoom;
  const scaledW   = layout.canvasW * scale;
  const scaledH   = layout.canvasH * scale;

  // Apply pending scroll after React re-renders with new zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !pendingScroll.current) return;
    el.scrollLeft = pendingScroll.current.x;
    el.scrollTop = pendingScroll.current.y;
    pendingScroll.current = null;
  });

  // Helper: compute padding for centering at a given scale
  function getPad(s: number) {
    const sw = layout.canvasW * s;
    const sh = layout.canvasH * s;
    return {
      x: Math.max(20, (containerSize.w - sw) / 2),
      y: Math.max(20, (containerSize.h - sh) / 2),
    };
  }

  // Zoom toward a specific point in container coordinates
  function zoomTo(factor: number, anchorClientX?: number, anchorClientY?: number) {
    const el = containerRef.current;
    if (!el) return;

    const oldZoom = zoom;
    const newZoom = Math.min(3, Math.max(0.3, oldZoom * factor));
    if (newZoom === oldZoom) return;

    const oldScale = fitScale * oldZoom;
    const newScale = fitScale * newZoom;
    const oldPad = getPad(oldScale);
    const newPad = getPad(newScale);

    // Anchor point: either cursor position or center of viewport
    const rect = el.getBoundingClientRect();
    const viewX = anchorClientX !== undefined ? anchorClientX - rect.left : el.clientWidth / 2;
    const viewY = anchorClientY !== undefined ? anchorClientY - rect.top : el.clientHeight / 2;

    // Point in content coordinates (within the padding + scaled canvas)
    const contentX = el.scrollLeft + viewX;
    const contentY = el.scrollTop + viewY;

    // Convert to canvas coordinates (unscaled)
    const canvasX = (contentX - oldPad.x) / oldScale;
    const canvasY = (contentY - oldPad.y) / oldScale;

    // New content position for same canvas point
    const newContentX = canvasX * newScale + newPad.x;
    const newContentY = canvasY * newScale + newPad.y;

    pendingScroll.current = {
      x: newContentX - viewX,
      y: newContentY - viewY,
    };

    setZoom(newZoom);
  }

  // Scroll-wheel zoom toward cursor position
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
      zoomTo(factor, e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  });

  function zoomIn()    { zoomTo(1.25); }
  function zoomOut()   { zoomTo(1 / 1.25); }
  function zoomReset() { setZoom(1); pendingScroll.current = null; }

  if (groups.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 10, color: 'var(--text-muted)', fontSize: 13, fontWeight: 500,
      }}>
        <CheckCircle2 size={30} strokeWidth={1.5} />
        No tasks to display in this mode
      </div>
    );
  }

  const pad = getPad(scale);

  return (
    <div
      ref={wrapperRef}
      className="animate-fade"
      style={{ flex: 1, position: 'relative', overflow: 'hidden' }}
    >
      {/* Zoom controls — outside scroll container, always fixed in corner */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 10,
        display: 'flex', flexDirection: 'column', gap: 2,
        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)', padding: 3,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <ZoomBtn onClick={zoomIn} title="Zoom in"><ZoomIn size={14} strokeWidth={2} /></ZoomBtn>
        <ZoomBtn onClick={zoomOut} title="Zoom out"><ZoomOut size={14} strokeWidth={2} /></ZoomBtn>
        <div style={{ height: 1, background: 'var(--border)', margin: '2px 4px' }} />
        <ZoomBtn onClick={zoomReset} title="Reset zoom"><Maximize2 size={13} strokeWidth={2} /></ZoomBtn>
        <div style={{
          textAlign: 'center', fontSize: 9, fontWeight: 700,
          color: 'var(--text-muted)', padding: '2px 0',
        }}>
          {Math.round(zoom * 100)}%
        </div>
      </div>

      {/* Scroll container */}
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', overflow: 'auto' }}
      >
      {/* Centering wrapper — padding centers when small, allows equal scroll when zoomed */}
      <div style={{ padding: `${pad.y}px ${pad.x}px` }}>
      {/* Scale wrapper — sized to the visual footprint of the scaled canvas */}
      <div style={{
        position: 'relative',
        width: scaledW,
        height: scaledH,
      }}>
        {/* Actual canvas rendered at full resolution then scaled */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: layout.canvasW,
          height: layout.canvasH,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}>

        {/* SVG edge layer */}
        <svg
          style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' }}
          width={layout.canvasW}
          height={layout.canvasH}
        >
          {layout.edges.map((e, i) => (
            <path
              key={i}
              d={e.d}
              fill="none"
              stroke={e.color}
              strokeWidth={1.5}
              strokeOpacity={e.opacity}
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Root node */}
        <div style={{
          position: 'absolute',
          left: layout.rootPos.x,
          top: layout.rootPos.y,
          width: L.ROOT_W,
          height: L.ROOT_H,
          borderRadius: 'var(--r-md)',
          background: 'var(--accent)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3,
          boxShadow: '0 4px 20px var(--accent-glow)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, color: '#fff' }}>
            {modeInfo.icon}
            <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px' }}>
              {modeInfo.label}
            </span>
          </div>
          <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.72)', fontWeight: 500 }}>
            {modeInfo.tagline}
          </span>
        </div>

        {/* Group nodes */}
        {groups.map((g, gi) => (
          <div
            key={g.id}
            style={{
              position: 'absolute',
              left: layout.groupPos[gi].x,
              top: layout.groupPos[gi].y,
              width: L.GROUP_W,
              height: L.GROUP_H,
              borderRadius: 'var(--r-md)',
              background: 'var(--bg-secondary)',
              border: `1px solid ${g.accent}44`,
              borderTop: `3px solid ${g.accent}`,
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', padding: '0 14px',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)', flex: 1, letterSpacing: '-0.2px' }}>
                {g.label}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                minWidth: 22, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--r-xs)',
                background: g.accent + '1E',
                color: g.accent,
              }}>
                {g.tasks.length}
              </span>
            </div>
            <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500, marginTop: 1 }}>
              {g.description}
            </span>
          </div>
        ))}

        {/* Task nodes */}
        {groups.map((g, gi) => {
          const visible = g.tasks.slice(0, L.MAX_TASKS);
          const overflow = layout.overflows[gi];

          return [
            ...visible.map((task, ti) => (
              <TaskNode
                key={task.id}
                task={task}
                mode={mode}
                pos={layout.taskPos[gi][ti]}
                accent={g.accent}
                onOpen={onOpen}
              />
            )),
            // Overflow node
            ...(overflow > 0 ? [(
              <div
                key={`${g.id}-overflow`}
                onClick={onShowList}
                style={{
                  position: 'absolute',
                  left: layout.taskPos[gi][visible.length]?.x ?? 0,
                  top: layout.taskPos[gi][visible.length]?.y ?? 0,
                  width: L.TASK_W,
                  height: L.TASK_H,
                  borderRadius: 'var(--r-md)',
                  border: `1.5px dashed ${g.accent}50`,
                  background: g.accent + '08',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 5,
                  cursor: 'pointer',
                  transition: 'all var(--t-base)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = g.accent + '16';
                  e.currentTarget.style.borderColor = g.accent + '80';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = g.accent + '08';
                  e.currentTarget.style.borderColor = g.accent + '50';
                }}
              >
                <span style={{ fontSize: 20, fontWeight: 800, color: g.accent }}>
                  +{overflow}
                </span>
                <span style={{ fontSize: 11.5, color: g.accent, fontWeight: 600 }}>
                  more tasks
                </span>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)', fontWeight: 500 }}>
                  Switch to list view
                </span>
              </div>
            )] : []),
          ];
        })}
        </div>{/* end: full-res canvas */}
      </div>{/* end: scale wrapper */}
      </div>{/* end: centering wrapper */}
      </div>{/* end: scroll container */}
    </div>
  );
}

// ─── Zoom button ──────────────────────────────────────────────────────────────

function ZoomBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="btn-press"
      style={{
        width: 30, height: 30, borderRadius: 'var(--r-xs)',
        border: 'none', background: 'transparent',
        color: 'var(--text-secondary)', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all var(--t-fast)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {children}
    </button>
  );
}

// ─── Task node (tree) ────────────────────────────────────────────────────────

function TaskNode({
  task, mode, pos, accent, onOpen,
}: {
  task: Task;
  mode: RoadmapModeId;
  pos: NodePos;
  accent: string;
  onOpen: (t: Task) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const pColor  = P_COLOR[task.priority] ?? '#6366F1';
  const due     = dueLabel(task);
  const isDone  = task.status === 'done';
  const score   = useMemo(() => scoreTask(task), [task]);
  const xp      = useMemo(() => taskXP(task), [task]);
  const compSubs = task.subtasks.filter(s => s.completed).length;

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onOpen(task)}
      style={{
        position: 'absolute',
        left: pos.x,
        top: pos.y,
        width: L.TASK_W,
        height: L.TASK_H,
        borderRadius: 'var(--r-md)',
        background: isDone ? 'var(--bg-tertiary)' : 'var(--bg-card)',
        border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
        borderLeft: `3px solid ${pColor}`,
        boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
        cursor: 'pointer',
        transition: 'box-shadow var(--t-base), border-color var(--t-base), transform var(--t-base)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 12px',
        gap: 6,
        opacity: isDone ? 0.6 : 1,
        overflow: 'hidden',
      }}
    >
      {/* Score / XP indicator */}
      {(mode === 'score' || mode === 'flow') && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{
            fontSize: 9.5, fontWeight: 800,
            padding: '1px 6px', borderRadius: 'var(--r-full)',
            background: mode === 'flow' ? '#22C55E1A' : accent + '1A',
            color: mode === 'flow' ? '#22C55E' : accent,
          }}>
            {mode === 'flow' ? `${xp} XP` : `score ${score}`}
          </span>
        </div>
      )}

      {/* Title */}
      <p style={{
        fontSize: 12.5,
        fontWeight: 700,
        color: 'var(--text-primary)',
        lineHeight: 1.35,
        letterSpacing: '-0.15px',
        textDecoration: isDone ? 'line-through' : 'none',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        overflow: 'hidden',
        flex: 1,
      }}>
        {task.title}
      </p>

      {/* Meta row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
        {/* Priority pill */}
        <span style={{
          fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
          padding: '1px 5px', borderRadius: 'var(--r-xs)',
          background: pColor + '1A', color: pColor,
          flexShrink: 0,
        }}>
          {task.priority}
        </span>

        {/* Complexity dots */}
        {(mode === 'complexity' || mode === 'score') && (
          <div style={{ display: 'flex', gap: 2 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <div key={n} style={{
                width: 4, height: 4, borderRadius: '50%',
                background: n <= (task.complexity ?? 3) ? 'var(--accent)' : 'var(--bg-hover)',
              }} />
            ))}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Due date */}
        {due && (
          <span style={{
            fontSize: 10, fontWeight: 600, flexShrink: 0,
            color: due.urgent ? 'var(--priority-high)' : 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <Calendar size={9} strokeWidth={2.5} />
            {due.text}
          </span>
        )}
      </div>

      {/* Subtask bar */}
      {task.subtasks.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            flex: 1, height: 2, background: 'var(--bg-hover)',
            borderRadius: 'var(--r-full)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${(compSubs / task.subtasks.length) * 100}%`,
              background: '#22C55E',
              borderRadius: 'var(--r-full)',
            }} />
          </div>
          <span style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
            {compSubs}/{task.subtasks.length}
          </span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Lane view (secondary)
// ═══════════════════════════════════════════════════════════════════════════

function LaneView({
  groups, onOpen, onComplete,
}: {
  groups: RoadmapGroup[];
  onOpen: (t: Task) => void;
  onComplete: (t: Task) => void;
}) {
  return (
    <div className="animate-fade" style={{
      flex: 1, display: 'flex', overflow: 'auto',
      padding: '20px 24px 24px', gap: 14, alignItems: 'stretch',
    }}>
      {groups.map(group => (
        <div
          key={group.id}
          style={{
            width: 280, flexShrink: 0,
            display: 'flex', flexDirection: 'column',
            background: group.bgTint,
            border: '1px solid var(--border)',
            borderTop: `3px solid ${group.accent}`,
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-xs)',
          }}
        >
          {/* Lane header */}
          <div style={{ padding: '12px 14px 10px', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: 'var(--text-primary)', flex: 1, letterSpacing: '-0.25px' }}>
                {group.label}
              </span>
              <span style={{
                fontSize: 11, fontWeight: 700, minWidth: 22, height: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 'var(--r-xs)', background: group.accent + '1E', color: group.accent,
              }}>
                {group.tasks.length}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
              {group.description}
            </span>
          </div>

          {/* Task list */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px', display: 'flex', flexDirection: 'column', gap: 7 }}>
            {group.tasks.length === 0 ? (
              <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12.5, fontWeight: 500 }}>
                {group.emptyMessage}
              </div>
            ) : (
              group.tasks.map((task, i) => (
                <LaneCard
                  key={task.id}
                  task={task}
                  accent={group.accent}
                  animDelay={i * 0.025}
                  onOpen={() => onOpen(task)}
                  onComplete={() => onComplete(task)}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function LaneCard({ task, accent, animDelay, onOpen, onComplete }: {
  task: Task; accent: string; animDelay: number;
  onOpen: () => void; onComplete: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const pColor = P_COLOR[task.priority] ?? '#6366F1';
  const due    = dueLabel(task);
  const isDone = task.status === 'done';
  const score  = useMemo(() => scoreTask(task), [task]);

  return (
    <div className="animate-fade" style={{ animationDelay: `${animDelay}s` }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: isDone ? 'var(--bg-tertiary)' : 'var(--bg-card)',
          border: `1px solid ${hovered ? 'var(--border-strong)' : 'var(--border)'}`,
          borderLeft: `3px solid ${pColor}`,
          borderRadius: 'var(--r-md)',
          padding: '10px 12px',
          cursor: 'pointer',
          boxShadow: hovered ? 'var(--shadow-md)' : 'var(--shadow-xs)',
          transform: hovered ? 'translateY(-1px)' : 'none',
          transition: 'all var(--t-base)',
          display: 'flex', flexDirection: 'column', gap: 6,
          opacity: isDone ? 0.6 : 1,
        }}
        onClick={onOpen}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
          <p style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            flex: 1, lineHeight: 1.38, letterSpacing: '-0.1px',
            textDecoration: isDone ? 'line-through' : 'none',
          }}>
            {task.title}
          </p>
          <span style={{
            fontSize: 9.5, fontWeight: 800, flexShrink: 0,
            padding: '2px 6px', borderRadius: 'var(--r-full)',
            background: accent + '18', color: accent, marginTop: 1,
          }}>
            {score}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            padding: '1px 5px', borderRadius: 'var(--r-xs)',
            background: pColor + '18', color: pColor,
          }}>
            {task.priority}
          </span>
          <div style={{ flex: 1 }} />
          {due && (
            <span style={{
              fontSize: 10.5, fontWeight: 600, color: due.urgent ? 'var(--priority-high)' : 'var(--text-muted)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <Calendar size={10} strokeWidth={2} />{due.text}
            </span>
          )}
        </div>

        {task.subtasks.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ flex: 1, height: 2, background: 'var(--bg-hover)', borderRadius: 'var(--r-full)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: '#22C55E', borderRadius: 'var(--r-full)',
                width: `${(task.subtasks.filter(s => s.completed).length / task.subtasks.length) * 100}%`,
              }} />
            </div>
            <span style={{ fontSize: 9.5, color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>
              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length}
            </span>
          </div>
        )}

        {/* Flow mode quick-complete */}
        {hovered && !isDone && (
          <div className="animate-fadeup" onClick={e => e.stopPropagation()}>
            <button
              onClick={e => { e.stopPropagation(); onComplete(); }}
              className="btn-press"
              style={{
                width: '100%', padding: '5px', borderRadius: 'var(--r-sm)',
                border: 'none', background: '#22C55E', color: '#fff',
                fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              <CheckCircle2 size={12} strokeWidth={2.5} /> Mark done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
