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

const COLUMNS: { id: Status; label: string; accent: string; dot: string }[] = [
  { id: 'todo', label: 'To Do', accent: '#818cf8', dot: '#818cf8' },
  { id: 'ongoing', label: 'In Progress', accent: '#f59e0b', dot: '#f59e0b' },
  { id: 'done', label: 'Done', accent: '#10b981', dot: '#10b981' },
];

export default function KanbanBoard() {
  const { moveTask, reorderTasks, tasks: allTasks } = useStore();
  const filtered = useFilteredTasks();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<Status>('todo');
  const [, setDraggingId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
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
          gap: 20,
          flex: 1,
          overflow: 'auto',
          padding: '24px 32px 32px',
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

        <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
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

  return (
    <div style={{
      flex: 1,
      minWidth: 280,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
      borderRadius: 18,
      overflow: 'hidden',
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '18px 20px 14px',
        borderBottom: `2px solid ${col.accent}33`,
      }}>
        <div style={{
          width: 10, height: 10, borderRadius: '50%',
          background: col.accent,
          boxShadow: `0 0 8px ${col.accent}88`,
          flexShrink: 0,
        }} />
        <span style={{
          fontSize: 15, fontWeight: 700,
          color: 'var(--text-primary)',
          letterSpacing: '-0.2px',
          flex: 1,
        }}>
          {col.label}
        </span>
        <span style={{
          fontSize: 12, fontWeight: 700,
          padding: '3px 10px',
          borderRadius: 99,
          background: col.accent + '20',
          color: col.accent,
        }}>
          {tasks.length}
        </span>
        <button
          onClick={onAddTask}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '6px 12px', borderRadius: 8, border: 'none',
            background: col.accent + '18',
            color: col.accent,
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = col.accent; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = col.accent + '18'; e.currentTarget.style.color = col.accent; }}
        >
          <Plus size={13} strokeWidth={2.5} />
          Add
        </button>
      </div>

      {/* Drop zone / task list */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: '14px 14px',
          overflowY: 'auto',
          background: isOver ? col.accent + '08' : 'transparent',
          transition: 'background 0.15s ease',
          minHeight: 120,
        }}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <div key={task.id} className="animate-fade">
              <TaskCard task={task} onOpen={onOpen} />
            </div>
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '40px 20px',
            color: 'var(--text-muted)',
            fontSize: 13,
            borderRadius: 12,
            border: `1.5px dashed ${col.accent}33`,
            margin: 4,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              background: col.accent + '15',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Plus size={18} color={col.accent} strokeWidth={1.5} />
            </div>
            <span style={{ color: col.accent + 'bb', fontWeight: 500 }}>
              No tasks yet
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
