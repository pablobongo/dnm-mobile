// PastoCard.jsx — card singolo pasto
import { useState } from 'react';

export default function PastoCard({ pasto, statoKey, statoPasto, onChange }) {
  const [expanded, setExpanded] = useState(false);

  const stato = statoPasto?.stato || null; // 'si' | 'no' | 'mod'
  const note  = statoPasto?.note  || '';

  const handleStato = (val) => {
    onChange(statoKey, { ...statoPasto, stato: val });
  };

  const handleNote = (e) => {
    onChange(statoKey, { ...statoPasto, note: e.target.value });
  };

  const labelStato = stato === 'si' ? '✓ Fatto' : stato === 'no' ? '✗ Saltato' : stato === 'mod' ? '~ Modificato' : '—';
  const badgeClass = stato === 'si' ? 'badge--fatto' : stato === 'no' ? 'badge--saltato' : stato === 'mod' ? 'badge--modifica' : '';

  return (
    <div className={`card mt-12`} style={{ borderColor: stato === 'si' ? 'rgba(34,197,94,0.3)' : stato === 'no' ? 'rgba(239,68,68,0.3)' : stato === 'mod' ? 'rgba(245,158,11,0.3)' : undefined }}>
      {/* Header pasto */}
      <div className="flex-between" style={{ cursor: 'pointer' }} onClick={() => setExpanded(e => !e)}>
        <div>
          <div className="fw-bold" style={{ fontSize: 15 }}>{pasto.nome}</div>
          {pasto.orario && <div className="text-muted text-sm">{pasto.orario}</div>}
        </div>
        <div className="flex gap-8" style={{ alignItems: 'center' }}>
          {stato && <span className={`badge ${badgeClass}`}>{labelStato}</span>}
          <span style={{ color: 'var(--text-muted)', fontSize: 18 }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Macro summary sempre visibile */}
      {pasto.macro && !Array.isArray(pasto.macro) && (
        <div className="macro-row mt-8">
          <div className="macro-chip">
            <div className="macro-chip__label">Kcal</div>
            <div className="macro-chip__value">{pasto.macro.kcal || pasto.macro.con_latte?.kcal}</div>
          </div>
          <div className="macro-chip">
            <div className="macro-chip__label">P</div>
            <div className="macro-chip__value">{pasto.macro.proteine_g || pasto.macro.con_latte?.proteine_g}</div>
            <div className="macro-chip__unit">g</div>
          </div>
          <div className="macro-chip">
            <div className="macro-chip__label">C</div>
            <div className="macro-chip__value">{pasto.macro.carboidrati_g || pasto.macro.con_latte?.carboidrati_g}</div>
            <div className="macro-chip__unit">g</div>
          </div>
          <div className="macro-chip">
            <div className="macro-chip__label">G</div>
            <div className="macro-chip__value">{pasto.macro.grassi_g || pasto.macro.con_latte?.grassi_g}</div>
            <div className="macro-chip__unit">g</div>
          </div>
        </div>
      )}

      {/* Dettaglio espandibile */}
      {expanded && (
        <div className="mt-12">
          {/* Lista alimenti */}
          {pasto.alimenti && (
            <div style={{ marginBottom: 12 }}>
              <div className="section-title">Alimenti</div>
              {pasto.alimenti.map((a, i) => (
                <div key={i} className="flex-between" style={{ padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{a.nome}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                    {a.quantita !== null ? `${a.quantita} ${a.unita}` : a.unita}
                    {a.note ? ` · ${a.note}` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Note del piano */}
          {pasto.note && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontStyle: 'italic' }}>
              💡 {pasto.note}
            </div>
          )}

          <div className="divider" />

          {/* Toggle fatto/saltato/modificato */}
          <div className="section-title">Come è andata?</div>
          <div className="toggle-group">
            <button
              className={`toggle-btn ${stato === 'si' ? 'active--si' : ''}`}
              onClick={() => handleStato('si')}
            >✓ Fatto</button>
            <button
              className={`toggle-btn ${stato === 'no' ? 'active--no' : ''}`}
              onClick={() => handleStato('no')}
            >✗ Saltato</button>
            <button
              className={`toggle-btn ${stato === 'mod' ? 'active--mod' : ''}`}
              onClick={() => handleStato('mod')}
            >~ Modificato</button>
          </div>

          {/* Note variazione (visibili se modificato o saltato) */}
          {(stato === 'mod' || stato === 'no') && (
            <div className="mt-8">
              <label className="label">Note variazione</label>
              <textarea
                className="input"
                placeholder={stato === 'mod' ? 'Es: ho usato tacchino al posto del pollo' : 'Perché hai saltato?'}
                value={note}
                onChange={handleNote}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
