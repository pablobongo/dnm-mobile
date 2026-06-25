// BilanciaPage.jsx — inserimento manuale dati bilancia Xiaomi S400
import { useState } from 'react';

const CAMPI = [
  { key: 'peso_kg',           label: 'Peso (kg)',                  placeholder: '88.0' },
  { key: 'bmi',               label: 'BMI',                        placeholder: '24.0' },
  { key: 'bmr',               label: 'Metabolismo basale (kcal)',   placeholder: '1850' },
  { key: 'grasso_pct',        label: 'Grasso corporeo (%)',         placeholder: '22.0' },
  { key: 'massa_grassa_kg',   label: 'Massa grassa (kg)',           placeholder: '19.0' },
  { key: 'muscolo_pct',       label: 'Massa muscolare (%)',         placeholder: '38.0' },
  { key: 'massa_muscolare_kg',label: 'Massa muscolare (kg)',        placeholder: '33.0' },
  { key: 'acqua_pct',         label: 'Acqua corporea (%)',          placeholder: '55.0' },
  { key: 'massa_proteica_kg', label: 'Massa proteica (kg)',         placeholder: '12.0' },
  { key: 'grasso_viscerale',  label: 'Grasso viscerale (1-59)',     placeholder: '8' },
  { key: 'rapporto_vita_fianchi', label: 'Rapporto vita/fianchi',  placeholder: '0.85' },
];

export default function BilanciaPage({ onBack, onValoriConfermati, showToast }) {
  const [valori, setValori] = useState({});

  const handleCambia = (key, val) => setValori(prev => ({ ...prev, [key]: val }));

  const handleConferma = () => {
    if (!valori.peso_kg) {
      showToast('Inserisci almeno il peso', 'error');
      return;
    }
    onValoriConfermati(valori);
    showToast('Valori bilancia salvati ✓', 'success');
    onBack();
  };

  return (
    <div style={{ padding: '16px 16px 100px' }}>
      <div className="flex-between mb-16">
        <button className="btn btn--ghost btn--sm" onClick={onBack}>← Indietro</button>
        <span className="fw-bold" style={{ fontSize: 17 }}>Dati bilancia</span>
        <div style={{ width: 70 }} />
      </div>

      <div className="card">
        <div className="section-title">Inserisci i valori dal report Xiaomi</div>
        <div className="text-muted text-sm mb-16">
          Apri la foto del report e inserisci i valori manualmente.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {CAMPI.map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input
                type="number"
                step="0.1"
                className="input"
                placeholder={placeholder}
                value={valori[key] || ''}
                onChange={e => handleCambia(key, e.target.value)}
              />
            </div>
          ))}
        </div>
        <button
          className="btn btn--primary btn--full mt-16"
          onClick={handleConferma}
        >
          ✓ Salva nella giornata
        </button>
      </div>
    </div>
  );
}
