import { X, Keyboard } from 'lucide-react';
import { useStore } from '../store';
import { AppSettings } from '../types';

// ─── Helper sub-components ────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: 'var(--text-muted)',
      padding: '20px 0 4px',
    }}>
      {children}
    </div>
  );
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      gap: 16, padding: '14px 0', borderBottom: '1px solid var(--border)',
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</div>
        {desc && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.5 }}>
            {desc}
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{
        width: 40, height: 22, borderRadius: 11,
        background: value ? 'var(--accent)' : 'var(--bg-hover)',
        border: '1px solid var(--border)',
        position: 'relative', cursor: 'pointer',
        transition: 'background var(--t-base)',
        flexShrink: 0,
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 20 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: value ? '#fff' : 'var(--text-muted)',
        transition: 'left var(--t-spring)',
      }} />
    </button>
  );
}

function NumberInput({
  value, onChange, min, max,
}: {
  value: number; onChange: (n: number) => void; min?: number; max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(Math.max(min ?? 1, Math.min(max ?? 999, Number(e.target.value))))}
      min={min ?? 1}
      max={max ?? 999}
      style={{
        width: 64, padding: '5px 8px',
        borderRadius: 'var(--r-sm)',
        border: '1px solid var(--border)',
        background: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        fontSize: 13, textAlign: 'center', fontFamily: 'inherit',
      }}
    />
  );
}

type TimePickerValue = 'never' | '7days' | '30days';

