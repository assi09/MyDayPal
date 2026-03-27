import { useState } from 'react';
import {
  LayoutGrid, List, CalendarDays, Map, Plus, CheckCircle2,
  Layers, ArrowRight, Sparkles, GripVertical, Sun, Moon,
  Target, Zap, Tag,
} from 'lucide-react';
import iconMark from '../assets/icon-mark.svg';
import { useStore } from '../store';

const ONBOARDING_KEY = 'mydaypal-onboarded';

export function hasOnboarded(): boolean {
  return localStorage.getItem(ONBOARDING_KEY) === '1';
}

function markOnboarded() {
  localStorage.setItem(ONBOARDING_KEY, '1');
}

// ─── Sample data to seed ──────────────────────────────────────────────────────

function seedSampleData(
  addProject: (name: string, color: string) => void,
  addTask: (task: any) => void,
) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const daysFromNow = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return fmt(d);
  };

  addProject('Getting Started', '#6366F1');

  // We need a small delay for the project to be in store
  setTimeout(() => {
    const store = useStore.getState();
    const project = store.projects.find(p => p.name === 'Getting Started');
    const pid = project?.id ?? null;

    const tasks = [
      {
        title: 'Explore the Kanban board',
        description: 'Drag and drop tasks between columns to change their status. Try moving this task to "In Progress"!',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId: pid,
        tags: [],
        subtasks: [
          { id: 's1', title: 'Drag a task to In Progress', completed: false },
          { id: 's2', title: 'Drag a task to Done', completed: false },
        ],
        dueDate: daysFromNow(3),
        complexity: 2 as const,
      },
      {
        title: 'Try different views',
        description: 'Switch between Board, List, Calendar, and Roadmap using the segmented control in the header.',
        status: 'todo' as const,
        priority: 'high' as const,
        projectId: pid,
        tags: [],
        subtasks: [
          { id: 's3', title: 'Open the List view', completed: false },
          { id: 's4', title: 'Open the Calendar view', completed: false },
          { id: 's5', title: 'Open the Roadmap view', completed: false },
        ],
        dueDate: daysFromNow(1),
        complexity: 1 as const,
      },
      {
        title: 'Create your first project',
        description: 'Click the + button next to "Projects" in the sidebar to create a new project with a custom color.',
        status: 'todo' as const,
        priority: 'low' as const,
        projectId: pid,
        tags: [],
        subtasks: [],
        dueDate: daysFromNow(7),
        complexity: 1 as const,
      },
      {
        title: 'Set up task priorities and due dates',
        description: 'Click on any task to open the editor. Set priorities from Low to Critical, add due dates, subtasks, and tags.',
        status: 'todo' as const,
        priority: 'critical' as const,
        projectId: pid,
        tags: [],
        subtasks: [],
        dueDate: fmt(today),
        complexity: 2 as const,
      },
      {
        title: 'Check the Roadmap view',
        description: 'The Roadmap has 5 scoring modes that help you decide what to work on next. Try the tree and list views!',
        status: 'todo' as const,
        priority: 'medium' as const,
        projectId: pid,
        tags: [],
        subtasks: [
          { id: 's6', title: 'Switch between tree and list', completed: false },
          { id: 's7', title: 'Try all 5 roadmap modes', completed: false },
        ],
        dueDate: daysFromNow(5),
        complexity: 3 as const,
      },
    ];

    tasks.forEach(t => addTask(t));
  }, 50);
}

// ─── Step definitions ─────────────────────────────────────────────────────────

interface Step {
  title: string;
  subtitle: string;
  content: React.ReactNode;
}

