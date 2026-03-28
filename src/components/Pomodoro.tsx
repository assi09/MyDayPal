import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, X, SkipForward } from 'lucide-react';
import { useStore } from '../store';
import { sendNotification } from '@tauri-apps/plugin-notification';

type Phase = 'work' | 'break';

export default function Pomodoro() {
  const { pomodoroTaskId, pomodoroTaskTitle, stopPomodoro, settings } = useStore();

  const workSeconds = settings.pomodoroWorkMinutes * 60;
  const breakSeconds = settings.pomodoroBreakMinutes * 60;

  const [phase, setPhase] = useState<Phase>('work');
  const [secondsLeft, setSecondsLeft] = useState(workSeconds);
  const [running, setRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [bonusMsg, setBonusMsg] = useState('');

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevTaskId = useRef<string | null>(null);

  // Reset when a new task starts
  useEffect(() => {
    if (pomodoroTaskId && pomodoroTaskId !== prevTaskId.current) {
      prevTaskId.current = pomodoroTaskId;
      setPhase('work');
      setSecondsLeft(workSeconds);
      setRunning(true);
      setSessionsCompleted(0);
      setBonusMsg('');
    }
  }, [pomodoroTaskId, workSeconds]);

  // Update seconds when settings change (only if not running)
  useEffect(() => {
    if (!running) {
      setSecondsLeft(phase === 'work' ? workSeconds : breakSeconds);
    }
  }, [settings.pomodoroWorkMinutes, settings.pomodoroBreakMinutes]);

  const handlePhaseComplete = useCallback(async () => {
    setRunning(false);
    if (phase === 'work') {
      setSessionsCompleted(s => s + 1);
      setBonusMsg('+20 XP bonus!');
      setTimeout(() => setBonusMsg(''), 3000);
      try {
        await sendNotification({ title: 'MyDayPal — Time\'s up!', body: 'Great focus session! Time to take a break.' });
      } catch (_) { /* notifications may not be available */ }
      setPhase('break');
      setSecondsLeft(breakSeconds);
    } else {
      try {
        await sendNotification({ title: 'MyDayPal — Break over!', body: 'Ready to focus? Start your next session.' });
      } catch (_) { /* notifications may not be available */ }
      setPhase('work');
      setSecondsLeft(workSeconds);
    }
  }, [phase, breakSeconds, workSeconds]);

  // Timer tick
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft(s => {
          if (s <= 1) {
            handlePhaseComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, handlePhaseComplete]);

  function handleStop() {
    setRunning(false);
    setPhase('work');
    setSecondsLeft(workSeconds);
    setSessionsCompleted(0);
    prevTaskId.current = null;
    stopPomodoro();
  }

  function handleSkip() {
    if (phase === 'work') {
      setPhase('break');
      setSecondsLeft(breakSeconds);
    } else {
      setPhase('work');
      setSecondsLeft(workSeconds);
    }
    setRunning(false);
  }

  if (!pomodoroTaskId) return null;

  const totalSeconds = phase === 'work' ? workSeconds : breakSeconds;
  const progress = 1 - secondsLeft / totalSeconds;
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG ring
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDash = progress * circumference;

  const phaseColor = phase === 'work' ? 'var(--accent)' : '#22C55E';
  const phaseBg = phase === 'work' ? 'var(--accent-soft)' : '#22C55E18';

  return (
    <div
      className="animate-fadeup"
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 900,
        width: 284,
        background: 'var(--bg-card)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--r-lg)',
        boxShadow: '0 16px 48px rgba(0,0,0,0.4)',
        overflow: 'hidden',
      }}
    >
      {/* Phase indicator bar */}
      <div style={{
        height: 3,
        background: 'var(--bg-hover)',
        position: 'relative',
      }}>
        <div style={{
          position: 'absolute', top: 0, left: 0,
          height: '100%',
          width: `${progress * 100}%`,
          background: phaseColor,
          transition: 'width 1s linear',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>

      <div style={{ padding: '14px 16px 16px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
            textTransform: 'uppercase',
            padding: '2px 7px', borderRadius: 'var(--r-full)',
            background: phaseBg, color: phaseColor,
            flexShrink: 0,
          }}>
            {phase === 'work' ? 'Focus' : 'Break'}
          </span>
          <span style={{
            flex: 1, fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {pomodoroTaskTitle}
          </span>
          <button
            onClick={handleStop}
            style={{
              width: 20, height: 20, borderRadius: 4,
              border: 'none', background: 'transparent',
              color: 'var(--text-muted)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color var(--t-fast)',
              flexShrink: 0,
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--priority-high)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            title="Stop timer"
          >
            <X size={12} strokeWidth={2.5} />
          </button>
        </div>

        {/* Timer ring + time */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
            <svg width={88} height={88} style={{ transform: 'rotate(-90deg)' }}>
              {/* Track */}
              <circle cx={44} cy={44} r={radius}
                fill="none" stroke="var(--bg-hover)" strokeWidth={6} />
              {/* Progress */}
              <circle cx={44} cy={44} r={radius}
                fill="none"
                stroke={phaseColor}
                strokeWidth={6}
                strokeLinecap="round"
                strokeDasharray={`${strokeDash} ${circumference}`}
                style={{ transition: 'stroke-dasharray 1s linear' }}
              />
            </svg>
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                fontSize: 18, fontWeight: 800, color: 'var(--text-primary)',
                letterSpacing: '-1px', lineHeight: 1,
                animation: running ? 'none' : undefined,
              }}>
                {timeStr}
              </span>
              {sessionsCompleted > 0 && (
                <span style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>
                  {sessionsCompleted} done
                </span>
              )}
            </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {bonusMsg && (
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#22C55E',
                background: '#22C55E18', padding: '4px 8px',
                borderRadius: 'var(--r-xs)', textAlign: 'center',
              }}>
                {bonusMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6 }}>
              {/* Play/Pause */}
              <button
                onClick={() => setRunning(r => !r)}
                style={{
                  flex: 1, height: 36, borderRadius: 'var(--r-sm)',
                  border: 'none',
                  background: phaseColor,
                  color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  fontSize: 12, fontWeight: 700,
                  gap: 5,
                  transition: 'opacity var(--t-fast)',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                {running ? <Pause size={14} strokeWidth={2.5} /> : <Play size={14} strokeWidth={2.5} />}
                {running ? 'Pause' : 'Resume'}
              </button>

              {/* Skip */}
              <button
                onClick={handleSkip}
                style={{
                  width: 36, height: 36, borderRadius: 'var(--r-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-tertiary)', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all var(--t-fast)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = phaseColor; e.currentTarget.style.color = phaseColor; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                title="Skip phase"
              >
                <SkipForward size={13} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
