import React, { useState } from 'react';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent,
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

const COLUMNS: { id: Status; label: string; emoji: string; accent: string }[] = [
  { id: 'todo', label: 'To Do', emoji: '📋', accent: '#818cf8' },
  { id: 'ongoing', label: 'Ongoing', emoji: '⚡', accent: '#fbbf24' },
  { id: 'done', label: 'Done', emoji: '✅', accent: '#34d399' },
];

export default function KanbanBoard() {
  const { moveTask, reorderTasks, tasks: allTasks } = useStore();
  const filtered = useFilteredTasks();

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<Status>('todo');
  const [draggingId, setDraggingId] = useState<string | null>(null);

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

    // Over a column droppable
    const overColumn = COLUMNS.find(c => c.id === overId);
    if (overColumn) {
      moveTask(taskId, overColumn.id);
      return;
    }

    // Over another task
    const overTask = allTasks.find(t => t.id === overId);
    if (!overTask) return;

    const draggedTask = allTasks.find(t => t.id === taskId);
    if (!draggedTask) return;

    if (draggedTask.status !== overTask.status) {
      moveTask(taskId, overTask.status);
    }

    // Reorder within column
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
          display: 'flex', gap: 16, flex: 1, overflowX: 'auto',
          padding: '20px 28px 24px', alignItems: 'flex-start',
        }}>
          {COLUMNS.map(col => {
            const colTasks = tasksByStatus(col.id);
            return (
              <Column
                key={col.id}
                col={col}
                tasks={colTasks}
                draggingId={draggingId}
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
  col, tasks, draggingId, onOpen, onAddTask,
}: {
  col: typeof COLUMNS[0];
  tasks: Task[];
  draggingId: string | null;
  onOpen: (t: Task) => void;
  onAddTask: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });

  return (
    <div style={{
      width: 300, minWidth: 300, display: 'flex', flexDirection: 'column', gap: 0,
      transition: 'opacity var(--transition)',
    }}>
      {/* Column header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
      }}>
        <span style={{ fontSize: 16 }}>{col.emoji}</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {col.label}
        </span>
        <span style={{
          fontSize: 11, fontWeight: 600, padding: '2px 7px',
          borderRadius: 99, background: col.accent + '22', color: col.accent,
          marginLeft: 2,
        }}>
          {tasks.length}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onAddTask}
          style={{
            background: 'none', border: 'none', color: 'var(--text-muted)',
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, cursor: 'pointer', padding: '4px 6px',
            borderRadius: 6, transition: 'all var(--transition)',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = col.accent; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-muted)'; }}
        >
          <Plus size={14} /> Add
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        style={{
          display: 'flex', flexDirection: 'column', gap: 8,
          minHeight: 80,
          background: isOver ? col.accent + '0a' : 'transparent',
          borderRadius: 14,
          border: isOver ? `2px dashed ${col.accent}55` : '2px dashed transparent',
          padding: isOver ? 8 : 0,
          transition: 'all 0.15s ease',
        }}
      >
        <SortableContext
          items={tasks.map(t => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map(task => (
            <div key={task.id} className="animate-fade">
              <TaskCard
                task={task}
                onOpen={onOpen}
              />
            </div>
          ))}
        </SortableContext>

        {tasks.length === 0 && !isOver && (
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            height: 80, color: 'var(--text-muted)', fontSize: 13,
            borderRadius: 12, border: '1px dashed var(--border)',
          }}>
            Drop here
          </div>
        )}
      </div>
    </div>
  );
}
