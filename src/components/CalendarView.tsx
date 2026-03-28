import { useState } from 'react';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addDays, addMonths, subMonths, isSameMonth, isSameDay,
  isToday, isPast, parseISO, isWeekend,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, X, Clock, CheckCircle2, Circle, FileDown } from 'lucide-react';
import { Task } from '../types';
import { useStore, useFilteredTasks } from '../store';
import TaskModal from './TaskModal';
import { printHTML } from '../lib/pdf';
import { generateCalendarReport } from '../lib/pdfTemplates';

const P_HEX: Record<string, string> = {
  critical: '#DC2626',
  high:     '#F97316',
  medium:   '#F59E0B',
  low:      '#22C55E',
};

const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
  todo:    { label: 'To Do',        color: 'var(--text-muted)', bg: 'var(--bg-hover)' },
  ongoing: { label: 'In Progress',  color: '#F59E0B',           bg: '#F59E0B18' },
  done:    { label: 'Done',         color: '#22C55E',           bg: '#22C55E18' },
};

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarView() {
  useStore();
  const tasks = useFilteredTasks();

  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null | 'new'>(null);
  const [newDueDate, setNewDueDate] = useState<string>('');
  const [hoveredDay, setHoveredDay] = useState<number>(-1);

  function handleExportCalendar() {
    const monthStart = startOfMonth(current);
    const monthEnd = endOfMonth(current);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = endOfWeek(monthEnd);

    const weeks: { date: Date; inMonth: boolean; tasks: { title: string; priority: string; status: string }[] }[][] = [];
    let day = gridStart;
    while (day <= gridEnd) {
      const week: { date: Date; inMonth: boolean; tasks: { title: string; priority: string; status: string }[] }[] = [];
      for (let i = 0; i < 7; i++) {
        const inMonth = isSameMonth(day, current);
        const dayTasks = tasks
          .filter(t => t.dueDate && isSameDay(parseISO(t.dueDate), day))
          .map(t => ({ title: t.title, priority: t.priority, status: t.status }));
        week.push({ date: new Date(day), inMonth, tasks: dayTasks });
        day = addDays(day, 1);
      }
      weeks.push(week);
    }

    const tasksDueThisMonth = tasks.filter(t => {
      if (!t.dueDate) return false;
      const d = parseISO(t.dueDate);
      return d >= monthStart && d <= monthEnd;
    });

    const overdue = tasksDueThisMonth.filter(t =>
      t.status !== 'done' && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
    ).length;

    const taskList = tasksDueThisMonth
      .filter(t => t.dueDate)
      .sort((a, b) => (a.dueDate ?? '').localeCompare(b.dueDate ?? ''))
      .map(t => ({
        date: format(parseISO(t.dueDate!), 'MMM d'),
        title: t.title,
        priority: t.priority,
        status: t.status,
      }));

    const html = generateCalendarReport({
      generatedAt: format(new Date(), 'MMMM d, yyyy'),
      monthLabel: format(current, 'MMMM yyyy'),
      weeks,
      monthStats: {
        due: tasksDueThisMonth.length,
        completed: tasksDueThisMonth.filter(t => t.status === 'done').length,
        overdue,
      },
      taskList,
    });
    printHTML(html);
  }

  const monthStart = startOfMonth(current);
  const monthEnd   = endOfMonth(current);
  const gridStart  = startOfWeek(monthStart);
  const gridEnd    = endOfWeek(monthEnd);

  const weeks: Date[][] = [];
  let day = gridStart;
  while (day <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) { week.push(day); day = addDays(day, 1); }
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
  const tasksDueThisMonth = tasks.filter(t => {
    if (!t.dueDate) return false;
    const d = parseISO(t.dueDate);
    return d >= monthStart && d <= monthEnd;
  });
  const overdueCount = tasksDueThisMonth.filter(t =>
    t.status !== 'done' && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
  ).length;

  return (
    <>
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Calendar grid area ── */}
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          overflow: 'hidden', padding: '24px 28px 20px',
        }}>

          {/* ── Month navigation ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 22,
          }}>
            {/* Nav group */}
            <div style={{
              display: 'flex', alignItems: 'center',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: 2,
            }}>
              <NavBtn onClick={() => setCurrent(subMonths(current, 1))}>
                <ChevronLeft size={14} strokeWidth={2.2} />
              </NavBtn>
              <NavBtn onClick={() => setCurrent(addMonths(current, 1))}>
                <ChevronRight size={14} strokeWidth={2.2} />
              </NavBtn>
            </div>

            <h2 style={{
              fontSize: 20, fontWeight: 800, letterSpacing: '-0.6px',
              color: 'var(--text-primary)', margin: '0 4px',
            }}>
              {format(current, 'MMMM')}
              <span style={{ fontWeight: 500, color: 'var(--text-muted)', marginLeft: 7 }}>
                {format(current, 'yyyy')}
              </span>
            </h2>

            <button
              onClick={() => setCurrent(new Date())}
              className="btn-press"
              style={{
                padding: '5px 12px', borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-secondary)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all var(--t-base)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            >
              Today
            </button>

            <div style={{ flex: 1 }} />

            {/* Month stats */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Stat value={tasksDueThisMonth.length} label="due this month" color="var(--text-muted)" />
              {overdueCount > 0 && <Stat value={overdueCount} label="overdue" color="#EF4444" />}
            </div>

            {/* Export button */}
            <button
              onClick={handleExportCalendar}
              className="btn-press"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 11px', borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text-muted)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                fontFamily: 'inherit', transition: 'all var(--t-base)',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
              title="Export calendar report"
            >
              <FileDown size={13} strokeWidth={2} />
              Export
            </button>
          </div>

          {/* ── Day-of-week headers ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 1, marginBottom: 1,
          }}>
            {DOW.map((d, i) => (
              <div key={d} style={{
                textAlign: 'center', fontSize: 11, fontWeight: 700,
                color: (i === 0 || i === 6) ? 'var(--accent)' : 'var(--text-muted)',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '8px 0',
                opacity: (i === 0 || i === 6) ? 0.6 : 1,
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* ── Calendar cells ── */}
          <div style={{
            flex: 1, display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: `repeat(${weeks.length}, 1fr)`,
            gap: 1,
            overflow: 'hidden',
            background: 'var(--border)',
            borderRadius: 'var(--r-lg)',
            border: '1px solid var(--border)',
          }}>
            {weeks.flat().map((d, i) => {
              const dayTasks   = tasksForDay(d);
              const inMonth    = isSameMonth(d, current);
              const isSelected = selectedDay ? isSameDay(d, selectedDay) : false;
              const todayDay   = isToday(d);
              const weekend    = isWeekend(d);
              const isHovered  = hoveredDay === i;
              const hasOverdue = dayTasks.some(t =>
                t.status !== 'done' && t.dueDate && isPast(parseISO(t.dueDate)) && !isToday(parseISO(t.dueDate))
              );

              return (
                <div
                  key={i}
                  onClick={() => setSelectedDay(isSelected ? null : d)}
                  onMouseEnter={() => setHoveredDay(i)}
                  onMouseLeave={() => setHoveredDay(-1)}
                  style={{
                    background: isSelected
                      ? 'var(--accent-soft)'
                      : weekend && inMonth
                      ? 'var(--bg-tertiary)'
                      : 'var(--bg-secondary)',
                    padding: '6px 7px 5px',
                    cursor: 'pointer',
                    transition: 'background var(--t-fast)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column',
                    opacity: inMonth ? 1 : 0.35,
                    position: 'relative',
                  }}
                >
                  {/* Selected accent bar */}
                  {isSelected && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: 'var(--accent)',
                    }} />
                  )}

                  {/* Date number row */}
                  <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 3,
                  }}>
                    <span style={{
                      fontSize: 12, fontWeight: todayDay ? 800 : 500,
                      width: 24, height: 24,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: 'var(--r-full)',
                      background: todayDay ? 'var(--accent)' : 'transparent',
                      color: todayDay
                        ? '#fff'
                        : isSelected
                        ? 'var(--accent)'
                        : hasOverdue
                        ? '#EF4444'
                        : 'var(--text-primary)',
                      transition: 'all var(--t-fast)',
                      boxShadow: todayDay ? '0 2px 8px var(--accent-glow)' : 'none',
                    }}>
                      {format(d, 'd')}
                    </span>

                    {/* Task count dot(s) when there are tasks */}
                    {dayTasks.length > 0 && !isSelected && (
                      <div style={{ display: 'flex', gap: 2, marginRight: 2 }}>
                        {dayTasks.slice(0, 3).map((t, ti) => (
                          <div key={ti} style={{
                            width: 5, height: 5, borderRadius: '50%',
                            background: P_HEX[t.priority] ?? 'var(--text-muted)',
                            opacity: t.status === 'done' ? 0.3 : 0.8,
                          }} />
                        ))}
                        {dayTasks.length > 3 && (
                          <span style={{
                            fontSize: 8, fontWeight: 700, color: 'var(--text-muted)',
                            lineHeight: '5px',
                          }}>
                            +{dayTasks.length - 3}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Add button (hover only) */}
                    {inMonth && isHovered && (
                      <button
                        onClick={e => { e.stopPropagation(); openNewTaskForDay(d); }}
                        className="btn-press"
                        style={{
                          width: 18, height: 18, borderRadius: 'var(--r-xs)',
                          background: 'var(--bg-hover)', border: 'none',
                          color: 'var(--text-muted)', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all var(--t-fast)',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--accent-soft)'; e.currentTarget.style.color = 'var(--accent)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                      >
                        <Plus size={10} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>

                  {/* Task pills */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, overflow: 'hidden' }}>
                    {dayTasks.slice(0, 3).map(task => {
                      const pColor = P_HEX[task.priority] ?? 'var(--text-muted)';
                      const done = task.status === 'done';
                      return (
                        <div
                          key={task.id}
                          onClick={e => { e.stopPropagation(); setEditingTask(task); }}
                          style={{
                            fontSize: 10, fontWeight: 600, lineHeight: 1.3,
                            padding: '2.5px 6px 2.5px 8px',
                            borderRadius: 4,
                            background: isHovered ? (pColor + '18') : (pColor + '10'),
                            borderLeft: `2.5px solid ${pColor}`,
                            color: done ? 'var(--text-muted)' : 'var(--text-primary)',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            textDecoration: done ? 'line-through' : 'none',
                            opacity: done ? 0.5 : 1,
                            cursor: 'pointer',
                            transition: 'background var(--t-fast)',
                          }}
                        >
                          {task.title}
                        </div>
                      );
                    })}
                    {dayTasks.length > 3 && (
                      <span style={{
                        fontSize: 9, color: 'var(--accent)', fontWeight: 700,
                        paddingLeft: 8, letterSpacing: '-0.2px',
                      }}>
                        +{dayTasks.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Day detail panel ── */}
        {selectedDay && (
          <div className="animate-slide" style={{
            width: 300, flexShrink: 0,
            borderLeft: '1px solid var(--border)',
            background: 'var(--bg)',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '20px 20px 16px',
              borderBottom: '1px solid var(--border)',
              background: 'var(--bg-secondary)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: 'var(--accent)',
                    letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4,
                  }}>
                    {format(selectedDay, 'EEEE')}
                  </div>
                  <div style={{
                    fontSize: 22, fontWeight: 800, color: 'var(--text-primary)',
                    letterSpacing: '-0.6px', lineHeight: 1.1,
                  }}>
                    {format(selectedDay, 'MMMM d')}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDay(null)}
                  className="btn-press"
                  style={{
                    width: 26, height: 26, borderRadius: 'var(--r-sm)',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all var(--t-base)',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                >
                  <X size={13} strokeWidth={2} />
                </button>
              </div>

              {/* Day summary */}
              {selectedTasks.length > 0 && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, marginTop: 14,
                }}>
                  <MiniStat
                    icon={<Circle size={10} strokeWidth={2.5} />}
                    value={selectedTasks.filter(t => t.status === 'todo').length}
                    label="to do"
                    color="var(--text-muted)"
                  />
                  <MiniStat
                    icon={<Clock size={10} strokeWidth={2.5} />}
                    value={selectedTasks.filter(t => t.status === 'ongoing').length}
                    label="in progress"
                    color="#F59E0B"
                  />
                  <MiniStat
                    icon={<CheckCircle2 size={10} strokeWidth={2.5} />}
                    value={selectedTasks.filter(t => t.status === 'done').length}
                    label="done"
                    color="#22C55E"
                  />
                </div>
              )}
            </div>

            {/* Task list */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px' }}>
              {selectedTasks.length === 0 ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  gap: 12, padding: '40px 0', color: 'var(--text-muted)',
                }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 'var(--r-full)',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Plus size={18} strokeWidth={1.8} color="var(--text-muted)" />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>No tasks</div>
                    <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
                      Add a task for this day
                    </div>
                  </div>
                  <button
                    onClick={() => openNewTaskForDay(selectedDay)}
                    className="btn-press"
                    style={{
                      padding: '8px 18px', borderRadius: 'var(--r-sm)',
                      background: 'var(--accent)', border: 'none',
                      color: '#fff', fontSize: 12.5, fontWeight: 700,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      fontFamily: 'inherit', boxShadow: '0 2px 8px var(--accent-glow)',
                      transition: 'all var(--t-base)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                    onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                  >
                    <Plus size={14} strokeWidth={2.5} /> Add task
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedTasks.map(task => {
                    const pColor = P_HEX[task.priority] ?? '#6366F1';
                    const overdue = task.dueDate && isPast(parseISO(task.dueDate)) && !isToday(parseISO(task.dueDate));
                    const done = task.status === 'done';
                    const st = STATUS_CFG[task.status] ?? STATUS_CFG.todo;
                    const compSubs = task.subtasks.filter(s => s.completed).length;

                    return (
                      <div
                        key={task.id}
                        onClick={() => setEditingTask(task)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: 'var(--r-md)',
                          background: 'var(--bg-card)',
                          border: `1px solid ${overdue && !done ? '#EF444430' : 'var(--border)'}`,
                          boxShadow: `inset 3px 0 0 0 ${pColor}, var(--shadow-xs)`,
                          cursor: 'pointer',
                          transition: 'all var(--t-base)',
                          opacity: done ? 0.65 : 1,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.boxShadow = `inset 3px 0 0 0 ${pColor}, var(--shadow-sm)`;
                          e.currentTarget.style.transform = 'translateY(-1px)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = `inset 3px 0 0 0 ${pColor}, var(--shadow-xs)`;
                          e.currentTarget.style.transform = 'none';
                        }}
                      >
                        {/* Title */}
                        <div style={{
                          fontSize: 13, fontWeight: 700, color: 'var(--text-primary)',
                          letterSpacing: '-0.15px', lineHeight: 1.35,
                          textDecoration: done ? 'line-through' : 'none',
                          marginBottom: 8,
                        }}>
                          {task.title}
                        </div>

                        {/* Meta row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          {/* Priority pill */}
                          <span style={{
                            fontSize: 9.5, fontWeight: 700, letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            padding: '2px 6px', borderRadius: 'var(--r-xs)',
                            background: pColor + '1A', color: pColor,
                          }}>
                            {task.priority}
                          </span>

                          {/* Status pill */}
                          <span style={{
                            fontSize: 9.5, fontWeight: 700,
                            padding: '2px 6px', borderRadius: 'var(--r-xs)',
                            background: st.bg, color: st.color,
                          }}>
                            {st.label}
                          </span>

                          <div style={{ flex: 1 }} />

                          {/* Overdue badge */}
                          {overdue && !done && (
                            <span style={{
                              fontSize: 9.5, fontWeight: 700, color: '#EF4444',
                              display: 'flex', alignItems: 'center', gap: 3,
                            }}>
                              <Clock size={9} strokeWidth={2.5} />
                              Overdue
                            </span>
                          )}
                        </div>

                        {/* Subtask progress */}
                        {task.subtasks.length > 0 && (
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            marginTop: 9, paddingTop: 9,
                            borderTop: '1px solid var(--border)',
                          }}>
                            <div style={{
                              flex: 1, height: 3, borderRadius: 'var(--r-full)',
                              background: 'var(--bg-hover)', overflow: 'hidden',
                            }}>
                              <div style={{
                                height: '100%', borderRadius: 'var(--r-full)',
                                width: `${(compSubs / task.subtasks.length) * 100}%`,
                                background: compSubs === task.subtasks.length ? '#22C55E' : 'var(--accent)',
                                transition: 'width 0.4s ease',
                              }} />
                            </div>
                            <span style={{
                              fontSize: 10, fontWeight: 600, color: 'var(--text-muted)',
                              flexShrink: 0,
                            }}>
                              {compSubs}/{task.subtasks.length}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Add task button */}
                  <button
                    onClick={() => openNewTaskForDay(selectedDay)}
                    className="btn-press"
                    style={{
                      padding: '10px 0', borderRadius: 'var(--r-md)',
                      background: 'none',
                      border: '1.5px dashed var(--border)',
                      color: 'var(--text-muted)', fontSize: 12, fontWeight: 600,
                      cursor: 'pointer', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', gap: 6, fontFamily: 'inherit',
                      transition: 'all var(--t-base)',
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.color = 'var(--accent)';
                      e.currentTarget.style.background = 'var(--accent-soft)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'var(--border)';
                      e.currentTarget.style.color = 'var(--text-muted)';
                      e.currentTarget.style.background = 'none';
                    }}
                  >
                    <Plus size={13} strokeWidth={2.5} /> Add task
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

// ─── Small helpers ────────────────────────────────────────────────────────────

function NavBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="btn-press"
      style={{
        width: 28, height: 28, borderRadius: 'var(--r-xs)',
        border: 'none', background: 'transparent',
        color: 'var(--text-secondary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', transition: 'all var(--t-fast)',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
    >
      {children}
    </button>
  );
}

function Stat({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
      <span style={{ fontSize: 16, fontWeight: 800, color, letterSpacing: '-0.5px' }}>{value}</span>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}

function MiniStat({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
  if (value === 0) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color }}>
      {icon}
      <span style={{ fontSize: 12, fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--text-muted)' }}>{label}</span>
    </div>
  );
}
