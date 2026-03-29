import { useMemo, useEffect, useState } from 'react';
import {
  startOfDay, startOfWeek, startOfMonth,
  subDays, subWeeks, subMonths,
  format, parseISO, isSameDay, differenceInCalendarDays,
} from 'date-fns';
import {
  TrendingUp, TrendingDown, Minus, Flame, Trophy, Zap, Calendar, BarChart3, Edit2, Check,
  Target, Award, Crown, Star, Gem, Medal, Lock, FileDown,
} from 'lucide-react';
import { Task } from '../types';
import { taskXP } from '../lib/roadmapEngine';
import { useStore } from '../store';
import { printHTML } from '../lib/pdf';
import { generateStatsReport } from '../lib/pdfTemplates';

// ─── Badge definitions ─────────────────────────────────────────────────────────

const ALL_BADGES = [
  { id: 'first_task',    label: 'First Steps',      desc: 'Complete your first task',   req: '1 task done' },
  { id: 'ten_tasks',     label: 'Getting Rolling',  desc: 'Complete 10 tasks',           req: '10 tasks done' },
  { id: 'fifty_tasks',   label: 'Productivity Pro', desc: 'Complete 50 tasks',           req: '50 tasks done' },
  { id: 'hundred_tasks', label: 'Century Club',     desc: 'Complete 100 tasks',          req: '100 tasks done' },
  { id: 'streak_3',      label: 'On a Roll',        desc: '3-day completion streak',     req: '3-day streak' },
  { id: 'streak_7',      label: 'Week Warrior',     desc: '7-day completion streak',     req: '7-day streak' },
  { id: 'streak_30',     label: 'Unstoppable',      desc: '30-day completion streak',    req: '30-day streak' },
  { id: 'xp_100',        label: 'XP Rookie',        desc: 'Earn 100 XP total',           req: '100 total XP' },
  { id: 'xp_500',        label: 'XP Climber',       desc: 'Earn 500 XP total',           req: '500 total XP' },
  { id: 'xp_2000',       label: 'XP Elite',         desc: 'Earn 2,000 XP total',         req: '2,000 total XP' },
  { id: 'xp_10000',      label: 'XP Legend',        desc: 'Earn 10,000 XP total',        req: '10,000 total XP' },
  { id: 'speed_demon',   label: 'Speed Demon',      desc: 'Complete 5 tasks in one day', req: '5 tasks in a day' },
  { id: 'overachiever',  label: 'Overachiever',     desc: 'Beat your weekly XP goal',    req: 'Beat weekly goal' },
];

