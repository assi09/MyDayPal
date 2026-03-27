import { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isToday, isPast, parseISO,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Task } from '../types';
import { useStore, useFilteredTasks } from '../store';
import TaskModal from './TaskModal';

const PRIORITY_HEX: Record<string, string> = {
  critical: '#DC2626',
  high:     '#F97316',
  medium:   '#F59E0B',
  low:      '#22C55E',
};

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView() {
  useStore();
  const tasks = useFilteredTasks();

  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');

  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const gridStart  = startOfWeek(monthStart);
  const gridEnd    = endOfWeek(monthEnd);

  const weeks: Date[][] = [];
  let day = gridStart;
  while (day <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(day);
      day = addDays(day, 1);
    }
    weeks.push(week);
  }

  function tasksForDay(d: Date) {
    return tasks.filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), d));
  }

  function openNewTaskForDay(d: Date) {
    setNewDueDate(format(d, 'yyyy-MM-dd'));
    setEditingTask('new');
  }

  const selectedTasks = selectedDay ? tasksForDay(selectedDay) : [];

  return (
    <>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* ── Calendar grid ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', padding: '20px 24px',
        }}>
          {/* Month navigation */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18,
          }}>
            <button
              onClick={() => setCurrent(subMonths(current, 1))}
              className="btn-press"
              style={navBtnStyle}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            >
              <ChevronLeft size={15} strokeWidth={2} />
            </button>

            <h2 style={{
              fontSize: 17, fontWeight: 800, letterSpacing: '-0.5px',
              color: 'var(--text-primary)', minWidth: 170, textAlign: 'center',
            }}>
              {format(current, 'MMMM yyyy')}
            </h2>

            <button
              onClick={() => setCurrent(addMonths(current, 1))}
              className="btn-press"
              style={navBtnStyle}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
            >
              <ChevronRight size={15} strokeWidth={2} />
            </button>

            <button
              onClick={() => setCurrent(new Date())}
              className="btn-press"
              style={{
                padding: '6px 13px', borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all var(--t-base)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Today
            </button>
          </div>

          {/* Day-of-week headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 4, marginBottom: 4,
          }}>
            {DOW.map(d => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 10.5, fontWeight: 700,
                color: 'var(--text-muted)', letterSpacing: '0.07em',
                textTransform: 'uppercase', padding: '4px 0',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar cells */}
          <div style={{
            flex: 1, display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: `repeat(${weeks.length}, 1fr)`,
            gap: 4, overflow: 'hidden',
          }}>
            {weeks.flat().map((d, i) => {
              const dayTasks  = tasksForDay(d);
              const inMonth   = isSameMonth(d, current);
              const isSelected = selectedDay ? isSameDay(d, selectedDay) : false;
              const todayDay  = isToday(d);

              return (
                <div
                  key={i}
                  className="day-cell"
                  onClick={() => setSelectedDay(isSelected ? null : d)}
                  style={{
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${
                      isSelected  ? 'var(--accent)' :
                      todayDay    ? 'var(--accent)44' :
                      'var(--border)'
                    }`,
                    background: isSelected
                      ? 'var(--accent-soft)'
                      : todayDay
                      ? 'var(--bg-tertiary)'
                      : 'var(--bg-secondary)',
                    padding: '7px 7px 5px',
                    cursor: 'pointer',
                    transition: 'all var(--t-base)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', gap: 3,
                    opacity: inMonth ? 1 : 0.3,
                    boxShadow: 'var(--shadow-xs)',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.borderColor = 'var(--border-strong)';
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.borderColor = todayDay ? 'var(--accent)44' : 'var(--border)';
                  }}
                >
                  {/* Date number + add btn */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{
                      fontSize: 12.5, fontWeight: todayDay ? 800 : 500,
                      width: 22, height: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '50%',
                      background: todayDay ? 'var(--accent)' : 'transparent',
                      color: todayDay ? '#fff' : isSelected ? 'var(--accent)' : 'var(--text-primary)',
                    }}>
                      {format(d, 'd')}
                    </span>
                    {inMonth && (
                      <button
                        onClick={e => { e.stopPropagation(); openNewTaskForDay(d); }}
                        className="day-add-btn btn-press"
                        style={{
                          width: 17, height: 17, borderRadius: 4,
                          background: 'none', border: 'none',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        <Plus size={11} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  {/* Task pills */}
                  {dayTasks.slice(0, 3).map(task => (
                    <div
                      key={task.id}
                      onClick={e => { e.stopPropagation(); setEditingTask(task); }}
                      style={{
                        fontSize: 10, fontWeight: 600,
                        padding: '2px 5px', borderRadius: 4,
                        background: PRIORITY_HEX[task.priority] + '20',
                        color: PRIORITY_HEX[task.priority],
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        textDecoration: task.status === 'done' ? 'line-through' : 'none',
                        opacity: task.status === 'done' ? 0.5 : 1,
                        cursor: 'pointer',
                        transition: 'background var(--t-fast)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = PRIORITY_HEX[task.priority] + '38')}
                      onMouseLeave={e => (e.currentTarget.style.background = PRIORITY_HEX[task.priority] + '20')}
                    >
                      {task.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && (
                    <div style={{ fontSize: 9.5, color: 'var(--text-muted)', paddingLeft: 4, fontWeight: 600 }}>
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Day detail panel ── */}
        {selectedDay && (
          <div className="animate-slide" style={{
            width: 272, flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg-secondary)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 3, letterSpacing: '0.04em' }}>
                {format(selectedDay, 'EEEE').toUpperCase()}
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {format(selectedDay, 'MMMM d')}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>
              {selectedTasks.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 10, padding: '32px 0', color: 'var(--text-muted)', fontSize: 13,
                }}>
                  <span style={{ fontWeight: 500 }}>No tasks this day</span>
                  <button
                    onClick={() => openNewTaskForDay(selectedDay)}
                    className="btn-press"
                    style={{
                      padding: '7px 14px', borderRadius: 'var(--r-sm)',
                      background: 'var(--accent-soft)', border: 'none',
                      color: 'var(--accent)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                      fontFamily: 'inherit',
                    }}
                  >
                    <Plus size={13} strokeWidth={2.5} /> Add task
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {selectedTasks.map(task => {
                    const overdue = task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
                    return (
                      <div
                        key={task.id}
                        onClick={() => setEditingTask(task)}
                        style={{
                          padding: '11px 13px', borderRadius: 'var(--r-md)',
                          background: 'var(--bg-card)',
                          border: `1px solid ${overdue && task.status !== 'done' ? '#EF444430' : 'var(--border)'}`,
                          boxShadow: 'var(--shadow-xs)',
                          cursor: 'pointer',
                          transition: 'all var(--t-base)',
                          borderLeft: `3px solid ${PRIORITY_HEX[task.priority]}`,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.boxShadow = 'var(--shadow-sm)')}
                        onMouseLeave={e => (e.currentTarget.style.boxShadow = 'var(--shadow-xs)')}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                          <span style={{
                            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
                            textDecoration: task.status === 'done' ? 'line-through' : 'none',
                            opacity: task.status === 'done' ? 0.5 : 1,
                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            letterSpacing: '-0.1px',
                          }}>
                            {task.title}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                          <span style={{
                            fontSize: 10.5, fontWeight: 700,
                            padding: '2px 7px', borderRadius: 'var(--r-full)',
                            background: task.status === 'done'   ? '#22C55E18' :
                                        task.status === 'ongoing' ? '#F59E0B18' :
                                        'var(--bg-hover)',
                            color: task.status === 'done'   ? '#22C55E' :
                                   task.status === 'ongoing' ? '#F59E0B' :
                                   'var(--text-muted)',
                          }}>
                            {task.status === 'todo' ? 'To Do' : task.status === 'ongoing' ? 'In Progress' : 'Done'}
                          </span>
                          {task.subtasks.length > 0 && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>
                              {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <button
                    onClick={() => openNewTaskForDay(selectedDay)}
                    className="btn-press"
                    style={{
                      padding: '9px 0', borderRadius: 'var(--r-md)',
                      background: 'none',
                      border: '1.5px dashed var(--border)',
                      color: 'var(--text-muted)', fontSize: 12, fontWeight: 500,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 5, fontFamily: 'inherit',
                      transition: 'all var(--t-base)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                  >
                    <Plus size={13} strokeWidth={2.5} /> Add task for this day
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {editingTask && (
        <TaskModal
          task={editingTask === 'new' ? null : editingTask}
          defaultStatus="todo"
          defaultDueDate={editingTask === 'new' ? newDueDate : undefined}
          onClose={() => { setEditingTask(null); setNewDueDate(''); }}
        />
      )}
    </>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 'var(--r-sm)',
  border: '1px solid var(--border)',
  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', transition: 'background var(--t-base)',
};
