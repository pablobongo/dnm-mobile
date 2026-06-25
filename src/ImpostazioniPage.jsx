// ImpostazioniPage.jsx
import { useState, useEffect } from 'react';
import { getConfig, saveConfig, getPiani, savePiani, getPianoAttivo, addPiano, setPianoAttivo } from './store';
import pianoDefault from './data/piano_alimentare.json';

export default function ImpostazioniPage({ showToast }) {
  const [config, setConfig]   = useState({});
  const [piani, setPiani]     = useState([]);
  const [pianoAttivo, setPianoAttivoState] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  useEffect(() => {
    setConfig(getConfig());
    setPiani(getPiani());
    setPianoAttivoState(getPianoAttivo());
  }, []);

  // Salva config
  const handleSalvaConfig = () => {
    saveConfig(config);
    showToast('Impostazioni salvate ✓', 'success');
  };

  // Carica piano default (JSON già nel progetto)
  const handleCaricaPianoDefault = () => {
    const nuovo = addPiano({ ...pianoDefault });
    setPiani(getPiani());
    setPianoAttivoState(nuovo);
    showToast('Piano alimentare caricato ✓', 'success');
  };

  // Attiva un piano dallo storico
  const handleAttivaStorico = (nomeId) => {
    const pList = getPiani();
    pList.forEach(p => { p.meta.attivo = false; });
    const idx = pList.findIndex(p => p.meta.nome === nomeId);
    if (idx !== -1) {
      pList[idx].meta.attivo = true;
      savePiani(pList);
      setPianoAttivo(nomeId);
      setPiani([...pList]);
      setPianoAttivoState(pList[idx]);
      showToast(`Piano "${nomeId}" attivato`, 'success');
    }
  };

  // Import nuovo PDF tramite API Anthropic
  const handleImportPdf = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!config.anthropicKey) {
      showToast('Inserisci prima la chiave API Anthropic', 'error');
      return;
    }

    setLoadingPdf(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.anthropicKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-opus-4-5',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 }
              },
              {
                type: 'text',
                text: `Analizza questo piano alimentare e convertilo nel seguente formato JSON.
Rispondi SOLO con il JSON, niente altro testo o markdown.
Il formato deve essere esattamente questo schema:
{
  "meta": {
    "versione": "1.0",
    "nome": "Nome del piano (es: Piano Luglio 2025)",
    "data_inizio": null,
    "data_fine": null,
    "attivo": false,
    "note": "note generali del piano"
  },
  "pasti_fissi": {
    "colazione": {
      "id": "colazione",
      "nome": "Colazione",
      "orario": "orario",
      "alimenti": [{"nome": "...", "quantita": numero_o_null, "unita": "g/ml/ecc", "note": ""}],
      "macro": {"kcal": numero, "proteine_g": numero, "carboidrati_g": numero, "grassi_g": numero}
    },
    "post_allenamento": {
      "id": "post_allenamento",
      "nome": "Post-Allenamento",
      "orario": "orario",
      "alimenti": [...],
      "macro": {
        "con_latte": {"kcal": numero, "proteine_g": numero, "carboidrati_g": numero, "grassi_g": numero},
        "senza_latte": {"kcal": numero, "proteine_g": numero, "carboidrati_g": numero, "grassi_g": numero}
      },
      "note": "..."
    }
  },
  "giorni": {
    "lunedi": { "tipo": "allenamento|riposo|libero", "spuntino_lavoro": {...}, "cena": {...} },
    "martedi": { ... },
    "mercoledi": { ... },
    "giovedi": { ... },
    "venerdi": { ... },
    "sabato": { "tipo": "libero", "note": "Giorno libero. Nessun pasto fisso." },
    "domenica": { "tipo": "libero", "note": "Giorno libero. Nessun pasto fisso." }
  },
  "note_generali": ["..."],
  "totali_giornalieri": {
    "giorno_allenamento": {"kcal": "...", "proteine_g": "...", "carboidrati_g": "...", "grassi_g": numero},
    "giorno_riposo": {"kcal": numero, "proteine_g": numero, "carboidrati_g": numero, "grassi_g": numero}
  }
}`
              }
            ]
          }]
        })
      });

      const data = await response.json();
      const testo = data.content?.[0]?.text || '';
      const match = testo.match(/\{[\s\S]*\}/);
      if (!match) throw new Error('Risposta non valida dal modello');

      const nuovoPiano = JSON.parse(match[0]);

      // Chiedi nome piano
      const nome = prompt(`Nome per questo piano (es: Piano Luglio 2025):`);
      if (!nome) { setLoadingPdf(false); return; }
      nuovoPiano.meta.nome = nome;

      const azione = window.confirm(
        `Vuoi attivare subito "${nome}" come piano attivo?\nOK = attiva subito | Annulla = aggiungi allo storico senza attivare`
      );

      if (azione) {
        addPiano(nuovoPiano);
      } else {
        const pList = getPiani();
        nuovoPiano.meta.attivo = false;
        pList.push(nuovoPiano);
        savePiani(pList);
      }

      setPiani(getPiani());
      setPianoAttivoState(getPianoAttivo());
      showToast(`Piano "${nome}" importato ✓`, 'success');

    } catch (err) {
      showToast('Errore import PDF: ' + err.message, 'error');
    }

    setLoadingPdf(false);
    e.target.value = '';
  };

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div className="fw-bold mb-16" style={{ fontSize: 20 }}>Impostazioni</div>

      {/* CONFIG */}
      <div className="section-title">Connessione</div>
      <div className="card mb-16">
        <div>
          <label className="label">URL Google Apps Script</label>
          <input
            type="url"
            className="input"
            placeholder="https://script.google.com/macros/s/..."
            value={config.scriptUrl || ''}
            onChange={e => setConfig(c => ({ ...c, scriptUrl: e.target.value }))}
          />
          <div className="text-muted text-xs mt-8">
            Trovi questo URL dopo aver pubblicato lo script Apps Script come Web App.
          </div>
        </div>
        <button className="btn btn--primary btn--full mt-16" onClick={handleSalvaConfig}>
          Salva impostazioni
        </button>
      </div>

      {/* PIANO ATTIVO */}
      <div className="section-title">Piano alimentare attivo</div>
      <div className="card mb-16">
        {pianoAttivo ? (
          <>
            <div className="flex-between">
              <div>
                <div className="fw-bold">{pianoAttivo.meta.nome}</div>
                <div className="text-muted text-sm">Dal {pianoAttivo.meta.data_inizio}</div>
              </div>
              <span className="badge badge--fatto">Attivo</span>
            </div>
          </>
        ) : (
          <div className="text-muted text-sm">Nessun piano attivo.</div>
        )}

        <div className="divider" />

        <button
          className="btn btn--ghost btn--full btn--sm"
          onClick={handleCaricaPianoDefault}
        >
          📥 Carica piano alimentare iniziale (giugno 2025)
        </button>
      </div>

      {/* IMPORT NUOVO PDF */}
      <div className="section-title">Importa nuovo piano da PDF</div>
      <div className="card mb-16">
        <div className="text-muted text-sm mb-12">
          Carica un PDF con il nuovo piano alimentare. Verrà letto automaticamente e potrai scegliere se attivarlo subito o aggiungerlo allo storico.
        </div>
        <label className={`btn btn--secondary btn--full ${loadingPdf ? 'btn--disabled' : ''}`}>
          {loadingPdf ? <><span className="spinner" />&nbsp;Analisi in corso...</> : '📄 Carica PDF piano'}
          <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={handleImportPdf} disabled={loadingPdf} />
        </label>
      </div>

      {/* STORICO PIANI */}
      {piani.length > 0 && (
        <>
          <div className="section-title">Storico piani</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {piani.map((p, i) => (
              <div key={i} className="card" style={{ padding: '12px 16px' }}>
                <div className="flex-between">
                  <div>
                    <div className="fw-bold text-sm">{p.meta.nome}</div>
                    <div className="text-muted text-xs">
                      {p.meta.data_inizio} → {p.meta.data_fine || 'in corso'}
                    </div>
                  </div>
                  {p.meta.attivo
                    ? <span className="badge badge--fatto">Attivo</span>
                    : <button className="btn btn--ghost btn--sm" onClick={() => handleAttivaStorico(p.meta.nome)}>Attiva</button>
                  }
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
