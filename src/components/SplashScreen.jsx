import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onFinish }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Déclenche l'effet de disparition fondu après 1.8 secondes
    const timer1 = setTimeout(() => {
      setFadeOut(true);
    }, 1800);

    // Termine l'animation et affiche l'application après 2.3 secondes
    const timer2 = setTimeout(() => {
      onFinish();
    }, 2300);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onFinish]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease-in-out',
        pointerEvents: fadeOut ? 'none' : 'all',
      }}
    >
      <h1
        style={{
          fontSize: '3.2rem',
          fontWeight: '800',
          color: '#ffffff',
          letterSpacing: '-0.03em',
          animation: 'popIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        FlowStock<span style={{ color: '#2563eb' }}>.</span>
      </h1>
      
      <p style={{ 
        color: '#94a3b8', 
        fontSize: '0.9rem', 
        marginTop: '8px',
        opacity: 0,
        animation: 'fadeIn 0.8s ease 0.3s forwards' 
      }}>
        Gestion de stock simplifiée
      </p>

      <style>{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes fadeIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}