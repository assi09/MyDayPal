import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Calendar, Zap, Flame, CheckCircle2 } from 'lucide-react';
import { Task } from '../types';
import { useStore } from '../store';
import { taskXP } from '../lib/roadmapEngine';
import { format, startOfWeek, endOfWeek, addWeeks, parseISO } from 'date-fns';

const REVIEW_KEY = 'mydaypal-weekly-review';

export function shouldShowWeeklyReview(): boolean {
  const today = new Date();
  if (today.getDay() !== 0) return false; // 0 = Sunday
  const lastReview = localStorage.getItem(REVIEW_KEY);
  if (!lastReview) return true;
  const lastDate = new Date(lastReview);
  const daysDiff = (today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff >= 6;
}

export function markWeeklyReviewDone() {
  localStorage.setItem(REVIEW_KEY, new Date().toISOString());
}

interface Props {
  tasks: Task[];
  onClose: () => void;
}

export default function WeeklyReview({ tasks, onClose }: Props) {
  const { earnedBadges, settings } = useStore();
  const [step, setStep] = useState(0);
  const [reflections, setReflections] = useState({ wentWell: '', challenging: '', priority: '' });

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const nextWeekStart = addWeeks(weekStart, 1);
  const nextWeekEnd = addWeeks(weekEnd, 1);

  // Tasks completed this week
  const completedThisWeek = tasks.filter(t => {
    if (t.status !== 'done') return false;
    const updated = new Date(t.updatedAt);
    return updated >= weekStart && updated <= weekEnd;
  });

  // XP earned this week
  const weekXP = completedThisWeek.reduce((sum, t) => {
    const earlyBonus = settings.earlyBirdBonusEnabled && t.dueDate && t.updatedAt.slice(0, 10) < t.dueDate;
    return sum + Math.round(taskXP(t) * (earlyBonus ? 1.2 : 1));
  }, 0);

  // Total tasks count
  const totalDone = tasks.filter(t => t.status === 'done').length;

  // Tasks due next week
  const nextWeekTasks = tasks.filter(t => {
    if (t.status === 'done' || !t.dueDate) return false;
    const due = parseISO(t.dueDate);
    return due >= nextWeekStart && due <= nextWeekEnd;
  }).sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 };
    return order[a.priority] - order[b.priority];
  });

  const weekLabel = `Week of ${format(weekStart, 'MMMM d')}–${format(weekEnd, 'd, yyyy')}`;

  const P_COLORS: Record<string, string> = {
    critical: '#DC2626', high: '#F97316', medium: '#F59E0B', low: '#22C55E',
  };

  function handleClose() {
    markWeeklyReviewDone();
    onClose();
  }

  const STEPS = ['Summary', 'Reflect', 'Next Week'];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1050,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="animate-fadeup"
        style={{
          width: '100%', maxWidth: 560,
          background: 'var(--bg)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-xl, 16px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
                Weekly Review
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', margin: 0 }}>
                {weekLabel}
              </h2>
            </div>
            <button
              onClick={handleClose}
              style={{
                width: 28, height: 28, borderRadius: 'var(--r-sm)',
                border: '1px solid var(--border)',
                background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all var(--t-base)',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
            >
              <X size={13} strokeWidth={2.2} />
            </button>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
            {STEPS.map((s, i) => (
              <div
                key={s}
                onClick={() => setStep(i)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 'var(--r-full)',
                  background: step === i ? 'var(--accent-soft)' : 'transparent',
                  border: `1px solid ${step === i ? 'var(--accent)' : 'var(--border)'}`,
                  color: step === i ? 'var(--accent)' : (i < step ? 'var(--text-muted)' : 'var(--text-muted)'),
                  fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
                  transition: 'all var(--t-fast)',
                }}
              >
                {i < step ? <Check size={10} strokeWidth={2.5} /> : <span style={{ fontSize: 10 }}>{i + 1}</span>}
                {s}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '22px 24px', minHeight: 260, maxHeight: '60vh', overflowY: 'auto' }}>

          {/* ── Step 0: Summary ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{
                  padding: '14px 16px', borderRadius: 'var(--r-md)',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <CheckCircle2 size={13} color="#22C55E" strokeWidth={2} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Completed</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                    {completedThisWeek.length}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>tasks this week</div>
                </div>
                <div style={{
                  padding: '14px 16px', borderRadius: 'var(--r-md)',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Zap size={13} color="var(--accent)" strokeWidth={2} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>XP Earned</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                    {weekXP.toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>this week</div>
                </div>
                <div style={{
                  padding: '14px 16px', borderRadius: 'var(--r-md)',
                  background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                  display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Flame size={13} color="#EF4444" strokeWidth={2} />
                    <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Total Done</span>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-1px' }}>
                    {totalDone}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>all time</div>
                </div>
              </div>

              {/* Completed tasks list */}
              {completedThisWeek.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Completed This Week
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {completedThisWeek.slice(0, 8).map(t => (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', borderRadius: 'var(--r-sm)',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      }}>
                        <Check size={12} strokeWidth={2.5} color="#22C55E" />
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)', flex: 1, textDecoration: 'line-through', opacity: 0.75 }}>
                          {t.title}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 6px', borderRadius: 'var(--r-xs)',
                          background: (P_COLORS[t.priority] ?? '#6366F1') + '1A',
                          color: P_COLORS[t.priority] ?? '#6366F1',
                        }}>
                          {t.priority}
                        </span>
                      </div>
                    ))}
                    {completedThisWeek.length > 8 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', padding: 4 }}>
                        +{completedThisWeek.length - 8} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {completedThisWeek.length === 0 && (
                <div style={{
                  padding: '24px', textAlign: 'center',
                  background: 'var(--bg-secondary)', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    No tasks completed this week
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    There is always next week!
                  </div>
                </div>
              )}

              {/* Badges earned */}
              {earnedBadges.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    Achievements ({earnedBadges.length})
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    You have earned {earnedBadges.length} badge{earnedBadges.length !== 1 ? 's' : ''} in total. Keep going!
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Step 1: Reflect ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>
                Take a moment to reflect on the week. These notes are saved locally for you.
              </div>

              {([
                { key: 'wentWell' as const, label: 'What went well this week?', placeholder: 'Share your wins, big or small…' },
                { key: 'challenging' as const, label: 'What was challenging?', placeholder: 'Obstacles you faced…' },
                { key: 'priority' as const, label: 'Top priority for next week?', placeholder: 'One thing to focus on…' },
              ]).map(field => (
                <div key={field.key}>
                  <label style={{
                    display: 'block', fontSize: 12.5, fontWeight: 700,
                    color: 'var(--text-primary)', marginBottom: 7,
                  }}>
                    {field.label}
                  </label>
                  <textarea
                    value={reflections[field.key]}
                    onChange={e => setReflections(r => ({ ...r, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--bg-secondary)',
                      color: 'var(--text-primary)',
                      fontSize: 13, fontFamily: 'inherit',
                      resize: 'vertical',
                      lineHeight: 1.5,
                      outline: 'none',
                      transition: 'border-color var(--t-base)',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--accent)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                  />
                </div>
              ))}
            </div>
          )}

          {/* ── Step 2: Next Week ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
              }}>
                <Calendar size={16} color="var(--accent)" strokeWidth={2} />
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {format(nextWeekStart, 'MMMM d')} – {format(nextWeekEnd, 'MMMM d, yyyy')}
                </span>
              </div>

              {nextWeekTasks.length > 0 ? (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                    {nextWeekTasks.length} task{nextWeekTasks.length !== 1 ? 's' : ''} due next week
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {nextWeekTasks.map(t => (
                      <div key={t.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', borderRadius: 'var(--r-md)',
                        background: 'var(--bg-secondary)', border: '1px solid var(--border)',
                      }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: P_COLORS[t.priority] ?? '#6366F1',
                        }} />
                        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                          {t.title}
                        </span>
                        {t.dueDate && (
                          <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                            {format(parseISO(t.dueDate), 'EEE, MMM d')}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '24px', textAlign: 'center',
                  background: 'var(--bg-secondary)', borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    No tasks due next week
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Your schedule is wide open!
                  </div>
                </div>
              )}

              <div style={{
                padding: '16px 18px', borderRadius: 'var(--r-md)',
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>
                  Have a great week!
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  You are doing great. Keep the momentum going!
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer navigation */}
        <div style={{
          padding: '14px 24px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'transparent', color: step === 0 ? 'var(--text-muted)' : 'var(--text-secondary)',
              fontSize: 13, fontWeight: 600, cursor: step === 0 ? 'default' : 'pointer',
              fontFamily: 'inherit', opacity: step === 0 ? 0.4 : 1,
              transition: 'all var(--t-base)',
            }}
          >
            <ChevronLeft size={14} strokeWidth={2} />
            Back
          </button>

          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {step + 1} / {STEPS.length}
          </div>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 'var(--r-sm)',
                border: 'none',
                background: 'var(--accent)', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 8px var(--accent-glow)',
                transition: 'all var(--t-base)',
              }}
            >
              Next
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          ) : (
            <button
              onClick={handleClose}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 16px', borderRadius: 'var(--r-sm)',
                border: 'none',
                background: '#22C55E', color: '#fff',
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 2px 8px #22C55E38',
                transition: 'all var(--t-base)',
              }}
            >
              <Check size={13} strokeWidth={2.5} />
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
