// ─── Shared styles ────────────────────────────────────────────────────────────

const BASE_STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
    background: #fff;
    color: #1E293B;
    font-size: 13px;
    line-height: 1.5;
    padding: 40px 48px 56px;
  }
  .logo-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 20px;
    border-bottom: 2px solid #0F172A;
    margin-bottom: 28px;
  }
  .logo-text {
    font-size: 22px;
    font-weight: 900;
    color: #0F172A;
    letter-spacing: -0.5px;
  }
  .logo-sub {
    font-size: 11px;
    font-weight: 600;
    color: #94A3B8;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    margin-top: 3px;
  }
  .report-title { font-size: 28px; font-weight: 800; color: #0F172A; letter-spacing: -0.8px; }
  .report-meta { font-size: 12px; color: #64748B; margin-top: 5px; }
  h2 {
    font-size: 15px;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -0.3px;
    margin-bottom: 14px;
    padding-bottom: 6px;
    border-bottom: 1px solid #E2E8F0;
  }
  section { margin-bottom: 32px; }
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    margin-bottom: 32px;
  }
  .stat-card {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 16px;
  }
  .stat-card .stat-label {
    font-size: 11px;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 6px;
  }
  .stat-card .stat-value {
    font-size: 26px;
    font-weight: 800;
    color: #0F172A;
    letter-spacing: -1px;
  }
  .stat-card .stat-sub {
    font-size: 11px;
    color: #94A3B8;
    margin-top: 2px;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 12.5px;
  }
  th {
    text-align: left;
    font-size: 10.5px;
    font-weight: 700;
    color: #64748B;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    padding: 8px 12px;
    background: #F8FAFC;
    border-bottom: 2px solid #E2E8F0;
  }
  td {
    padding: 9px 12px;
    border-bottom: 1px solid #F1F5F9;
    color: #334155;
    vertical-align: middle;
  }
  tr:last-child td { border-bottom: none; }
  .priority-badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .p-critical { background: #FEE2E2; color: #DC2626; }
  .p-high     { background: #FFEDD5; color: #F97316; }
  .p-medium   { background: #FEF9C3; color: #CA8A04; }
  .p-low      { background: #DCFCE7; color: #16A34A; }
  .status-badge {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .s-done    { background: #DCFCE7; color: #16A34A; }
  .s-ongoing { background: #FEF9C3; color: #CA8A04; }
  .s-todo    { background: #F1F5F9; color: #64748B; }
  .bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; }
  .bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; }
  .bar {
    width: 100%;
    background: #6366F1;
    border-radius: 4px 4px 0 0;
    min-height: 2px;
  }
  .bar-label { font-size: 9px; font-weight: 600; color: #94A3B8; text-align: center; white-space: nowrap; }
  .bar-xp { font-size: 9px; font-weight: 700; color: #6366F1; text-align: center; }
  .badge-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 10px;
  }
  .badge-item {
    background: #F8FAFC;
    border: 1px solid #E2E8F0;
    border-radius: 10px;
    padding: 12px 14px;
  }
  .badge-item .badge-label { font-size: 12px; font-weight: 700; color: #0F172A; margin-bottom: 3px; }
  .badge-item .badge-desc { font-size: 11px; color: #64748B; }
  .cal-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px; }
  .cal-header { text-align: center; font-size: 10px; font-weight: 700; color: #64748B; padding: 6px 0; text-transform: uppercase; letter-spacing: 0.05em; }
  .cal-cell {
    min-height: 64px;
    padding: 5px;
    border: 1px solid #E2E8F0;
    border-radius: 5px;
    background: #FAFAFA;
    vertical-align: top;
  }
  .cal-cell.other-month { opacity: 0.35; }
  .cal-date { font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 3px; }
  .cal-task { font-size: 9.5px; padding: 1px 4px; border-radius: 3px; margin-bottom: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  footer {
    margin-top: 48px;
    padding-top: 16px;
    border-top: 1px solid #E2E8F0;
    font-size: 11px;
    color: #94A3B8;
    text-align: center;
  }
  @media print {
    body { padding: 20px 24px 32px; }
    .no-print { display: none !important; }
    section { page-break-inside: avoid; }
    table { page-break-inside: auto; }
    tr { page-break-inside: avoid; }
  }
`;

function wrap(content: string, title: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>${BASE_STYLES}</style></head><body>${content}</body></html>`;
}

// ─── Stats Report ─────────────────────────────────────────────────────────────

export interface StatsData {
  generatedAt: string;
  scope: string;
  totalXP: number;
  tasksCompleted: number;
  currentStreak: number;
  completionRate: number;
  weeklyXP: { label: string; xp: number }[];
  byPriority: { priority: string; done: number; total: number; color: string }[];
  topTasks: { title: string; priority: string; xp: number; date: string }[];
  badges: { label: string; desc: string }[];
}

export function generateStatsReport(data: StatsData): string {
  const maxXP = Math.max(1, ...data.weeklyXP.map(w => w.xp));

  const bars = data.weeklyXP.map(w => {
    const pct = Math.round((w.xp / maxXP) * 100);
    return `<div class="bar-wrap">
      <div class="bar-xp">${w.xp > 0 ? w.xp : ''}</div>
      <div class="bar" style="height:${Math.max(pct, 2)}%; background:#6366F1;"></div>
      <div class="bar-label">${w.label}</div>
    </div>`;
  }).join('');

  const priorityRows = data.byPriority.map(p => {
    const pct = p.total > 0 ? Math.round((p.done / p.total) * 100) : 0;
    return `<tr>
      <td><span class="priority-badge p-${p.priority}">${p.priority}</span></td>
      <td>${p.total}</td>
      <td>${p.done}</td>
      <td>
        <div style="display:flex;align-items:center;gap:8px;">
          <div style="flex:1;height:6px;background:#E2E8F0;border-radius:3px;overflow:hidden;">
            <div style="height:100%;width:${pct}%;background:${p.color};border-radius:3px;"></div>
          </div>
          <span style="font-size:11px;font-weight:700;color:${p.color};min-width:30px;">${pct}%</span>
        </div>
      </td>
    </tr>`;
  }).join('');

  const taskRows = data.topTasks.slice(0, 20).map(t => `<tr>
    <td style="font-weight:600;color:#1E293B;max-width:300px;">${t.title}</td>
    <td><span class="priority-badge p-${t.priority}">${t.priority}</span></td>
    <td style="color:#6366F1;font-weight:700;">+${t.xp} XP</td>
    <td>${t.date}</td>
  </tr>`).join('');

  const badgeItems = data.badges.map(b => `<div class="badge-item">
    <div class="badge-label">${b.label}</div>
    <div class="badge-desc">${b.desc}</div>
  </div>`).join('');

  const content = `
    <div class="logo-header">
      <div>
        <div class="logo-text">MyDayPal</div>
        <div class="logo-sub">Productivity Report</div>
      </div>
      <div style="text-align:right;">
        <div class="report-title">Productivity Report</div>
        <div class="report-meta">Scope: ${data.scope} &middot; Generated: ${data.generatedAt}</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total XP</div>
        <div class="stat-value">${data.totalXP.toLocaleString()}</div>
        <div class="stat-sub">lifetime earned</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Tasks Done</div>
        <div class="stat-value">${data.tasksCompleted}</div>
        <div class="stat-sub">completed</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Streak</div>
        <div class="stat-value">${data.currentStreak}</div>
        <div class="stat-sub">day${data.currentStreak !== 1 ? 's' : ''}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Completion</div>
        <div class="stat-value">${data.completionRate}%</div>
        <div class="stat-sub">of all tasks</div>
      </div>
    </div>

    <section>
      <h2>XP by Week (Last 8 Weeks)</h2>
      <div class="bar-chart" style="height:120px;">${bars}</div>
    </section>

    <section>
      <h2>Breakdown by Priority</h2>
      <table>
        <thead><tr><th>Priority</th><th>Total</th><th>Done</th><th>Progress</th></tr></thead>
        <tbody>${priorityRows}</tbody>
      </table>
    </section>

    ${data.topTasks.length > 0 ? `<section>
      <h2>Completed Tasks</h2>
      <table>
        <thead><tr><th>Task</th><th>Priority</th><th>XP</th><th>Completed</th></tr></thead>
        <tbody>${taskRows}</tbody>
      </table>
    </section>` : ''}

    ${data.badges.length > 0 ? `<section>
      <h2>Achievements Earned (${data.badges.length})</h2>
      <div class="badge-grid">${badgeItems}</div>
    </section>` : ''}

    <footer>Generated by MyDayPal &middot; ${data.generatedAt}</footer>
  `;

  return wrap(content, 'MyDayPal Productivity Report');
}

// ─── Calendar Report ──────────────────────────────────────────────────────────

export interface CalendarTask {
  title: string;
  priority: string;
  status: string;
}

export interface CalendarData {
  generatedAt: string;
  monthLabel: string;
  weeks: { date: Date; inMonth: boolean; tasks: CalendarTask[] }[][];
  monthStats: { due: number; completed: number; overdue: number };
  taskList: { date: string; title: string; priority: string; status: string }[];
}

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const P_COLORS: Record<string, string> = {
  critical: '#DC2626',
  high:     '#F97316',
  medium:   '#CA8A04',
  low:      '#16A34A',
};

export function generateCalendarReport(data: CalendarData): string {
  const headers = DOW_LABELS.map(d => `<div class="cal-header">${d}</div>`).join('');

  const cells = data.weeks.flat().map(day => {
    const extra = !day.inMonth ? ' other-month' : '';
    const dateNum = day.date.getDate();
    const taskPills = day.tasks.slice(0, 3).map(t => {
      const pColor = P_COLORS[t.priority] ?? '#6366F1';
      const done = t.status === 'done';
      return `<div class="cal-task" style="background:${pColor}18;color:${pColor};${done ? 'text-decoration:line-through;opacity:0.6;' : ''}">${t.title}</div>`;
    }).join('');
    const more = day.tasks.length > 3 ? `<div style="font-size:9px;color:#6366F1;font-weight:700;margin-top:1px;">+${day.tasks.length - 3} more</div>` : '';
    return `<div class="cal-cell${extra}">
      <div class="cal-date">${dateNum}</div>
      ${taskPills}${more}
    </div>`;
  }).join('');

  const taskRows = data.taskList.map(t => `<tr>
    <td>${t.date}</td>
    <td style="font-weight:600;color:#1E293B;max-width:280px;">${t.title}</td>
    <td><span class="priority-badge p-${t.priority}">${t.priority}</span></td>
    <td><span class="status-badge s-${t.status}">${t.status === 'todo' ? 'To Do' : t.status === 'ongoing' ? 'In Progress' : 'Done'}</span></td>
  </tr>`).join('');

  const content = `
    <div class="logo-header">
      <div>
        <div class="logo-text">MyDayPal</div>
        <div class="logo-sub">Calendar Report</div>
      </div>
      <div style="text-align:right;">
        <div class="report-title">${data.monthLabel}</div>
        <div class="report-meta">Calendar Report &middot; Generated: ${data.generatedAt}</div>
      </div>
    </div>

    <div class="stats-grid" style="grid-template-columns:repeat(3,1fr);">
      <div class="stat-card">
        <div class="stat-label">Due This Month</div>
        <div class="stat-value">${data.monthStats.due}</div>
        <div class="stat-sub">tasks</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Completed</div>
        <div class="stat-value" style="color:#16A34A;">${data.monthStats.completed}</div>
        <div class="stat-sub">done</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Overdue</div>
        <div class="stat-value" style="color:#DC2626;">${data.monthStats.overdue}</div>
        <div class="stat-sub">tasks</div>
      </div>
    </div>

    <section>
      <h2>Calendar Overview</h2>
      <div class="cal-grid">
        ${headers}
        ${cells}
      </div>
    </section>

    ${data.taskList.length > 0 ? `<section>
      <h2>All Tasks This Month</h2>
      <table>
        <thead><tr><th>Date</th><th>Task</th><th>Priority</th><th>Status</th></tr></thead>
        <tbody>${taskRows}</tbody>
      </table>
    </section>` : ''}

    <footer>Generated by MyDayPal &middot; ${data.generatedAt}</footer>
  `;

  return wrap(content, `MyDayPal Calendar — ${data.monthLabel}`);
}

// ─── Project Report ───────────────────────────────────────────────────────────

export interface ProjectTaskItem {
  title: string;
  status: string;
  priority: string;
  dueDate?: string;
  subtasksDone: number;
  subtasksTotal: number;
  description?: string;
}

export interface ProjectData {
  generatedAt: string;
  projectName: string;
  projectColor: string;
  tasks: ProjectTaskItem[];
  stats: { total: number; done: number; ongoing: number; todo: number };
}

export function generateProjectReport(data: ProjectData): string {
  const completionPct = data.stats.total > 0 ? Math.round((data.stats.done / data.stats.total) * 100) : 0;

  const taskRows = data.tasks.map(t => `<tr>
    <td style="font-weight:600;color:#1E293B;max-width:250px;">
      <div>${t.title}</div>
      ${t.description ? `<div style="font-size:11px;color:#94A3B8;font-weight:400;margin-top:2px;">${t.description.slice(0, 80)}${t.description.length > 80 ? '…' : ''}</div>` : ''}
    </td>
    <td><span class="status-badge s-${t.status}">${t.status === 'todo' ? 'To Do' : t.status === 'ongoing' ? 'In Progress' : 'Done'}</span></td>
    <td><span class="priority-badge p-${t.priority}">${t.priority}</span></td>
    <td>${t.dueDate ? new Date(t.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
    <td>${t.subtasksTotal > 0 ? `${t.subtasksDone}/${t.subtasksTotal}` : '—'}</td>
  </tr>`).join('');

  const content = `
    <div class="logo-header">
      <div>
        <div class="logo-text">MyDayPal</div>
        <div class="logo-sub">Project Report</div>
      </div>
      <div style="text-align:right;">
        <div class="report-title" style="display:flex;align-items:center;gap:10px;justify-content:flex-end;">
          <div style="width:14px;height:14px;border-radius:50%;background:${data.projectColor};flex-shrink:0;"></div>
          ${data.projectName}
        </div>
        <div class="report-meta">Generated: ${data.generatedAt}</div>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Tasks</div>
        <div class="stat-value">${data.stats.total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Done</div>
        <div class="stat-value" style="color:#16A34A;">${data.stats.done}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">In Progress</div>
        <div class="stat-value" style="color:#CA8A04;">${data.stats.ongoing}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Completion</div>
        <div class="stat-value" style="color:${data.projectColor};">${completionPct}%</div>
      </div>
    </div>

    <section>
      <h2>Progress</h2>
      <div style="background:#F1F5F9;border-radius:6px;overflow:hidden;height:10px;">
        <div style="height:100%;width:${completionPct}%;background:${data.projectColor};border-radius:6px;transition:width 0.3s ease;"></div>
      </div>
      <div style="margin-top:6px;font-size:11px;color:#64748B;">${data.stats.done} of ${data.stats.total} tasks complete</div>
    </section>

    ${data.tasks.length > 0 ? `<section>
      <h2>Tasks (${data.tasks.length})</h2>
      <table>
        <thead><tr><th>Task</th><th>Status</th><th>Priority</th><th>Due</th><th>Subtasks</th></tr></thead>
        <tbody>${taskRows}</tbody>
      </table>
    </section>` : '<section><h2>Tasks</h2><p style="color:#94A3B8;font-size:13px;">No tasks in this project.</p></section>'}

    <footer>Generated by MyDayPal &middot; ${data.generatedAt}</footer>
  `;

  return wrap(content, `MyDayPal — ${data.projectName}`);
}
