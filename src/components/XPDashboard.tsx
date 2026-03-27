import { useMemo } from 'react';
import {
  startOfDay, startOfWeek, startOfMonth,
  subDays, subWeeks, subMonths,
  format, parseISO, isSameDay, differenceInCalendarDays,
} from 'date-fns';
import { TrendingUp, TrendingDown, Minus, Flame, Trophy, Zap, Calendar, BarChart3 } from 'lucide-react';
import { Task } from '../types';
import { taskXP } from '../lib/roadmapEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeBucket { label: string; xp: number; tasks: number }
interface StatCard { label: string; value: number; sub: string; icon: React.ReactNode; color: string; trend?: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function doneTasks(tasks: Task[]): { task: Task; xp: number; doneAt: Date }[] {
  return tasks
    .filter(t => t.status === 'done')
    .map(t => ({
      task: t,
      xp: taskXP(t),
      doneAt: parseISO(t.updatedAt),
    }))
    .sort((a, b) => a.doneAt.getTime() - b.doneAt.getTime());
}

function computeStreak(items: { doneAt: Date }[]): number {
  if (items.length === 0) return 0;
  const today = startOfDay(new Date());
  let streak = 0;
  let checkDay = today;

  // Check if today has completions
  const hasToday = items.some(i => isSameDay(i.doneAt, today));
  if (!hasToday) {
    // Check yesterday - if nothing yesterday either, streak is 0
    checkDay = subDays(today, 1);
    const hasYesterday = items.some(i => isSameDay(i.doneAt, checkDay));
    if (!hasYesterday) return 0;
  }

  // Count backwards
  while (true) {
    const hasDay = items.some(i => isSameDay(i.doneAt, checkDay));
    if (!hasDay) break;
    streak++;
    checkDay = subDays(checkDay, 1);
  }
  return streak;
}

function bucketByDay(items: { xp: number; doneAt: Date }[], days: number): TimeBucket[] {
  const today = startOfDay(new Date());
  const buckets: TimeBucket[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const day = subDays(today, i);
    const dayItems = items.filter(it => isSameDay(it.doneAt, day));
    buckets.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Yday' : format(day, 'EEE'),
      xp: dayItems.reduce((s, it) => s + it.xp, 0),
      tasks: dayItems.length,
    });
  }
  return buckets;
}

function bucketByWeek(items: { xp: number; doneAt: Date }[], weeks: number): TimeBucket[] {
  const thisWeekStart = startOfWeek(new Date());
  const buckets: TimeBucket[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const weekStart = subWeeks(thisWeekStart, i);
    const weekEnd = subDays(subWeeks(thisWeekStart, i - 1), 1);
    const weekItems = items.filter(it => it.doneAt >= weekStart && it.doneAt <= weekEnd);
    buckets.push({
      label: i === 0 ? 'This wk' : i === 1 ? 'Last wk' : format(weekStart, 'MMM d'),
      xp: weekItems.reduce((s, it) => s + it.xp, 0),
      tasks: weekItems.length,
    });
  }
  return buckets;
}

