import { useState } from 'react';
import {
  DndContext, DragEndEvent, DragStartEvent,
  DragOverlay, PointerSensor, useSensor, useSensors, closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import { Task, Status } from '../types';
import { useStore, useFilteredTasks } from '../store';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

const COLUMNS: {
  id: Status;
  label: string;
  accent: string;
  tint: string;
}[] = [
  { id: 'todo',    label: 'To Do',       accent: '#6366F1', tint: 'rgba(99,102,241,0.032)' },
  { id: 'ongoing', label: 'In Progress', accent: '#F59E0B', tint: 'rgba(245,158,11,0.032)' },
  { id: 'done',    label: 'Done',        accent: '#22C55E', tint: 'rgba(34,197,94,0.032)' },
];

export default function KanbanBoard() {
  const { moveTask, reorderTasks, tasks: allTasks } = useStore();
  const filtered = useFilteredTasks();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<Status>('todo');
  const [, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const tasksByStatus = (status: Status) =>
    filtered
      .filter(t => t.status === status)
      .sort((a, b) => a.order - b.order);

  function handleDragStart(event: DragStartEvent) {
    const t = allTasks.find(t => t.id === event.active.id);
    setActiveTask(t ?? null);
    setDraggingId(String(event.active.id));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveTask(null);
    setDraggingId(null);
    if (!over) return;

    const taskId = String(active.id);
    const overId = String(over.id);

    const overColumn = COLUMNS.find(c => c.id === overId);
    if (overColumn) {
      moveTask(taskId, overColumn.id);
      return;
    }

    const overTask = allTasks.find(t => t.id === overId);
    if (!overTask) return;

    const draggedTask = allTasks.find(t => t.id === taskId);
    if (!draggedTask) return;

    if (draggedTask.status !== overTask.status) {
      moveTask(taskId, overTask.status);
    }

    const colTasks = allTasks
      .filter(t => t.status === overTask.status)
      .sort((a, b) => a.order - b.order);

    const oldIdx = colTasks.findIndex(t => t.id === taskId);
    const newIdx = colTasks.findIndex(t => t.id === overId);
    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx) return;

    const reordered = arrayMove(colTasks, oldIdx, newIdx).map((t, i) => ({ ...t, order: i }));
    const otherTasks = allTasks.filter(t => t.status !== overTask.status);
    reorderTasks([...otherTasks, ...reordered]);
  }

  function openNewTask(status: Status) {
    setNewTaskStatus(status);
    setEditingTask('new');
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div style={{
          display: 'flex',
          gap: 16,
          flex: 1,
          overflow: 'auto',
          padding: '20px 24px 28px',
          alignItems: 'stretch',
        }}>
          {COLUMNS.map(col => {
            const colTasks = tasksByStatus(col.id);
            return (
              <Column
                key={col.id}
                col={col}
                tasks={colTasks}
                onOpen={t => setEditingTask(t)}
                onAddTask={() => openNewTask(col.id)}
              />
            );
          })}
        </div>

        <DragOverlay dropAnimation={{ duration: 160, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
          {activeTask && (
            <TaskCard task={activeTask} onOpen={() => {}} overlay />
          )}
        </DragOverlay>
      </DndContext>

      {editingTask && (
        <TaskModal
          task={editingTask === 'new' ? null : editingTask}
          defaultStatus={editingTask === 'new' ? newTaskStatus : undefined}
          onClose={() => setEditingTask(null)}
        />
      )}
    </>
  );
}

function Column({
  col, tasks, onOpen, onAddTask,
}: {
  col: typeof COLUMNS[0];
  tasks: Task[];
  onOpen: (t: Task) => void;
  onAddTask: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  const [addHover, setAddHover] = useState(false);

  return (
    <div style={{
      flex: 1,
      minWidth: 272,
      display: 'flex',
      flexDirection: 'column',
      background: isOver ? col.tint : 'var(--bg-secondary)',
      border: `1px solid ${isOver ? col.accent + '30' : 'var(--border)'}`,
      borderRadius: 'var(--r-lg)',
      overflow: 'hidden',
      boxShadow: 'var(--shadow-xs)',
      transition: 'background var(--t-base), border-color var(--t-base)',
    }}>

      {/* ── Column header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '14px 16px 12px',
        borderBottom: `1px solid var(--border)`,
      }}>
        {/* Status indicator */}
        <div style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: col.accent,
          flexShrink: 0,
          boxShadow: `0 0 0 2px ${col.accent}28`,
        }} />

        <span style={{
          fontSize: 13.5,
          fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.2px',
          flex: 1,
        }}>
          {col.label}
        </span>

        {/* Count badge */}
        <span style={{
          fontSize: 11.5,
          fontWeight: 700,
          minWidth: 22,
          height: 22,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderRadius: 'var(--r-xs)',
          background: col.accent + '16',
          color: col.accent,
          letterSpacing: '-0.2px',
        }}>
          {tasks.length}
        </span>

        {/* Add button */}
        <button
          onClick={onAddTask}
          onMouseEnter={() => setAddHover(true)}
          onMouseLeave={() => setAddHover(false)}
          className="btn-press"
          style={{
            width: 26, height: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 'var(--r-xs)',
            border: 'none',
            background: addHover ? col.accent : col.accent + '16',
            color: addHover ? '#fff' : col.accent,
            cursor: 'pointer',
            transition: 'background var(--t-base), color var(--t-base)',
          }}
          title={`Add task to ${col.label}`}
        >
          <Plus size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* ── Task list / drop zone ── */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '10px 10px 12px',
          overflowY: 'auto',
          minHeight: 80,
        }}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task, i) => (
            <div
              key={task.id}
              className="animate-fade"
              style={{ animationDelay: `${i * 0.025}s` }}
            >
              <TaskCard task={task} onOpen={onOpen} />
            </div>
          ))}
        </SortableContext>

        {/* Empty state */}
        {tasks.length === 0 && (
          <button
            onClick={onAddTask}
            className="btn-press"
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '36px 20px',
              margin: 2,
              color: 'var(--text-muted)',
              fontSize: 12.5,
              fontWeight: 500,
              fontFamily: 'inherit',
              borderRadius: 'var(--r-md)',
              border: `1.5px dashed ${col.accent}30`,
              background: 'transparent',
              cursor: 'pointer',
              transition: 'border-color var(--t-base), background var(--t-base), color var(--t-base)',
              minHeight: 100,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = col.accent + '60';
              e.currentTarget.style.background = col.accent + '06';
              e.currentTarget.style.color = col.accent;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = col.accent + '30';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--text-muted)';
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: col.accent + '14',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={16} color={col.accent} strokeWidth={2} />
            </div>
            <span>Add a task</span>
          </button>
        )}
      </div>
    </div>
  );
}
