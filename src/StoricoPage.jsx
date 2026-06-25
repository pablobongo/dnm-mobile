// StoricoPage.jsx — inserimento retroattivo per data scelta
import { useState, useEffect } from 'react';
import PastoCard from './PastoCard';
import {
  getPianoAttivo, getLogByDate, saveLogDay,
  getDayKey, calcolaTotali
} from './store';

const CAMPI_BILANCIA = [
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
];

export default function StoricoPage({ showToast }) {
  const [dataScelta, setDataScelta] = useState('');
  const [piano, setPiano] = useState(null);
  const [dayKey, setDayKey] = useState('');
  const [logDay, setLogDay] = useState({});
  const [loading, setLoading] = useState(false);
  const [invioOk, setInvioOk] = useState(false);

  useEffect(() => {
    setPiano(getPianoAttivo());
  }, []);

  useEffect(() => {
    if (!dataScelta) return;
    setDayKey(getDayKey(dataScelta));
    setLogDay(getLogByDate(dataScelta) || {});
    setInvioOk(false);
  }, [dataScelta]);

  const giornoData = piano?.giorni?.[dayKey];
  const isLibero = !giornoData || giornoData.tipo === 'libero';
  const isWeekend = dayKey === 'sabato' || dayKey === 'domenica';

  const updateLog   = (key, val) => setLogDay(prev => ({ ...prev, [key]: val }));
  const updatePasto = (key, val) => setLogDay(prev => ({ ...prev, [key]: val }));

  const handleInvia = async () => {
    if (!dataScelta) { showToast('Seleziona una data', 'error'); return; }
    if (!piano) { showToast('Nessun piano attivo', 'error'); return; }
    const config = JSON.parse(localStorage.getItem('dnm_config') || '{}');
    if (!config.scriptUrl) { showToast('URL Google Sheet mancante nelle impostazioni', 'error'); return; }

    setLoading(true);
    const totali = calcolaTotali(logDay, piano);
    const payload = {
      data: dataScelta,
      piano_id: piano.meta.nome,
      colazione_fatta:    logDay.colazione?.stato === 'si' ? 'si' : 'no',
      colazione_kcal:     piano.pasti_fissi?.colazione?.macro?.kcal || '',
      colazione_p:        piano.pasti_fissi?.colazione?.macro?.proteine_g || '',
      colazione_c:        piano.pasti_fissi?.colazione?.macro?.carboidrati_g || '',
      colazione_g:        piano.pasti_fissi?.colazione?.macro?.grassi_g || '',
      colazione_note:     logDay.colazione?.note || '',
      post_all_fatto:     logDay.post_all?.stato === 'si' ? 'si' : 'no',
      post_all_con_latte: logDay.post_all_latte ? 'si' : 'no',
      post_all_kcal:      logDay.post_all_latte ? piano.pasti_fissi?.post_allenamento?.macro?.con_latte?.kcal || '' : piano.pasti_fissi?.post_allenamento?.macro?.senza_latte?.kcal || '',
      post_all_p:         logDay.post_all_latte ? piano.pasti_fissi?.post_allenamento?.macro?.con_latte?.proteine_g || '' : piano.pasti_fissi?.post_allenamento?.macro?.senza_latte?.proteine_g || '',
      post_all_c:         logDay.post_all_latte ? piano.pasti_fissi?.post_allenamento?.macro?.con_latte?.carboidrati_g || '' : piano.pasti_fissi?.post_allenamento?.macro?.senza_latte?.carboidrati_g || '',
      post_all_g:         logDay.post_all_latte ? piano.pasti_fissi?.post_allenamento?.macro?.con_latte?.grassi_g || '' : piano.pasti_fissi?.post_allenamento?.macro?.senza_latte?.grassi_g || '',
      post_all_note:      logDay.post_all?.note || '',
      spuntino_fatto:     logDay.spuntino?.stato === 'si' ? 'si' : 'no',
      spuntino_kcal:      giornoData?.spuntino_lavoro?.macro?.kcal || '',
      spuntino_p:         giornoData?.spuntino_lavoro?.macro?.proteine_g || '',
      spuntino_c:         giornoData?.spuntino_lavoro?.macro?.carboidrati_g || '',
      spuntino_g:         giornoData?.spuntino_lavoro?.macro?.grassi_g || '',
      spuntino_note:      logDay.spuntino?.note || '',
      cena_id:            giornoData?.cena?.id || '',
      cena_fatta:         logDay.cena?.stato === 'si' ? 'si' : 'no',
      cena_kcal:          giornoData?.cena?.macro?.kcal || '',
      cena_p:             giornoData?.cena?.macro?.proteine_g || '',
      cena_c:             giornoData?.cena?.macro?.carboidrati_g || '',
      cena_g:             giornoData?.cena?.macro?.grassi_g || '',
      cena_note:          logDay.cena?.note || '',
      extra:              logDay.extra_testo || '',
      extra_kcal_stimate: logDay.extra_kcal || '',
      peso_kg:               logDay.peso_kg || '',
      bmi:                   logDay.bmi || '',
      bmr:                   logDay.bmr || '',
      grasso_pct:            logDay.grasso_pct || '',
      massa_grassa_kg:       logDay.massa_grassa_kg || '',
      muscolo_pct:           logDay.muscolo_pct || '',
      massa_muscolare_kg:    logDay.massa_muscolare_kg || '',
      acqua_pct:             logDay.acqua_pct || '',
      massa_proteica_kg:     logDay.massa_proteica_kg || '',
      grasso_viscerale:      logDay.grasso_viscerale || '',
      rapporto_vita_fianchi: logDay.rapporto_vita_fianchi || '',
      ...totali,
      energia: logDay.energia || '',
    };
    saveLogDay(dataScelta, payload);
    try {
      const res = await fetch(config.scriptUrl, { method: 'POST', body: JSON.stringify(payload) });
      const json = await res.json();
      if (json.ok) { setInvioOk(true); showToast(`${json.action === 'updated' ? 'Aggiornato' : 'Inviato'} ✓`, 'success'); }
      else showToast('Errore: ' + json.error, 'error');
    } catch { showToast('Salvato in locale (nessuna connessione)', 'info'); }
    setLoading(false);
  };

  const labelGiorno = dataScelta
    ? new Date(dataScelta + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const totali = piano && dataScelta ? calcolaTotali(logDay, piano) : null;

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div className="fw-bold mb-16" style={{ fontSize: 20 }}>Inserimento storico</div>

      <div className="card mb-16">
        <label className="label">Seleziona la data</label>
        <input type="date" className="input" value={dataScelta}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => setDataScelta(e.target.value)}
          style={{ colorScheme: 'dark' }} />
        {dataScelta && (
          <div className="text-secondary text-sm mt-8" style={{ textTransform: 'capitalize' }}>{labelGiorno}</div>
        )}
      </div>

      {!dataScelta && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
          Seleziona una data per iniziare
        </div>
      )}

      {dataScelta && (
        <>
          {totali && totali.totale_kcal > 0 && (
            <div className="card card--gradient mb-16">
              <div className="macro-row">
                <div className="macro-chip"><div className="macro-chip__label">Kcal tot.</div><div className="macro-chip__value" style={{ color: 'var(--accent-magenta)' }}>{totali.totale_kcal}</div></div>
                <div className="macro-chip"><div className="macro-chip__label">P</div><div className="macro-chip__value">{totali.totale_p}</div><div className="macro-chip__unit">g</div></div>
                <div className="macro-chip"><div className="macro-chip__label">C</div><div className="macro-chip__value">{totali.totale_c}</div><div className="macro-chip__unit">g</div></div>
                <div className="macro-chip"><div className="macro-chip__label">G</div><div className="macro-chip__value">{totali.totale_g}</div><div className="macro-chip__unit">g</div></div>
              </div>
            </div>
          )}

          {isLibero ? (
            <div className="card mb-16" style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ fontSize: 32 }}>🔓</div>
              <div className="fw-bold mt-8">{isWeekend ? 'Weekend — giorno libero' : 'Giorno libero'}</div>
              <div className="text-muted text-sm mt-8">Puoi registrare extra e dati bilancia.</div>
            </div>
          ) : (
            <>
              <div className="section-title">Pasti fissi</div>
              <PastoCard pasto={piano.pasti_fissi.colazione} statoKey="colazione" statoPasto={logDay.colazione} onChange={updatePasto} />
              <PastoCard pasto={piano.pasti_fissi.post_allenamento} statoKey="post_all" statoPasto={logDay.post_all} onChange={updatePasto} />
              {logDay.post_all?.stato === 'si' && (
                <div className="card mt-8" style={{ padding: '12px 16px' }}>
                  <div className="flex-between">
                    <span className="text-sm text-secondary">Con latte (150ml)?</span>
                    <div className="toggle-group" style={{ width: 'auto', gap: 8 }}>
                      <button className={`toggle-btn ${logDay.post_all_latte === true ? 'active--si' : ''}`} style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => updateLog('post_all_latte', true)}>Sì</button>
                      <button className={`toggle-btn ${logDay.post_all_latte === false ? 'active--no' : ''}`} style={{ padding: '6px 14px', fontSize: 13 }} onClick={() => updateLog('post_all_latte', false)}>No</button>
                    </div>
                  </div>
                </div>
              )}
              <div className="section-title mt-16">Pasti del giorno</div>
              {giornoData.spuntino_lavoro && <PastoCard pasto={giornoData.spuntino_lavoro} statoKey="spuntino" statoPasto={logDay.spuntino} onChange={updatePasto} />}
              {giornoData.cena && <PastoCard pasto={giornoData.cena} statoKey="cena" statoPasto={logDay.cena} onChange={updatePasto} />}
            </>
          )}

          <div className="section-title mt-24">Extra fuori piano</div>
          <div className="card">
            <label className="label">Cosa hai mangiato in più?</label>
            <textarea className="input" placeholder="Es: pizza 2 fette, birra..." value={logDay.extra_testo || ''} onChange={e => updateLog('extra_testo', e.target.value)} />
            <div className="mt-8">
              <label className="label">Kcal stimate (opzionale)</label>
              <input type="number" className="input" placeholder="Es: 500" value={logDay.extra_kcal || ''} onChange={e => updateLog('extra_kcal', e.target.value)} />
            </div>
          </div>

          <div className="section-title mt-24">Energia della giornata</div>
          <div className="card">
            <div className="energia-stars">
              {[1,2,3,4,5].map(n => (
                <button key={n} className={`energia-star ${(logDay.energia || 0) >= n ? 'active' : ''}`} onClick={() => updateLog('energia', n)}>★</button>
              ))}
              <span className="text-muted text-sm" style={{ alignSelf: 'center', marginLeft: 8 }}>
                {logDay.energia ? `${logDay.energia}/5` : 'Non indicato'}
              </span>
            </div>
          </div>

          <div className="section-title mt-24">Dati bilancia</div>
          <div className="card">
            <div className="text-muted text-sm mb-12">Apri la foto del report e inserisci i valori.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {CAMPI_BILANCIA.map(({ key, label, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type="number" step="0.1" className="input" placeholder={placeholder} value={logDay[key] || ''} onChange={e => updateLog(key, e.target.value)} />
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 32 }}>
            {invioOk && (
              <div style={{ textAlign: 'center', color: 'var(--success)', marginBottom: 12, fontSize: 14 }}>
                ✓ Già inviato — puoi reinviare per aggiornare
              </div>
            )}
            <button className="btn btn--primary btn--full" onClick={handleInvia} disabled={loading} style={{ fontSize: 17, padding: '15px 24px' }}>
              {loading ? <span className="spinner" /> : `${invioOk ? '🔄 Aggiorna' : '📤 Invia'} giornata del ${dataScelta}`}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
