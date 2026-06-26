// ============================================================
// store.js — gestione dati localStorage per D.N.M. Mobile
// ============================================================

const KEYS = {
  CONFIG:     'dnm_config',
  PIANI:      'dnm_piani',
  PIANO_ATTIVO: 'dnm_piano_attivo',
  LOG:        'dnm_log',
};

// ------------------------------------------------------------
// CONFIG (impostazioni app: URL Apps Script, API key, ecc.)
// ------------------------------------------------------------
export function getConfig() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.CONFIG)) || {};
  } catch { return {}; }
}

export function saveConfig(config) {
  localStorage.setItem(KEYS.CONFIG, JSON.stringify(config));
}

// ------------------------------------------------------------
// PIANI ALIMENTARI (array di piani storici + attivo)
// ------------------------------------------------------------
export function getPiani() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.PIANI)) || [];
  } catch { return []; }
}

export function savePiani(piani) {
  localStorage.setItem(KEYS.PIANI, JSON.stringify(piani));
}

export function getPianoAttivo() {
  const id = localStorage.getItem(KEYS.PIANO_ATTIVO);
  if (!id) return null;
  const piani = getPiani();
  return piani.find(p => p.meta.nome === id) || null;
}

export function setPianoAttivo(nomeId) {
  localStorage.setItem(KEYS.PIANO_ATTIVO, nomeId);
}

export function addPiano(piano) {
  const piani = getPiani();
  // Chiudi il piano attivo se esiste
  const attivoIdx = piani.findIndex(p => p.meta.attivo);
  if (attivoIdx !== -1) {
    piani[attivoIdx].meta.attivo = false;
    piani[attivoIdx].meta.data_fine = new Date().toISOString().split('T')[0];
  }
  piano.meta.attivo = true;
  piano.meta.data_inizio = piano.meta.data_inizio || new Date().toISOString().split('T')[0];
  piano.meta.data_fine = null;
  piani.push(piano);
  savePiani(piani);
  setPianoAttivo(piano.meta.nome);
  return piano;
}

export function updatePiano(nomeId, updatedPiano) {
  const piani = getPiani();
  const idx = piani.findIndex(p => p.meta.nome === nomeId);
  if (idx !== -1) {
    piani[idx] = updatedPiano;
    savePiani(piani);
  }
}

// ------------------------------------------------------------
// LOG GIORNALIERO
// ------------------------------------------------------------
export function getLog() {
  try {
    return JSON.parse(localStorage.getItem(KEYS.LOG)) || {};
  } catch { return {}; }
}

export function getLogByDate(date) {
  const log = getLog();
  return log[date] || null;
}

export function saveLogDay(date, data) {
  const log = getLog();
  log[date] = { ...data, data };
  localStorage.setItem(KEYS.LOG, JSON.stringify(log));
}

export function getLogDates() {
  return Object.keys(getLog()).sort();
}

// Versione app
export const APP_VERSION = '1.0.0';

// ------------------------------------------------------------
// UTILITY: data odierna YYYY-MM-DD in ora locale (non UTC)
// ------------------------------------------------------------
export function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

// ------------------------------------------------------------
// UTILITY: giorno della settimana in italiano (minuscolo)
// per matchare le chiavi del JSON piano
// ------------------------------------------------------------
export function getDayKey(dateStr) {
  const days = ['domenica','lunedi','martedi','mercoledi','giovedi','venerdi','sabato'];
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  return days[d.getDay()];
}

// ------------------------------------------------------------
// UTILITY: calcola macro totali di un log giornaliero
// ------------------------------------------------------------
export function calcolaTotali(logDay, piano) {
  let kcal = 0, p = 0, c = 0, g = 0;

  const aggiungi = (macro) => {
    if (!macro) return;
    kcal += Number(macro.kcal) || 0;
    p    += Number(macro.proteine_g || macro.p) || 0;
    c    += Number(macro.carboidrati_g || macro.c) || 0;
    g    += Number(macro.grassi_g || macro.g) || 0;
  };

  if (logDay.colazione_fatta === 'si' && piano?.pasti_fissi?.colazione?.macro) {
    aggiungi(piano.pasti_fissi.colazione.macro);
  }
  if (logDay.post_all_fatto === 'si' && piano?.pasti_fissi?.post_allenamento?.macro) {
    const macro = logDay.post_all_con_latte === 'si'
      ? piano.pasti_fissi.post_allenamento.macro.con_latte
      : piano.pasti_fissi.post_allenamento.macro.senza_latte;
    aggiungi(macro);
  }
  if (logDay.spuntino_fatto === 'si') {
    aggiungi({ kcal: logDay.spuntino_kcal, p: logDay.spuntino_p, c: logDay.spuntino_c, g: logDay.spuntino_g });
  }
  if (logDay.cena_fatta === 'si') {
    aggiungi({ kcal: logDay.cena_kcal, p: logDay.cena_p, c: logDay.cena_c, g: logDay.cena_g });
  }
  if (logDay.extra_kcal_stimate) {
    kcal += Number(logDay.extra_kcal_stimate) || 0;
  }

  return {
    totale_kcal: Math.round(kcal),
    totale_p: Math.round(p),
    totale_c: Math.round(c),
    totale_g: Math.round(g),
  };
}
