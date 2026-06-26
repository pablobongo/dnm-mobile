import { useState } from 'react';
import './index.css';
import GiornataPage      from './GiornataPage';
import BilanciaPage      from './BilanciaPage';
import ImpostazioniPage  from './ImpostazioniPage';
import StoricoPage       from './StoricoPage';
import { useToast }      from './useToast.jsx';
import { getLogByDate, saveLogDay, today, APP_VERSION } from './store';

export default function App() {
  const [pagina, setPagina] = useState('giornata');
  const { showToast, Toast } = useToast();

  const handleValoriBilancia = (valori) => {
    const d = today();
    const log = getLogByDate(d) || {};
    saveLogDay(d, { ...log, ...valori });
  };

  return (
    <>
      <header style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(13,0,32,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        padding: '14px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div style={{
              fontSize: 18, fontWeight: 800,
              background: 'var(--gradient-main)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em',
            }}>D.N.M.</div>
            <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>v{APP_VERSION}</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', marginTop: -2 }}>
            DEMOSE NA MOSSA
          </div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--gradient-btn)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>💪</div>
      </header>

      <main style={{ flex: 1, overflowY: 'auto' }}>
        {pagina === 'giornata' && (
          <GiornataPage onNavigate={setPagina} showToast={showToast} />
        )}
        {pagina === 'bilancia' && (
          <BilanciaPage
            onBack={() => setPagina('giornata')}
            onValoriConfermati={handleValoriBilancia}
            showToast={showToast}
          />
        )}
        {pagina === 'storico' && (
          <StoricoPage showToast={showToast} />
        )}
        {pagina === 'impostazioni' && (
          <ImpostazioniPage showToast={showToast} />
        )}
      </main>

      {pagina !== 'bilancia' && (
        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          height: 64,
          background: 'rgba(26,5,51,0.96)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'stretch', zIndex: 100,
        }}>
          {[
            { key: 'giornata',     icon: '🍽️', label: 'Oggi' },
            { key: 'storico',      icon: '📅',  label: 'Storico' },
            { key: 'impostazioni', icon: '⚙️',  label: 'Impostazioni' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setPagina(key)}
              style={{
                flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 2, position: 'relative',
                color: pagina === key ? 'var(--accent-violet)' : 'var(--text-muted)',
                transition: 'color 0.15s',
              }}
            >
              <span style={{ fontSize: 22 }}>{icon}</span>
              <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.05em' }}>{label}</span>
              {pagina === key && (
                <div style={{
                  position: 'absolute', bottom: 0, width: 32, height: 3,
                  background: 'var(--gradient-btn)',
                  borderRadius: '2px 2px 0 0',
                }} />
              )}
            </button>
          ))}
        </nav>
      )}

      {Toast}
    </>
  );
}
