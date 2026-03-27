import { useState, useEffect } from 'react';
import ShaderBackground from './ShaderBackground';
import iconMark from '../assets/icon-mark.svg';

export default function SplashScreen({ onDone }: { onDone: () => void }) {
  const [fadeOut, setFadeOut] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => dismiss(), 5000);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setFadeOut(true);
    setTimeout(() => { setVisible(false); onDone(); }, 600);
  }

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#050a14',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.6s ease',
      overflow: 'hidden',
    }}>
      {/* Shader canvas */}
      <ShaderBackground />

      {/* Content overlay */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
      }}>
        {/* Logo + branding */}
        <div
          className="animate-fade"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
          }}
        >
          {/* Icon */}
          <img
            src={iconMark}
            alt="MyDayPal"
            style={{
              width: 88,
              height: 88,
              borderRadius: 22,
              boxShadow: '0 8px 40px rgba(24, 95, 165, 0.4), 0 0 80px rgba(24, 95, 165, 0.15)',
            }}
          />

          {/* App name */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: 38,
              fontWeight: 800,
              letterSpacing: '-1.2px',
              color: 'rgba(180, 200, 240, 0.95)',
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              lineHeight: 1.1,
              margin: 0,
            }}>
              MyDayPal
            </h1>
            <p style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: 'rgba(140, 170, 220, 0.55)',
              marginTop: 10,
            }}>
              Your Daily Companion
            </p>
          </div>
        </div>

        {/* Skip button */}
        <button
          onClick={dismiss}
          className="btn-press"
          style={{
            position: 'absolute',
            bottom: 48,
            padding: '10px 28px',
            borderRadius: 9999,
            border: '1px solid rgba(140, 170, 220, 0.15)',
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            color: 'rgba(180, 200, 240, 0.5)',
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            letterSpacing: '0.04em',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
            e.currentTarget.style.borderColor = 'rgba(140, 170, 220, 0.3)';
            e.currentTarget.style.color = 'rgba(180, 200, 240, 0.8)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.borderColor = 'rgba(140, 170, 220, 0.15)';
            e.currentTarget.style.color = 'rgba(180, 200, 240, 0.5)';
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
