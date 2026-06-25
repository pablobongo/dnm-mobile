// GiornataPage.jsx — pagina principale: log del giorno corrente
import { useState, useEffect } from 'react';
import PastoCard from './PastoCard';
import {
  getPianoAttivo, getLogByDate, saveLogDay,
  today, getDayKey, calcolaTotali
} from './store';

export default function GiornataPage({ onNavigate, showToast }) {
  const [piano, setPiano] = useState(null);
  const [dayKey, setDayKey] = useState('');
  const [dataOggi, setDataOggi] = useState('');
  const [logDay, setLogDay] = useState({});
  const [loading, setLoading] = useState(false);
  const [invioOk, setInvioOk] = useState(false);

  useEffect(() => {
    const d = today();
    const dk = getDayKey(d);
    setDataOggi(d);
    setDayKey(dk);
    const p = getPianoAttivo();
    setPiano(p);
    const log = getLogByDate(d) || {};
    setLogDay(log);
  }, []);

  const giornoData = piano?.giorni?.[dayKey];
  const isLibero = !giornoData || giornoData.tipo === 'libero';
  const isWeekend = dayKey === 'sabato' || dayKey === 'domenica';

  // Aggiorna un campo del log
  const updateLog = (key, val) => {
    setLogDay(prev => ({ ...prev, [key]: val }));
  };

  // Aggiorna lo stato di un pasto (struttura {stato, note})
  const updatePasto = (key, val) => {
    setLogDay(prev => ({ ...prev, [key]: val }));
  };

  // Invia la giornata al Google Sheet
  const handleInvia = async () => {
    if (!piano) { showToast('Nessun piano attivo', 'error'); return; }

    const config = JSON.parse(localStorage.getItem('dnm_config') || '{}');
    if (!config.scriptUrl) {
      showToast('Configura prima l\'URL Google Sheet nelle impostazioni', 'error');
      return;
    }

    setLoading(true);

    // Costruisci payload dallo stato corrente
    const totali = calcolaTotali(logDay, piano);
    const payload = {
      data: dataOggi,
      piano_id: piano.meta.nome,

      colazione_fatta:   logDay.colazione?.stato === 'si' ? 'si' : 'no',
      colazione_kcal:    piano.pasti_fissi?.colazione?.macro?.kcal || '',
      colazione_p:       piano.pasti_fissi?.colazione?.macro?.proteine_g || '',
      colazione_c:       piano.pasti_fissi?.colazione?.macro?.carboidrati_g || '',
      colazione_g:       piano.pasti_fissi?.colazione?.macro?.grassi_g || '',
      colazione_note:    logDay.colazione?.note || '',

      post_all_fatto:     logDay.post_all?.stato === 'si' ? 'si' : 'no',
      post_all_con_latte: logDay.post_all_latte ? 'si' : 'no',
      post_all_kcal:     logDay.post_all_latte
        ? piano.pasti_fissi?.post_allenamento?.macro?.con_latte?.kcal || ''
        : piano.pasti_fissi?.post_allenamento?.macro?.senza_latte?.kcal || '',
      post_all_p:        logDay.post_all_latte
        ? piano.pasti_fissi?.post_allenamento?.macro?.con_latte?.proteine_g || ''
        : piano.pasti_fissi?.post_allenamento?.macro?.senza_latte?.proteine_g || '',
      post_all_c:        logDay.post_all_latte
        ? piano.pasti_fissi?.post_allenamento?.macro?.con_latte?.carboidrati_g || ''
        : piano.pasti_fissi?.post_allenamento?.macro?.senza_latte?.carboidrati_g || '',
      post_all_g:        logDay.post_all_latte
        ? piano.pasti_fissi?.post_allenamento?.macro?.con_latte?.grassi_g || ''
        : piano.pasti_fissi?.post_allenamento?.macro?.senza_latte?.grassi_g || '',
      post_all_note:     logDay.post_all?.note || '',

      spuntino_fatto:  logDay.spuntino?.stato === 'si' ? 'si' : 'no',
      spuntino_kcal:   giornoData?.spuntino_lavoro?.macro?.kcal || '',
      spuntino_p:      giornoData?.spuntino_lavoro?.macro?.proteine_g || '',
      spuntino_c:      giornoData?.spuntino_lavoro?.macro?.carboidrati_g || '',
      spuntino_g:      giornoData?.spuntino_lavoro?.macro?.grassi_g || '',
      spuntino_note:   logDay.spuntino?.note || '',

      cena_id:    giornoData?.cena?.id || '',
      cena_fatta: logDay.cena?.stato === 'si' ? 'si' : 'no',
      cena_kcal:  giornoData?.cena?.macro?.kcal || '',
      cena_p:     giornoData?.cena?.macro?.proteine_g || '',
      cena_c:     giornoData?.cena?.macro?.carboidrati_g || '',
      cena_g:     giornoData?.cena?.macro?.grassi_g || '',
      cena_note:  logDay.cena?.note || '',

      extra:              logDay.extra_testo || '',
      extra_kcal_stimate: logDay.extra_kcal || '',

      peso_kg:              logDay.peso_kg || '',
      bmi:                  logDay.bmi || '',
      bmr:                  logDay.bmr || '',
      grasso_pct:           logDay.grasso_pct || '',
      massa_grassa_kg:      logDay.massa_grassa_kg || '',
      muscolo_pct:          logDay.muscolo_pct || '',
      massa_muscolare_kg:   logDay.massa_muscolare_kg || '',
      acqua_pct:            logDay.acqua_pct || '',
      massa_proteica_kg:    logDay.massa_proteica_kg || '',
      grasso_viscerale:     logDay.grasso_viscerale || '',
      rapporto_vita_fianchi:logDay.rapporto_vita_fianchi || '',

      ...totali,

      energia: logDay.energia || '',
    };

    // Salva localmente
    saveLogDay(dataOggi, payload);

    try {
      const res = await fetch(config.scriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.ok) {
        setInvioOk(true);
        showToast('Giornata inviata ✓', 'success');
      } else {
        showToast('Errore invio: ' + json.error, 'error');
      }
    } catch (err) {
      // Salva comunque in locale, invierà al prossimo tentativo
      showToast('Salvato in locale (nessuna connessione)', 'info');
    }

    setLoading(false);
  };

  // Formatta data leggibile
  const dataLeggibile = dataOggi
    ? new Date(dataOggi + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
    : '';

  const totali = piano ? calcolaTotali(logDay, piano) : null;

  if (!piano) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🍽️</div>
        <div className="fw-bold text-lg">Nessun piano attivo</div>
        <div className="text-muted mt-8">Vai nelle impostazioni per caricare il tuo piano alimentare.</div>
        <button className="btn btn--primary mt-24" onClick={() => onNavigate('impostazioni')}>
          Vai alle impostazioni
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      {/* Header giorno */}
      <div className="card card--gradient" style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
          {dataLeggibile}
        </div>
        <div className="fw-bold" style={{ fontSize: 22, marginTop: 4 }}>
          {isWeekend ? '🎉 Giorno libero' : `${giornoData?.tipo === 'allenamento' ? '💪' : '🏃'} ${giornoData?.tipo === 'allenamento' ? 'Allenamento' : 'Riposo'}`}
        </div>

        {/* Totali kcal */}
        {totali && totali.totale_kcal > 0 && (
          <div className="macro-row mt-12">
            <div className="macro-chip">
              <div className="macro-chip__label">Kcal tot.</div>
              <div className="macro-chip__value" style={{ color: 'var(--accent-magenta)' }}>{totali.totale_kcal}</div>
            </div>
            <div className="macro-chip">
              <div className="macro-chip__label">P</div>
              <div className="macro-chip__value">{totali.totale_p}</div>
              <div className="macro-chip__unit">g</div>
            </div>
            <div className="macro-chip">
              <div className="macro-chip__label">C</div>
              <div className="macro-chip__value">{totali.totale_c}</div>
              <div className="macro-chip__unit">g</div>
            </div>
            <div className="macro-chip">
              <div className="macro-chip__label">G</div>
              <div className="macro-chip__value">{totali.totale_g}</div>
              <div className="macro-chip__unit">g</div>
            </div>
          </div>
        )}
      </div>

      {/* GIORNO LIBERO */}
      {isLibero ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 40 }}>🔓</div>
          <div className="fw-bold mt-8">Nessun piano per oggi</div>
          <div className="text-muted text-sm mt-8">Puoi comunque registrare eventuali extra nella sezione qui sotto.</div>
        </div>
      ) : (
        <>
          {/* PASTI FISSI */}
          <div className="section-title">Pasti fissi</div>

          {/* Colazione */}
          <PastoCard
            pasto={piano.pasti_fissi.colazione}
            statoKey="colazione"
            statoPasto={logDay.colazione}
            onChange={updatePasto}
          />

          {/* Post-allenamento */}
          <PastoCard
            pasto={piano.pasti_fissi.post_allenamento}
            statoKey="post_all"
            statoPasto={logDay.post_all}
            onChange={updatePasto}
          />

          {/* Toggle latte post-allenamento */}
          {logDay.post_all?.stato === 'si' && (
            <div className="card mt-8" style={{ padding: '12px 16px' }}>
              <div className="flex-between">
                <span className="text-sm text-secondary">Con latte (150ml)?</span>
                <div className="toggle-group" style={{ width: 'auto', gap: 8 }}>
                  <button
                    className={`toggle-btn ${logDay.post_all_latte === true ? 'active--si' : ''}`}
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    onClick={() => updateLog('post_all_latte', true)}
                  >Sì</button>
                  <button
                    className={`toggle-btn ${logDay.post_all_latte === false ? 'active--no' : ''}`}
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    onClick={() => updateLog('post_all_latte', false)}
                  >No</button>
                </div>
              </div>
            </div>
          )}

          {/* PASTI DEL GIORNO */}
          <div className="section-title mt-16">Pasti del giorno</div>

          {/* Spuntino lavoro */}
          {giornoData.spuntino_lavoro && (
            <PastoCard
              pasto={giornoData.spuntino_lavoro}
              statoKey="spuntino"
              statoPasto={logDay.spuntino}
              onChange={updatePasto}
            />
          )}

          {/* Cena */}
          {giornoData.cena && (
            <PastoCard
              pasto={giornoData.cena}
              statoKey="cena"
              statoPasto={logDay.cena}
              onChange={updatePasto}
            />
          )}
        </>
      )}

      {/* EXTRA FUORI PIANO */}
      <div className="section-title mt-24">Extra fuori piano</div>
      <div className="card">
        <div>
          <label className="label">Cosa hai mangiato in più?</label>
          <textarea
            className="input"
            placeholder="Es: pizza 2 fette, birra media, barretta proteica..."
            value={logDay.extra_testo || ''}
            onChange={e => updateLog('extra_testo', e.target.value)}
          />
        </div>
        <div className="mt-8">
          <label className="label">Kcal stimate (opzionale)</label>
          <input
            type="number"
            className="input"
            placeholder="Es: 500"
            value={logDay.extra_kcal || ''}
            onChange={e => updateLog('extra_kcal', e.target.value)}
          />
        </div>
      </div>

      {/* ENERGIA */}
      <div className="section-title mt-24">Energia della giornata</div>
      <div className="card">
        <div className="energia-stars">
          {[1,2,3,4,5].map(n => (
            <button
              key={n}
              className={`energia-star ${(logDay.energia || 0) >= n ? 'active' : ''}`}
              onClick={() => updateLog('energia', n)}
            >★</button>
          ))}
          <span className="text-muted text-sm" style={{ alignSelf: 'center', marginLeft: 8 }}>
            {logDay.energia ? `${logDay.energia}/5` : 'Non indicato'}
          </span>
        </div>
      </div>

      {/* BILANCIA */}
      <div className="section-title mt-24">Dati bilancia</div>
      <div className="card">
        <div className="text-muted text-sm mb-12">
          Apri la foto del report Xiaomi e inserisci i valori.
        </div>
        <button
          className="btn btn--secondary btn--full mb-12"
          onClick={() => onNavigate('bilancia')}
        >
          ⚖️ Inserisci dati bilancia
        </button>
        {[
          { key: 'peso_kg',            label: 'Peso (kg)',                 placeholder: '88.0' },
          { key: 'bmi',                label: 'BMI',                       placeholder: '24.0' },
          { key: 'bmr',                label: 'Metabolismo basale (kcal)', placeholder: '1850' },
          { key: 'grasso_pct',         label: 'Grasso corporeo (%)',        placeholder: '22.0' },
          { key: 'massa_grassa_kg',    label: 'Massa grassa (kg)',          placeholder: '19.0' },
          { key: 'muscolo_pct',        label: 'Massa muscolare (%)',        placeholder: '38.0' },
          { key: 'massa_muscolare_kg', label: 'Massa muscolare (kg)',       placeholder: '33.0' },
          { key: 'acqua_pct',          label: 'Acqua corporea (%)',         placeholder: '55.0' },
          { key: 'massa_proteica_kg',  label: 'Massa proteica (kg)',        placeholder: '12.0' },
          { key: 'grasso_viscerale',   label: 'Grasso viscerale (1-59)',    placeholder: '8' },
          { key: 'rapporto_vita_fianchi', label: 'Rapporto vita/fianchi',  placeholder: '0.85' },
        ].map(({ key, label, placeholder }) => (
          logDay[key] ? (
            <div key={key} className="flex-between" style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span className="text-secondary text-sm">{label}</span>
              <span className="fw-bold text-sm">{logDay[key]}</span>
            </div>
          ) : null
        ))}
      </div>

      {/* TASTO INVIA */}
      <div style={{ marginTop: 32 }}>
        {invioOk && (
          <div style={{ textAlign: 'center', color: 'var(--success)', marginBottom: 12, fontSize: 14 }}>
            ✓ Giornata già inviata — puoi reinviare per aggiornare
          </div>
        )}
        <button
          className="btn btn--primary btn--full"
          onClick={handleInvia}
          disabled={loading}
          style={{ fontSize: 17, padding: '15px 24px' }}
        >
          {loading ? <span className="spinner" /> : `${invioOk ? '🔄 Aggiorna' : '📤 Invia'} giornata`}
        </button>
      </div>
    </div>
  );
}