const BADGE_ICONS: Record<string, React.ReactNode> = {
  first_task:    <Target size={18} strokeWidth={2} />,
  ten_tasks:     <TrendingUp size={18} strokeWidth={2} />,
  fifty_tasks:   <Zap size={18} strokeWidth={2} />,
  hundred_tasks: <Award size={18} strokeWidth={2} />,
  streak_3:      <Flame size={18} strokeWidth={2} />,
  streak_7:      <Flame size={18} strokeWidth={2.5} />,
  streak_30:     <Crown size={18} strokeWidth={2} />,
  xp_100:        <Star size={18} strokeWidth={2} />,
  xp_500:        <Star size={18} strokeWidth={2.5} />,
  xp_2000:       <Gem size={18} strokeWidth={2} />,
  xp_10000:      <Trophy size={18} strokeWidth={2} />,
  speed_demon:   <Zap size={18} strokeWidth={2.5} />,
  overachiever:  <Medal size={18} strokeWidth={2} />,
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface TimeBucket { label: string; xp: number; tasks: number }
interface StatCard { label: string; value: number; sub: string; icon: React.ReactNode; color: string; trend?: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────

function doneTasks(tasks: Task[], earlyBirdEnabled: boolean): { task: Task; xp: number; doneAt: Date }[] {
  return tasks
    .filter(t => t.status === 'done')
    .map(t => {
      const completedDate = t.updatedAt.slice(0, 10);
      const hasEarlyBonus = earlyBirdEnabled && t.dueDate !== null && completedDate < t.dueDate;
      const xp = Math.round(taskXP(t) * (hasEarlyBonus ? 1.2 : 1));
      return {
        task: t,
        xp,
        doneAt: parseISO(t.updatedAt),
      };
    })
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
  const { accentColor, weeklyXPGoal, setWeeklyXPGoal, earnedBadges, awardBadge, settings, activeProjectId, projects } = useStore();
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(String(weeklyXPGoal));

  const data = useMemo(() => {
    const done = doneTasks(tasks, settings.earlyBirdBonusEnabled);
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

    // Heatmap: last 105 days (15 weeks)
    const heatmapDays: { date: Date; xp: number; tasks: number }[] = [];
    for (let i = 104; i >= 0; i--) {
      const day = subDays(today, i);
      const dayItems = done.filter(it => isSameDay(it.doneAt, day));
      heatmapDays.push({
        date: day,
        xp: dayItems.reduce((s, it) => s + it.xp, 0),
        tasks: dayItems.length,
      });
    }

    // Max tasks in a day (for speed demon badge)
    const maxTasksInDay = Math.max(0, ...heatmapDays.map(d => d.tasks));

    // Streak bonus: if streak >= 7 and enabled, show +50% indicator
    const streakBonus = settings.streakBonusEnabled && streak >= 7;

    return {
      totalXP, todayXP, thisWeekXP, thisMonthXP,
      avgPerDay, avgPerWeek, streak,
      weekTrend, monthTrend,
      daily, weekly, monthly,
      totalDone: done.length,
      heatmapDays,
      maxTasksInDay,
      streakBonus,
    };
  }, [tasks, settings.earlyBirdBonusEnabled, settings.streakBonusEnabled]);

  // ── Badge auto-award logic ──────────────────────────────────────────────────
  useEffect(() => {
    const { totalDone, totalXP, streak, maxTasksInDay, thisWeekXP } = data;

    if (totalDone >= 1)   awardBadge('first_task');
    if (totalDone >= 10)  awardBadge('ten_tasks');
    if (totalDone >= 50)  awardBadge('fifty_tasks');
    if (totalDone >= 100) awardBadge('hundred_tasks');

    if (streak >= 3)  awardBadge('streak_3');
    if (streak >= 7)  awardBadge('streak_7');
    if (streak >= 30) awardBadge('streak_30');

    if (totalXP >= 100)   awardBadge('xp_100');
    if (totalXP >= 500)   awardBadge('xp_500');
    if (totalXP >= 2000)  awardBadge('xp_2000');
    if (totalXP >= 10000) awardBadge('xp_10000');

    if (maxTasksInDay >= 5) awardBadge('speed_demon');
    if (thisWeekXP >= weeklyXPGoal && weeklyXPGoal > 0) awardBadge('overachiever');
  }, [data, weeklyXPGoal]);

  function handleGoalSave() {
    const v = parseInt(goalInput);
    if (!isNaN(v) && v > 0) setWeeklyXPGoal(v);
    else setGoalInput(String(weeklyXPGoal));
    setEditingGoal(false);
  }

  async function handleExport() {
    const done = doneTasks(tasks, settings.earlyBirdBonusEnabled);
    const activeProject = activeProjectId ? projects.find(p => p.id === activeProjectId) : null;
    const scope = activeProject ? activeProject.name : 'All Tasks';
    const totalXP = done.reduce((s, d) => s + d.xp, 0);
    const streak = data.streak;
    const allTasks = tasks;
    const totalTasks = allTasks.length;
    const doneTotalCount = done.length;
    const completionRate = totalTasks > 0 ? Math.round((doneTotalCount / totalTasks) * 100) : 0;

    const priorityList = ['critical', 'high', 'medium', 'low'];
    const priorityColors: Record<string, string> = {
      critical: '#DC2626', high: '#F97316', medium: '#F59E0B', low: '#22C55E',
    };
    const byPriority = priorityList.map(p => ({
      priority: p,
      done: done.filter(d => d.task.priority === p).length,
      total: allTasks.filter(t => t.priority === p).length,
      color: priorityColors[p],
    }));

    const topTasks = done.slice(-50).reverse().map(d => ({
      title: d.task.title,
      priority: d.task.priority,
      xp: d.xp,
      date: format(d.doneAt, 'MMM d, yyyy'),
    }));

    const badgeList = earnedBadges.map(id => {
      const b = ALL_BADGES.find(b => b.id === id);
      return b ? { label: b.label, desc: b.desc } : null;
    }).filter(Boolean) as { label: string; desc: string }[];

    const html = generateStatsReport({
      generatedAt: format(new Date(), 'MMMM d, yyyy'),
      scope,
      totalXP,
      tasksCompleted: doneTotalCount,
      currentStreak: streak,
      completionRate,
      weeklyXP: data.weekly.map(w => ({ label: w.label, xp: w.xp })),
      byPriority,
      topTasks,
      badges: badgeList,
    });
    await printHTML(html);
  }

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
      label: 'This Week', value: data.thisWeekXP,
      sub: data.streakBonus ? 'XP this week · +50% streak bonus' : 'XP this week',
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

  // Weekly goal ring values
  const goalProgress = weeklyXPGoal > 0 ? Math.min(1, data.thisWeekXP / weeklyXPGoal) : 0;
  const ringRadius = 40;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringDash = goalProgress * ringCircumference;

  return (
    <div className="animate-fade" style={{
      flex: 1, overflow: 'auto', padding: '24px 28px 32px',
      display: 'flex', flexDirection: 'column', gap: 24,
    }}>

      {/* ── Export button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleExport}
          className="btn-press"
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--border)',
            background: 'var(--bg-secondary)', color: 'var(--text-secondary)',
            fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all var(--t-base)',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
        >
          <FileDown size={14} strokeWidth={2} />
          Export Report
        </button>
      </div>

      {/* ── Weekly XP Goal ring + Primary stat cards ── */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        {/* Weekly goal ring */}
        <div style={{
          padding: '20px', borderRadius: 'var(--r-lg)',
          background: 'var(--bg-secondary)', border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 10, minWidth: 148, flexShrink: 0,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Weekly Goal
          </div>
          <div style={{ position: 'relative', width: 100, height: 100 }}>
            <svg width={100} height={100} style={{ transform: 'rotate(-90deg)' }}>
              {/* Track */}
              <circle
                cx={50} cy={50} r={ringRadius}
                fill="none"
                stroke="var(--bg-hover)"
                strokeWidth={8}
              />
              {/* Progress */}
              <circle
                cx={50} cy={50} r={ringRadius}
                fill="none"
                stroke={accentColor}
                strokeWidth={8}
                strokeLinecap="round"
                strokeDasharray={`${ringDash} ${ringCircumference}`}
                style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 1,
            }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                {Math.round(goalProgress * 100)}%
              </span>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-muted)' }}>
                {data.thisWeekXP.toLocaleString()} XP
              </span>
            </div>
          </div>

          {/* Goal display / edit */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {editingGoal ? (
              <>
                <input
                  autoFocus
                  type="number"
                  min={1}
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleGoalSave();
                    if (e.key === 'Escape') { setEditingGoal(false); setGoalInput(String(weeklyXPGoal)); }
                  }}
                  style={{
                    width: 70, padding: '4px 6px', textAlign: 'center',
                    background: 'var(--bg-tertiary)', border: '1px solid var(--accent)',
                    borderRadius: 6, color: 'var(--text-primary)',
                    fontSize: 12, fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={handleGoalSave}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--accent)', display: 'flex', padding: 2,
                  }}
                >
                  <Check size={12} strokeWidth={2.5} />
                </button>
              </>
            ) : (
              <>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                  Goal: {weeklyXPGoal.toLocaleString()} XP
                </span>
                <button
                  onClick={() => { setEditingGoal(true); setGoalInput(String(weeklyXPGoal)); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', display: 'flex', padding: 2,
                    opacity: 0.5, transition: 'opacity var(--t-base)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                  title="Edit weekly goal"
                >
                  <Edit2 size={11} strokeWidth={2} />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Primary stat cards */}
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {cards.map(c => (
            <StatCardUI key={c.label} card={c} />
          ))}
        </div>
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

      {/* ── Activity Heatmap (full width) ── */}
      <CalendarHeatmap days={data.heatmapDays} accentColor={accentColor} />

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <BarChart title="Daily XP" subtitle="Last 14 days" buckets={data.daily} color="#6366F1" />
        <BarChart title="Weekly XP" subtitle="Last 8 weeks" buckets={data.weekly} color="#3B82F6" />
      </div>

      <BarChart title="Monthly XP" subtitle="Last 6 months" buckets={data.monthly} color="#22C55E" />

      {/* ── Badges ── */}
      <BadgesSection earnedBadges={earnedBadges} />
    </div>
  );
}

// ─── Calendar Heatmap ─────────────────────────────────────────────────────────

function CalendarHeatmap({
  days,
  accentColor,
}: {
  days: { date: Date; xp: number; tasks: number }[];
  accentColor: string;
}) {
  // Build 15 weeks × 7 days grid (105 days, oldest first)
  const firstDay = days[0]?.date;
  const firstDow = firstDay ? firstDay.getDay() : 0; // 0=Sun

  const totalCells = 15 * 7;
  const paddingCells = firstDow;

  type Cell = { date: Date; xp: number; tasks: number } | null;
  const cells: Cell[] = [];
  for (let i = 0; i < paddingCells; i++) cells.push(null);
  for (const d of days) cells.push(d);
  while (cells.length < totalCells) cells.push(null);

  const weeks: Cell[][] = [];
  for (let w = 0; w < 15; w++) {
    weeks.push(cells.slice(w * 7, w * 7 + 7));
  }

  const monthLabels: { week: number; label: string }[] = [];
  weeks.forEach((week, wi) => {
    week.forEach((cell) => {
      if (cell && cell.date.getDate() === 1) {
        monthLabels.push({ week: wi, label: format(cell.date, 'MMM') });
      }
    });
  });

  function cellColor(xp: number): string {
    if (xp === 0) return 'var(--bg-hover)';
    if (xp <= 20) return accentColor + '40';
    if (xp <= 50) return accentColor + '80';
    if (xp <= 100) return accentColor + 'BB';
    return accentColor;
  }

  const CELL = 13;
  const GAP = 3;

  return (
    <div style={{
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', padding: '20px 24px', width: '100%',
      boxSizing: 'border-box',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>Activity</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>Last 15 weeks</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
          <span>Less</span>
          {(['var(--bg-hover)', accentColor + '40', accentColor + '80', accentColor + 'BB', accentColor] as string[]).map((bg, i) => (
            <div key={i} style={{
              width: CELL, height: CELL, borderRadius: 3,
              background: bg, flexShrink: 0,
            }} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div style={{ display: 'inline-block' }}>
          {/* Month labels row */}
          <div style={{
            display: 'flex', gap: GAP,
            marginBottom: 4, marginLeft: 20,
            height: 14, position: 'relative',
          }}>
            {weeks.map((_, wi) => {
              const ml = monthLabels.find(m => m.week === wi);
              return (
                <div key={wi} style={{
                  width: CELL, flexShrink: 0,
                  fontSize: 9, fontWeight: 700, color: 'var(--text-muted)',
                  letterSpacing: '0.03em', whiteSpace: 'nowrap', overflow: 'visible',
                }}>
                  {ml ? ml.label : ''}
                </div>
              );
            })}
          </div>

          {/* Grid */}
          <div style={{ display: 'flex', gap: GAP }}>
            {/* Day-of-week labels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, marginRight: 2 }}>
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
                <div key={i} style={{
                  width: 14, height: CELL,
                  fontSize: 8, fontWeight: 700,
                  color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  flexShrink: 0,
                }}>
                  {i % 2 === 1 ? d : ''}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: GAP }}>
                {week.map((cell, di) => (
                  <div
                    key={di}
                    title={cell ? `${format(cell.date, 'MMM d, yyyy')}: ${cell.xp} XP, ${cell.tasks} task${cell.tasks !== 1 ? 's' : ''}` : ''}
                    style={{
                      width: CELL, height: CELL,
                      borderRadius: 3,
                      background: cell ? cellColor(cell.xp) : 'transparent',
                      transition: 'background var(--t-fast)',
                      flexShrink: 0,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Badges section ───────────────────────────────────────────────────────────

function BadgesSection({ earnedBadges }: { earnedBadges: string[] }) {
  return (
    <div style={{
      padding: '20px', borderRadius: 'var(--r-lg)',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-xs)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
          Achievements
        </span>
        <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--text-muted)' }}>
          {earnedBadges.length} / {ALL_BADGES.length} earned
        </span>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
        gap: 10,
      }}>
        {ALL_BADGES.map(badge => {
          const earned = earnedBadges.includes(badge.id);
          return (
            <div
              key={badge.id}
              title={earned ? badge.desc : `Locked: ${badge.req}`}
              style={{
                padding: '14px 12px',
                borderRadius: 'var(--r-md)',
                border: `1px solid ${earned ? 'var(--border-strong)' : 'var(--border)'}`,
                background: earned ? 'var(--bg-tertiary)' : 'transparent',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 6, textAlign: 'center',
                opacity: earned ? 1 : 0.4,
                filter: earned ? 'none' : 'grayscale(1)',
                transition: 'all var(--t-base)',
                cursor: 'default',
              }}
            >
              <div style={{
                width: 36, height: 36,
                borderRadius: 'var(--r-sm)',
                background: earned ? 'var(--accent-soft)' : 'var(--bg-hover)',
                color: earned ? 'var(--accent)' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                {earned ? BADGE_ICONS[badge.id] : <Lock size={16} strokeWidth={2} />}
              </div>
              <div>
                <div style={{
                  fontSize: 11.5, fontWeight: 700,
                  color: earned ? 'var(--text-primary)' : 'var(--text-muted)',
                  letterSpacing: '-0.1px',
                }}>
                  {badge.label}
                </div>
                <div style={{
                  fontSize: 10, fontWeight: 500,
                  color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3,
                }}>
                  {earned ? badge.desc : badge.req}
                </div>
              </div>
            </div>
          );
        })}
      </div>
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
      <div style={{ display: 'flex', gap: 4, marginTop: 8, padding: '0 4px' }}>
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