function TimePicker({ value, onChange }: { value: TimePickerValue; onChange: (v: TimePickerValue) => void }) {
  const opts: { value: TimePickerValue; label: string }[] = [
    { value: 'never', label: 'Never' },
    { value: '7days', label: '7 days' },
    { value: '30days', label: '30 days' },
  ];
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {opts.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '5px 12px',
            borderRadius: 'var(--r-full)',
            border: `1px solid ${value === o.value ? 'var(--accent)' : 'var(--border)'}`,
            background: value === o.value ? 'var(--accent-soft)' : 'transparent',
            color: value === o.value ? 'var(--accent)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ToggleWithNumber({
  enabled, onToggle, value, onValue, label, desc, unit,
}: {
  enabled: boolean;
  onToggle: (v: boolean) => void;
  value: number;
  onValue: (n: number) => void;
  label: string;
  desc: string;
  unit: string;
}) {
  return (
    <SettingRow label={label} desc={desc}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {enabled && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <NumberInput value={value} onChange={onValue} min={1} max={365} />
            <span style={{ fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{unit}</span>
          </div>
        )}
        <Toggle value={enabled} onChange={onToggle} />
      </div>
    </SettingRow>
  );
}

// ─── Settings Modal ──────────────────────────────────────────────────────────

export default function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useStore();

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    updateSettings({ [key]: value } as Partial<AppSettings>);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        padding: '24px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="animate-fadeup"
        style={{
          background: 'var(--bg)',
          border: '1px solid var(--border-strong)',
          borderRadius: 'var(--r-xl, 16px)',
          width: '100%',
          maxWidth: 640,
          maxHeight: '82vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{
              fontSize: 20, fontWeight: 800, color: 'var(--text-primary)',
              letterSpacing: '-0.5px', margin: 0,
            }}>
              Settings
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, margin: '4px 0 0' }}>
              Customize your MyDayPal experience
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all var(--t-base)',
              flexShrink: 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-tertiary)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <X size={14} strokeWidth={2.2} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 24px 28px' }}>

          {/* ── Smart Automation ── */}
          <SectionHeader>Smart Automation</SectionHeader>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '0 20px',
          }}>
            <SettingRow
              label="Auto-archive completed projects"
              desc="Automatically archive projects after all tasks are done for the specified time"
            >
              <TimePicker
                value={settings.autoArchiveProjects}
                onChange={v => set('autoArchiveProjects', v)}
              />
            </SettingRow>
          </div>

          {/* ── Task Rules ── */}
          <SectionHeader>Task Rules</SectionHeader>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '0 20px',
          }}>
            <ToggleWithNumber
              label="Overdue Escalation"
              desc="Automatically bump the priority of tasks that remain overdue"
              enabled={settings.overdueEscalationEnabled}
              onToggle={v => set('overdueEscalationEnabled', v)}
              value={settings.overdueEscalationDays}
              onValue={v => set('overdueEscalationDays', v)}
              unit="days overdue"
            />
            <ToggleWithNumber
              label="Stale Task Detection"
              desc="Flag tasks that haven't been updated in a while so you can revisit them"
              enabled={settings.staleTaskEnabled}
              onToggle={v => set('staleTaskEnabled', v)}
              value={settings.staleTaskDays}
              onValue={v => set('staleTaskDays', v)}
              unit="days without update"
            />
            <ToggleWithNumber
              label="Due Date Buffer"
              desc="Show an early warning badge before a task's due date approaches"
              enabled={settings.dueDateBufferEnabled}
              onToggle={v => set('dueDateBufferEnabled', v)}
              value={settings.dueDateBufferDays}
              onValue={v => set('dueDateBufferDays', v)}
              unit="days before due"
            />
            <ToggleWithNumber
              label="Daily Task Cap"
              desc="Limit the number of active tasks visible per day to avoid overwhelm"
              enabled={settings.dailyTaskCapEnabled}
              onToggle={v => set('dailyTaskCapEnabled', v)}
              value={settings.dailyTaskCap}
              onValue={v => set('dailyTaskCap', v)}
              unit="max tasks"
            />
            <ToggleWithNumber
              label="Complexity Balance"
              desc="Warn when too many high-complexity tasks are active at the same time"
              enabled={settings.complexityBalanceEnabled}
              onToggle={v => set('complexityBalanceEnabled', v)}
              value={settings.complexityBalanceMax}
              onValue={v => set('complexityBalanceMax', v)}
              unit="max complex tasks"
            />
          </div>

          {/* ── Focus Mode ── */}
          <SectionHeader>Focus Mode</SectionHeader>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '0 20px',
          }}>
            <SettingRow
              label="Focus Mode"
              desc="Show only today's tasks and high/critical priority items — cut out the noise"
            >
              <Toggle
                value={settings.focusModeEnabled}
                onChange={v => set('focusModeEnabled', v)}
              />
            </SettingRow>
          </div>

          {/* ── XP & Rewards ── */}
          <SectionHeader>XP & Rewards</SectionHeader>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '0 20px',
          }}>
            <SettingRow
              label="Streak Bonus"
              desc="Earn a bonus XP multiplier when you maintain an active completion streak"
            >
              <Toggle
                value={settings.streakBonusEnabled}
                onChange={v => set('streakBonusEnabled', v)}
              />
            </SettingRow>
            <SettingRow
              label="Early Bird Bonus"
              desc="+20% XP for tasks you complete before their due date"
            >
              <Toggle
                value={settings.earlyBirdBonusEnabled}
                onChange={v => set('earlyBirdBonusEnabled', v)}
              />
            </SettingRow>
          </div>

          {/* ── Pomodoro ── */}
          <SectionHeader>Pomodoro Timer</SectionHeader>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '0 20px',
          }}>
            <SettingRow
              label="Work Duration"
              desc="Length of each focus work session"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NumberInput
                  value={settings.pomodoroWorkMinutes}
                  onChange={v => set('pomodoroWorkMinutes', v)}
                  min={1}
                  max={120}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>min</span>
              </div>
            </SettingRow>
            <SettingRow
              label="Break Duration"
              desc="Length of each break between work sessions"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <NumberInput
                  value={settings.pomodoroBreakMinutes}
                  onChange={v => set('pomodoroBreakMinutes', v)}
                  min={1}
                  max={60}
                />
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>min</span>
              </div>
            </SettingRow>
          </div>

          {/* ── Shortcuts ── */}
          <SectionHeader>Shortcuts</SectionHeader>
          <div style={{
            background: 'var(--bg-secondary)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '0 20px',
          }}>
            <SettingRow
              label="Keyboard Shortcuts"
              desc="View all available keyboard shortcuts for navigation, task creation, and more"
            >
              <button
                onClick={() => {
                  onClose();
                  setTimeout(() => window.dispatchEvent(new CustomEvent('open-shortcuts')), 150);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)', color: 'var(--text-secondary)',
                  fontSize: 12.5, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all var(--t-base)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
              >
                <Keyboard size={13} strokeWidth={2} />
                View All
              </button>
            </SettingRow>
          </div>

        </div>
      </div>
    </div>
  );
}