function useSteps(): Step[] {
  return [
    {
      title: 'Welcome to MyDayPal',
      subtitle: 'Your daily companion for getting things done',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>
          <img
            src={iconMark}
            alt="MyDayPal"
            style={{
              width: 72, height: 72, borderRadius: 18,
              boxShadow: '0 6px 30px rgba(24, 95, 165, 0.35)',
            }}
          />
          <p style={{
            fontSize: 14, lineHeight: 1.7, color: 'var(--text-secondary)',
            textAlign: 'center', maxWidth: 380, fontWeight: 500,
          }}>
            MyDayPal helps you organize tasks, track progress, and stay on top of your priorities
            with beautiful views and smart scoring.
          </p>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 380,
          }}>
            <FeatureChip icon={<LayoutGrid size={14} />} label="Kanban Board" />
            <FeatureChip icon={<CalendarDays size={14} />} label="Calendar View" />
            <FeatureChip icon={<Map size={14} />} label="Smart Roadmap" />
            <FeatureChip icon={<Sparkles size={14} />} label="XP Dashboard" />
          </div>
        </div>
      ),
    },
    {
      title: 'Four powerful views',
      subtitle: 'Switch between layouts that match how you think',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400 }}>
          <ViewCard
            icon={<LayoutGrid size={18} strokeWidth={1.8} />}
            name="Board"
            desc="Drag-and-drop Kanban columns: To Do, In Progress, Done"
            accent="#6366F1"
          />
          <ViewCard
            icon={<List size={18} strokeWidth={1.8} />}
            name="List"
            desc="Compact sortable list with expandable details"
            accent="#3B82F6"
          />
          <ViewCard
            icon={<CalendarDays size={18} strokeWidth={1.8} />}
            name="Calendar"
            desc="Monthly view with task pills and day detail panel"
            accent="#22C55E"
          />
          <ViewCard
            icon={<Map size={18} strokeWidth={1.8} />}
            name="Roadmap"
            desc="Tree graph, lane view, and XP Dashboard with scoring modes"
            accent="#F59E0B"
          />
        </div>
      ),
    },
    {
      title: 'Organize your way',
      subtitle: 'Projects, priorities, tags, and subtasks',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', maxWidth: 400 }}>
          <OrgCard
            icon={<Layers size={16} strokeWidth={2} />}
            title="Projects"
            desc="Group tasks by project with custom colors. Click + in the sidebar to create one."
            color="#6366F1"
          />
          <OrgCard
            icon={<Target size={16} strokeWidth={2} />}
            title="Priorities"
            desc="Four levels: Low, Medium, High, and Critical. Each gets a color-coded stripe."
            color="#F97316"
          />
          <OrgCard
            icon={<Zap size={16} strokeWidth={2} />}
            title="Complexity"
            desc="Rate task effort from 1 to 5. Used by the Roadmap scoring engine."
            color="#F59E0B"
          />
          <OrgCard
            icon={<Tag size={16} strokeWidth={2} />}
            title="Tags & Subtasks"
            desc="Add tags for filtering and break tasks into trackable subtasks."
            color="#22C55E"
          />
        </div>
      ),
    },
    {
      title: 'Quick tips',
      subtitle: 'A few things to help you get started fast',
      content: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', maxWidth: 400 }}>
          <TipRow icon={<GripVertical size={14} />} text="Drag tasks between columns on the Board to change their status" />
          <TipRow icon={<Plus size={14} />} text='Click "Add Task" at the bottom of any column, or use the + button on calendar days' />
          <TipRow icon={<CheckCircle2 size={14} />} text="Click any task to edit its title, description, priority, due date, and subtasks" />
          <TipRow icon={<Sun size={14} />} text="Toggle dark/light mode from the bottom of the sidebar" />
          <TipRow icon={<Moon size={14} />} text="Tasks with due dates trigger desktop notifications when they're due or overdue" />
          <TipRow icon={<Map size={14} />} text="The Roadmap scores tasks automatically — use it to find your best next move" />
          <TipRow icon={<Sparkles size={14} />} text="Switch to Stats in the Roadmap to see your XP dashboard — track daily, weekly, and monthly output" />

          <div style={{
            marginTop: 8, padding: '14px 16px',
            borderRadius: 'var(--r-md)',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent)',
          }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: 'var(--accent)',
              lineHeight: 1.6, textAlign: 'center',
            }}>
              We'll create a "Getting Started" project with sample tasks so you can explore right away.
            </p>
          </div>
        </div>
      ),
    },
  ];
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);
  const { addProject, addTask } = useStore();
  const steps = useSteps();

  function finish() {
    seedSampleData(addProject, addTask);
    markOnboarded();
    setFadeOut(true);
    setTimeout(onDone, 400);
  }

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
    else finish();
  }

  function skip() {
    markOnboarded();
    setFadeOut(true);
    setTimeout(onDone, 400);
  }

  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9998,
      background: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.4s ease',
    }}>
      <div
        className="animate-fadeup"
        style={{
          width: 500,
          maxHeight: '85vh',
          borderRadius: 'var(--r-xl)',
          background: 'var(--bg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-modal)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '28px 32px 0',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px',
            color: 'var(--text-primary)', marginBottom: 6,
          }}>
            {current.title}
          </h2>
          <p style={{
            fontSize: 13, fontWeight: 500, color: 'var(--text-muted)',
          }}>
            {current.subtitle}
          </p>
        </div>

        {/* Content */}
        <div
          key={step}
          className="animate-fade"
          style={{
            flex: 1, overflowY: 'auto',
            padding: '24px 32px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
          }}
        >
          {current.content}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 32px 24px',
          display: 'flex', alignItems: 'center', gap: 12,
          borderTop: '1px solid var(--border)',
        }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6, flex: 1 }}>
            {steps.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === step ? 20 : 6, height: 6,
                  borderRadius: 'var(--r-full)',
                  background: i === step ? 'var(--accent)' : i < step ? 'var(--accent)' : 'var(--bg-hover)',
                  opacity: i <= step ? 1 : 0.5,
                  transition: 'all 0.3s ease',
                }}
              />
            ))}
          </div>

          {/* Skip */}
          <button
            onClick={skip}
            className="btn-press"
            style={{
              padding: '8px 16px', borderRadius: 'var(--r-sm)',
              border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text-muted)',
              fontSize: 13, fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all var(--t-base)',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            Skip
          </button>

          {/* Next / Get Started */}
          <button
            onClick={next}
            className="btn-press"
            style={{
              padding: '8px 20px', borderRadius: 'var(--r-sm)',
              border: 'none',
              background: 'var(--accent)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', gap: 6,
              boxShadow: '0 2px 10px var(--accent-glow)',
              transition: 'all var(--t-base)',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
          >
            {isLast ? (
              <>
                <Sparkles size={14} strokeWidth={2} />
                Get Started
              </>
            ) : (
              <>
                Next
                <ArrowRight size={14} strokeWidth={2} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 'var(--r-md)',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    }}>
      <span style={{ color: 'var(--accent)', display: 'flex' }}>{icon}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
    </div>
  );
}

function ViewCard({ icon, name, desc, accent }: { icon: React.ReactNode; name: string; desc: string; accent: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '14px 16px', borderRadius: 'var(--r-md)',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
      boxShadow: `inset 3px 0 0 0 ${accent}`,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 'var(--r-sm)',
        background: accent + '15', color: accent,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{name}</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.4 }}>{desc}</div>
      </div>
    </div>
  );
}

function OrgCard({ icon, title, desc, color }: { icon: React.ReactNode; title: string; desc: string; color: string }) {
  return (
    <div style={{
      display: 'flex', gap: 12, padding: '12px 14px',
      borderRadius: 'var(--r-md)', background: 'var(--bg-secondary)',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 'var(--r-xs)',
        background: color + '18', color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1,
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-muted)', lineHeight: 1.5 }}>{desc}</div>
      </div>
    </div>
  );
}

function TipRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10,
      padding: '10px 12px', borderRadius: 'var(--r-sm)',
      background: 'var(--bg-secondary)', border: '1px solid var(--border)',
    }}>
      <div style={{
        color: 'var(--accent)', display: 'flex', marginTop: 1, flexShrink: 0,
      }}>
        {icon}
      </div>
      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {text}
      </span>
    </div>
  );
}