function bucketByMonth(items: { xp: number; doneAt: Date }[], months: number): TimeBucket[] {
  const thisMonthStart = startOfMonth(new Date());
  const buckets: TimeBucket[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const monthStart = subMonths(thisMonthStart, i);
    const monthEnd = subDays(subMonths(thisMonthStart, i - 1), 1);
    const monthItems = items.filter(it => it.doneAt >= monthStart && it.doneAt <= monthEnd);
    buckets.push({
      label: i === 0 ? 'This mo' : format(monthStart, 'MMM'),
      xp: monthItems.reduce((s, it) => s + it.xp, 0),
      tasks: monthItems.length,
    });
  }
  return buckets;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function XPDashboard({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const done = doneTasks(tasks);
    const now = new Date();
    const today = startOfDay(now);
    const thisWeekStart = startOfWeek(now);
    const thisMonthStart = startOfMonth(now);
    const lastWeekStart = subWeeks(thisWeekStart, 1);
    const lastMonthStart = subMonths(thisMonthStart, 1);

    const totalXP = done.reduce((s, d) => s + d.xp, 0);
    const todayXP = done.filter(d => isSameDay(d.doneAt, today)).reduce((s, d) => s + d.xp, 0);
    const thisWeekXP = done.filter(d => d.doneAt >= thisWeekStart).reduce((s, d) => s + d.xp, 0);
    const lastWeekXP = done.filter(d => d.doneAt >= lastWeekStart && d.doneAt < thisWeekStart).reduce((s, d) => s + d.xp, 0);
    const thisMonthXP = done.filter(d => d.doneAt >= thisMonthStart).reduce((s, d) => s + d.xp, 0);
    const lastMonthXP = done.filter(d => d.doneAt >= lastMonthStart && d.doneAt < thisMonthStart).reduce((s, d) => s + d.xp, 0);

    const firstDone = done[0];
    const activeDays = firstDone ? Math.max(1, differenceInCalendarDays(now, firstDone.doneAt) + 1) : 1;
    const avgPerDay = Math.round(totalXP / activeDays);
    const avgPerWeek = Math.round(avgPerDay * 7);

    const streak = computeStreak(done);
    const daily = bucketByDay(done, 14);
    const weekly = bucketByWeek(done, 8);
    const monthly = bucketByMonth(done, 6);

    const weekTrend = lastWeekXP > 0 ? Math.round(((thisWeekXP - lastWeekXP) / lastWeekXP) * 100) : (thisWeekXP > 0 ? 100 : 0);
    const monthTrend = lastMonthXP > 0 ? Math.round(((thisMonthXP - lastMonthXP) / lastMonthXP) * 100) : (thisMonthXP > 0 ? 100 : 0);

    return {
      totalXP, todayXP, thisWeekXP, thisMonthXP,
      avgPerDay, avgPerWeek, streak,
      weekTrend, monthTrend,
      daily, weekly, monthly,
      totalDone: done.length,
    };
  }, [tasks]);

  const cards: StatCard[] = [
    {
      label: 'Total XP', value: data.totalXP, sub: `${data.totalDone} tasks completed`,
      icon: <Trophy size={18} strokeWidth={2} />, color: '#6366F1',
    },
    {
      label: 'Today', value: data.todayXP, sub: 'XP earned today',
      icon: <Zap size={18} strokeWidth={2} />, color: '#F59E0B',
    },
    {
      label: 'This Week', value: data.thisWeekXP, sub: 'XP this week',
      icon: <BarChart3 size={18} strokeWidth={2} />, color: '#3B82F6',
      trend: data.weekTrend,
    },
    {
      label: 'This Month', value: data.thisMonthXP, sub: 'XP this month',
      icon: <Calendar size={18} strokeWidth={2} />, color: '#22C55E',
      trend: data.monthTrend,
    },
  ];

  const secondaryCards: StatCard[] = [
    {
      label: 'Avg / Day', value: data.avgPerDay, sub: 'XP average',
      icon: <TrendingUp size={16} strokeWidth={2} />, color: '#8B5CF6',
    },
    {
      label: 'Avg / Week', value: data.avgPerWeek, sub: 'XP average',
      icon: <TrendingUp size={16} strokeWidth={2} />, color: '#EC4899',
    },
    {
      label: 'Streak', value: data.streak, sub: data.streak === 1 ? 'day' : 'days',
      icon: <Flame size={18} strokeWidth={2} />, color: '#EF4444',
    },
  ];

  return (
    <div className="animate-fade" style={{
      flex: 1, overflow: 'auto', padding: '24px 28px 32px',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>
      {/* ── Primary stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {cards.map(c => (
          <StatCardUI key={c.label} card={c} />
        ))}
      </div>

      {/* ── Secondary stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {secondaryCards.map(c => (
          <div key={c.label} style={{
            padding: '16px 18px', borderRadius: 'var(--r-md)',
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 'var(--r-sm)',
              background: c.color + '15', color: c.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              {c.icon}
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {c.value.toLocaleString()}
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)', marginTop: 1 }}>
                {c.label} {c.sub !== 'XP average' && c.sub !== 'day' && c.sub !== 'days' ? '' : `· ${c.sub}`}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <BarChart title="Daily XP" subtitle="Last 14 days" buckets={data.daily} color="#6366F1" />
        <BarChart title="Weekly XP" subtitle="Last 8 weeks" buckets={data.weekly} color="#3B82F6" />
      </div>

      <BarChart title="Monthly XP" subtitle="Last 6 months" buckets={data.monthly} color="#22C55E" />
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCardUI({ card }: { card: StatCard }) {
  const trendColor = (card.trend ?? 0) > 0 ? '#22C55E' : (card.trend ?? 0) < 0 ? '#EF4444' : 'var(--text-muted)';
  const TrendIcon = (card.trend ?? 0) > 0 ? TrendingUp : (card.trend ?? 0) < 0 ? TrendingDown : Minus;

  return (
    <div style={{
      padding: '20px', borderRadius: 'var(--r-lg)',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
      display: 'flex', flexDirection: 'column', gap: 12,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Accent glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 80, height: 80, borderRadius: '50%',
        background: card.color + '08',
        filter: 'blur(20px)',
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--r-sm)',
          background: card.color + '15', color: card.color,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {card.icon}
        </div>
        {card.trend !== undefined && card.trend !== 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 3,
            fontSize: 11, fontWeight: 700, color: trendColor,
            padding: '3px 8px', borderRadius: 'var(--r-full)',
            background: trendColor + '15',
          }}>
            <TrendIcon size={11} strokeWidth={2.5} />
            {Math.abs(card.trend)}%
          </div>
        )}
      </div>

      <div>
        <div style={{
          fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
          letterSpacing: '-1px', lineHeight: 1.1,
        }}>
          {card.value.toLocaleString()}
        </div>
        <div style={{
          fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', marginTop: 4,
        }}>
          {card.label}
        </div>
      </div>

      <div style={{
        fontSize: 11, fontWeight: 500, color: 'var(--text-muted)',
        borderTop: '1px solid var(--border)', paddingTop: 10,
      }}>
        {card.sub}
      </div>
    </div>
  );
}

// ─── Bar chart ────────────────────────────────────────────────────────────────

function BarChart({
  title, subtitle, buckets, color,
}: {
  title: string; subtitle: string; buckets: TimeBucket[]; color: string;
}) {
  const max = Math.max(1, ...buckets.map(b => b.xp));

  return (
    <div style={{
      padding: '20px', borderRadius: 'var(--r-lg)',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 20 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          {title}
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
          {subtitle}
        </span>
      </div>

      {/* Bars */}
      <div style={{
        display: 'flex', alignItems: 'flex-end', gap: 4,
        height: 140, padding: '0 4px',
      }}>
        {buckets.map((b, i) => {
          const pct = max > 0 ? (b.xp / max) * 100 : 0;
          const isLast = i === buckets.length - 1;
          return (
            <div
              key={i}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: 6, height: '100%',
                justifyContent: 'flex-end',
              }}
            >
              {/* XP value on hover-height bars */}
              {b.xp > 0 && (
                <span style={{
                  fontSize: 9, fontWeight: 700, color: isLast ? color : 'var(--text-muted)',
                  opacity: pct > 15 ? 1 : 0,
                }}>
                  {b.xp}
                </span>
              )}

              {/* Bar */}
              <div style={{
                width: '100%', maxWidth: 40,
                height: `${Math.max(pct, 2)}%`,
                borderRadius: '4px 4px 2px 2px',
                background: b.xp > 0
                  ? isLast
                    ? `linear-gradient(180deg, ${color}, ${color}AA)`
                    : `linear-gradient(180deg, ${color}60, ${color}30)`
                  : 'var(--bg-hover)',
                transition: 'height 0.6s cubic-bezier(0.4,0,0.2,1)',
                position: 'relative',
              }}>
                {/* Glow on current period */}
                {isLast && b.xp > 0 && (
                  <div style={{
                    position: 'absolute', inset: -2,
                    borderRadius: 6,
                    boxShadow: `0 0 12px ${color}40`,
                    pointerEvents: 'none',
                  }} />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div style={{
        display: 'flex', gap: 4, marginTop: 8, padding: '0 4px',
      }}>
        {buckets.map((b, i) => (
          <div key={i} style={{
            flex: 1, textAlign: 'center',
            fontSize: 9, fontWeight: 600,
            color: i === buckets.length - 1 ? color : 'var(--text-muted)',
            letterSpacing: '-0.2px',
          }}>
            {b.label}
          </div>
        ))}
      </div>

      {/* Summary line */}
      <div style={{
        display: 'flex', gap: 16, marginTop: 14, paddingTop: 12,
        borderTop: '1px solid var(--border)',
      }}>
        <MiniStat label="Total" value={buckets.reduce((s, b) => s + b.xp, 0)} color={color} />
        <MiniStat label="Avg" value={Math.round(buckets.reduce((s, b) => s + b.xp, 0) / buckets.length)} color="var(--text-muted)" />
        <MiniStat label="Best" value={Math.max(...buckets.map(b => b.xp))} color="var(--text-muted)" />
        <MiniStat label="Tasks" value={buckets.reduce((s, b) => s + b.tasks, 0)} color="var(--text-muted)" />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 800, color, letterSpacing: '-0.3px' }}>
        {value.toLocaleString()}
      </div>
      <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-muted)', marginTop: 1 }}>
        {label}
      </div>
    </div>
  );
}
