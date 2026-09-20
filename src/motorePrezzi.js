// ─────────────────────────────────────────────────────────────────────────────
// PriceCore — Motore prezzi, metodo Swappie
//
// COME FUNZIONA (ricavato dall'API pubblica di Swappie, settembre 2026):
//
//   prezzo = base[modello][storage]       prezzo di ritiro, stato "come nuovo"
//          x tierEstetico                 1.00 / 0.93 / 0.86 / 0.76
//          - presaInCarico                una volta sola, se c'e' almeno 1 guasto
//          - somma costiRiparazione       EURO FISSI, non percentuali
//          x margine PriceCore
//          con pavimento = valore ricambi
//
// La differenza chiave col vecchio motore: i guasti NON sono percentuali.
// Uno schermo rotto costa 145 EUR di riparazione sia su un telefono da 200 EUR
// che su uno da 600. Con le percentuali si sottostimano i danni sui telefoni
// economici e si sovrastimano su quelli costosi. Swappie usa euro fissi perche'
// sono i suoi costi reali di riparazione.
//
// I numeri in COSTI_RIPARAZIONE sono tarati su Swappie: sostituiscili con i tuoi
// costi reali di laboratorio, e' li' che hai un vantaggio che loro non hanno.
// ─────────────────────────────────────────────────────────────────────────────

// Quanto PriceCore offre rispetto a Swappie. 0.95 = 5% sotto.
export const MARGINE = 0.95;

// Costo fisso di presa in carico, applicato una volta se serve almeno una
// riparazione (Swappie applica ~16-18 EUR: logistica + manodopera di base).
export const PRESA_IN_CARICO = 15;

// Pavimento: sotto questa soglia il telefono vale solo come ricambi.
// Swappie usa ~7,5% del prezzo "come nuovo".
export const PAVIMENTO_PCT = 0.075;
export const PAVIMENTO_MIN = 15;

// ── Prezzi di ritiro, stato "come nuovo" (fonte: API Swappie IT, set 2026) ────
// Da riverificare ogni 3-6 mesi: sono prezzi vivi, calano ~8-10% al trimestre.
export const BASE = {
  "iPhone 17 Pro Max": { 256: 1030, 512: 1142 },
  "iPhone 17 Pro":     { 256: 917,  512: 1035 },
  "iPhone 17":         { 256: 725,  512: 840 },
  "iPhone 16 Pro Max": { 256: 740,  512: 851 },
  "iPhone 16 Pro":     { 128: 655,  256: 700, 512: 800 },
  "iPhone 16 Plus":    { 128: 575,  256: 650, 512: 705 },
  "iPhone 16e":        { 128: 380,  256: 475, 512: 540 },
  "iPhone 16":         { 128: 550,  256: 644, 512: 680 },
  "iPhone 15 Pro Max": { 256: 600,  512: 655 },
  "iPhone 15 Pro":     { 128: 511,  256: 580, 512: 624 },
  "iPhone 15 Plus":    { 128: 411,  256: 497, 512: 510 },
  "iPhone 15":         { 128: 390,  256: 460, 512: 515 },
  "iPhone 14 Pro Max": { 128: 450,  256: 499, 512: 537 },
  "iPhone 14 Pro":     { 128: 412,  256: 433, 512: 497 },
  "iPhone 14 Plus":    { 128: 288,  256: 332, 512: 387 },
  "iPhone 14":         { 128: 242,  256: 294, 512: 344 },
  "iPhone 13 Pro Max": { 128: 329,  256: 369, 512: 394 },
  "iPhone 13 Pro":     { 128: 305,  256: 332, 512: 368 },
  "iPhone 13 Mini":    { 128: 176,  256: 192, 512: 318 },
  "iPhone 13":         { 128: 200,  256: 226, 512: 300 },
  "iPhone 12 Pro Max": { 128: 248,  256: 268, 512: 296 },
  "iPhone 12 Pro":     { 128: 197,  256: 219, 512: 252 },
  "iPhone 12 Mini":    { 64: 75,    128: 88,  256: 105 },
  "iPhone 12":         { 64: 114,   128: 135, 256: 143 },
  "iPhone 11 Pro Max": { 64: 160,   256: 197, 512: 226 },
  "iPhone 11 Pro":     { 64: 109,   256: 149, 512: 202 },
  "iPhone 11":         { 64: 87,    128: 111, 256: 142 },
  "iPhone SE 2022":    { 64: 84,    128: 137, 256: 177 },

  // Android: Swappie non li tratta. Questi vengono dalla vecchia tabella
  // PriceCore e NON sono verificati contro una fonte esterna. Da ricalibrare
  // su Back Market / Refurbed prima di fidarsene.
  "S24 Ultra":       { 256: 700, 512: 790 },
  "S24+":            { 256: 500, 512: 565 },
  "S24":             { 128: 420, 256: 475 },
  "S23 Ultra":       { 256: 520, 512: 585 },
  "S23+":            { 256: 380, 512: 430 },
  "S23":             { 128: 320, 256: 360 },
  "S22 Ultra":       { 128: 350, 256: 395 },
  "S22+":            { 128: 260, 256: 295 },
  "S22":             { 128: 220, 256: 250 },
  "Xiaomi 14 Ultra": { 256: 550, 512: 620 },
  "Xiaomi 14 Pro":   { 256: 400, 512: 450 },
  "Xiaomi 13 Pro":   { 256: 300, 512: 340 },
  "Pixel 8 Pro":     { 128: 450, 256: 505 },
  "Pixel 8":         { 128: 320, 256: 360 },
};

// Se il taglio esatto non e' in tabella, si scala da quello piu' vicino.
// Moltiplicatori medi ricavati da Swappie: +17% per 256GB, +34% per 512GB.
const SCALA_STORAGE = { 64: 0.88, 128: 1.0, 256: 1.17, 512: 1.34, 1024: 1.55 };

// ── Tier estetici (fonte: ladder Swappie LIKE_NEW -> MODERATE) ───────────────
export const TIER = {
  comeNuovo:   { k: 1.0,  label: "Come nuovo" },
  ottimo:      { k: 0.93, label: "Segni minimi di usura" },
  buono:       { k: 0.86, label: "Segni di usura evidenti" },
  accettabile: { k: 0.76, label: "Molto segnato" },
};

// ── Costi di riparazione in EURO (tarati su Swappie) ─────────────────────────
// SOSTITUISCILI CON I TUOI COSTI REALI DI LABORATORIO.
// Fascia: std = modelli base, plus = Plus/Max non-Pro, pro = Pro, proMax = Pro Max.
export const COSTI_RIPARAZIONE = {
  schermoRotto:     { std: 110, plus: 140, pro: 190, proMax: 230 },
  batteria:         { std: 35,  plus: 40,  pro: 45,  proMax: 50 },
  telaioPiegato:    { std: 100, plus: 115, pro: 130, proMax: 150 },
  nonSiAccende:     { std: 50,  plus: 55,  pro: 65,  proMax: 75 },
  fotocamera:       { std: 55,  plus: 60,  pro: 80,  proMax: 95 },
  connettore:       { std: 40,  plus: 45,  pro: 50,  proMax: 55 },
  altoparlante:     { std: 30,  plus: 35,  pro: 40,  proMax: 45 },
  faceId:           { std: 85,  plus: 90,  pro: 100, proMax: 110 },
  microfono:        { std: 30,  plus: 30,  pro: 35,  proMax: 35 },
  tasti:            { std: 30,  plus: 30,  pro: 35,  proMax: 35 },
  scoccaSostituita: { std: 45,  plus: 50,  pro: 60,  proMax: 70 },
  acqua:            { std: 60,  plus: 70,  pro: 90,  proMax: 110 },
};

// Schermo e batteria sono le due voci che pesano di piu' e variano molto tra
// modelli, quindi hanno un costo per modello ricavato dai dati Swappie.
// Se il modello non e' qui si usa COSTI_RIPARAZIONE per fascia.
// SONO I COSTI DI SWAPPIE: coi tuoi costi di laboratorio reali questi numeri
// scendono parecchio, e PriceCore puo' pagare i danneggiati piu' di Swappie.
export const COSTO_SCHERMO = {
  "iPhone 17 Pro Max": 353, "iPhone 17 Pro": 329, "iPhone 17": 317,
  "iPhone 16 Pro Max": 293, "iPhone 16 Pro": 259, "iPhone 16 Plus": 196,
  "iPhone 16e": 150, "iPhone 16": 120,
  "iPhone 15 Pro Max": 233, "iPhone 15 Pro": 242, "iPhone 15 Plus": 175,
  "iPhone 15": 144,
  "iPhone 14 Pro Max": 212, "iPhone 14 Pro": 184, "iPhone 14 Plus": 158,
  "iPhone 14": 100,
  "iPhone 13 Pro Max": 179, "iPhone 13 Pro": 142, "iPhone 13 Mini": 117,
  "iPhone 13": 93,
  "iPhone 12 Pro Max": 145, "iPhone 12 Pro": 81, "iPhone 12 Mini": 57,
  "iPhone 12": 64,
  "iPhone 11 Pro Max": 81, "iPhone 11 Pro": 76, "iPhone 11": 43,
  "iPhone SE 2022": 54,
};

export const COSTO_BATTERIA = {
  "iPhone 17 Pro Max": 133, "iPhone 17 Pro": 129, "iPhone 17": 97,
  "iPhone 16 Pro Max": 78, "iPhone 16 Pro": 74, "iPhone 16 Plus": 58,
  "iPhone 16e": 60, "iPhone 16": 57,
  "iPhone 15 Pro Max": 41, "iPhone 15 Pro": 40, "iPhone 15 Plus": 32,
  "iPhone 15": 26,
  "iPhone 14 Pro Max": 65, "iPhone 14 Pro": 36, "iPhone 14 Plus": 26,
  "iPhone 14": 18,
  "iPhone 13 Pro Max": 43, "iPhone 13 Pro": 29, "iPhone 13 Mini": 32,
  "iPhone 13": 21,
  "iPhone 12 Pro Max": 48, "iPhone 12 Pro": 24, "iPhone 12 Mini": 31,
  "iPhone 12": 22,
  "iPhone 11 Pro Max": 26, "iPhone 11 Pro": 24, "iPhone 11": 15,
  "iPhone SE 2022": 12,
};

function perModello(tabella, modello = "") {
  const k = Object.keys(tabella)
    .filter(x => modello.includes(x))
    .sort((a, b) => b.length - a.length)[0];
  return k ? tabella[k] : null;
}

function fascia(modello = "") {
  if (/Pro Max|Ultra/i.test(modello)) return "proMax";
  if (/Pro/i.test(modello)) return "pro";
  if (/Plus|Max|\+/i.test(modello)) return "plus";
  return "std";
}

function costo(voce, modello) {
  if (voce === "schermoRotto") {
    const c = perModello(COSTO_SCHERMO, modello);
    if (c != null) return c;
  }
  if (voce === "batteria") {
    const c = perModello(COSTO_BATTERIA, modello);
    if (c != null) return c;
  }
  const r = COSTI_RIPARAZIONE[voce];
  return r ? r[fascia(modello)] : 0;
}

function parseStorage(gb) {
  if (!gb) return 128;
  const s = String(gb).toUpperCase();
  if (s.includes("TB")) return 1024;
  const n = parseInt(String(gb).replace(/\D/g, ""), 10);
  return Number.isFinite(n) ? n : 128;
}

/**
 * Prezzo di ritiro per un dispositivo in stato "come nuovo".
 * Sostituisce baseGradoA().
 */
export function baseComeNuovo(modello, gb) {
  if (!modello) return 0;
  const storage = parseStorage(gb);
  const chiave = Object.keys(BASE)
    .filter(k => modello.includes(k))
    .sort((a, b) => b.length - a.length)[0];          // match piu' specifico
  if (!chiave) return 0;

  const tabella = BASE[chiave];
  if (tabella[storage]) return tabella[storage];

  // taglio non in tabella: scala da quello piu' vicino
  const tagli = Object.keys(tabella).map(Number);
  const vicino = tagli.reduce((a, b) =>
    Math.abs(b - storage) < Math.abs(a - storage) ? b : a);
  const k = (SCALA_STORAGE[storage] || 1) / (SCALA_STORAGE[vicino] || 1);
  return Math.round(tabella[vicino] * k);
}

/**
 * Calcolo del prezzo. Sostituisce calcolaValore().
 * Accetta lo stesso oggetto risposte e restituisce la stessa forma
 * { finale, deprezzamenti, grado, ratio }, cosi' il resto di App.jsx
 * (schermata risultato e PDF) non va toccato.
 */
export function calcolaValore(base, r = {}) {
  const modello = r.modello || "";
  const voci = [];
  let tier = "comeNuovo";
  const ORDINE = ["comeNuovo", "ottimo", "buono", "accettabile"];
  const peggiora = (t) => {
    if (ORDINE.indexOf(t) > ORDINE.indexOf(tier)) tier = t;
  };

  // Le risposte arrivano come etichette con emoji ("🟡 80–89%"). I confronti
  // vanno fatti in minuscolo e su parole distintive: cercare "No" o il trattino
  // "-" (le etichette usano l'en-dash "–") fallisce in silenzio e lascia il
  // prezzo invariato senza segnalare nulla.
  const q = (campo) => String(r[campo] || "").toLowerCase();

  // ── 1. Blocchi non riparabili: il telefono vale solo ricambi ──────────────
  const imeiKo = q("imei").includes("non appare");
  const netKo = q("internet").includes("non si collega");
  const mbKo = q("schedamadre").includes("riparazioni pregresse");
  if (imeiKo || netKo || mbKo) {
    const ricambi = Math.max(PAVIMENTO_MIN, Math.round(base * PAVIMENTO_PCT));
    const motivo = imeiKo ? "IMEI non leggibile"
      : netKo ? "Non si collega alla rete"
      : "Interventi sulla scheda madre";
    return {
      finale: ricambi,
      deprezzamenti: [`${motivo}: il dispositivo vale solo come ricambi`],
      grado: "D",
      ratio: base > 0 ? ricambi / base : 0,
    };
  }

  // ── 2. Stato estetico -> tier ─────────────────────────────────────────────
  // Confronti in minuscolo: le etichette delle domande cambiano nel tempo e un
  // confronto sensibile alle maiuscole fallisce in silenzio, lasciando il
  // prezzo invariato senza dare errore.
  const schermo = q("schermo");
  const scocca = q("scocca");
  if (schermo.includes("piccoli graffi")) peggiora("ottimo");
  if (scocca.includes("segni lievi")) peggiora("ottimo");
  if (scocca.includes("segni evidenti")) peggiora("buono");
  if (scocca.includes("molto danneggiata")) peggiora("accettabile");

  const k = TIER[tier].k;
  let prezzo = base * k;
  if (k < 1) {
    voci.push(`Stato estetico "${TIER[tier].label}": −€${Math.round(base - prezzo)}`);
  }

  // ── 3. Riparazioni: euro fissi ────────────────────────────────────────────
  const riparazioni = [];
  const add = (voce, etichetta) => {
    const c = costo(voce, modello);
    if (c > 0) riparazioni.push({ etichetta, costo: c });
  };
  const addMeta = (voce, etichetta) => {
    const c = Math.round(costo(voce, modello) / 2);
    if (c > 0) riparazioni.push({ etichetta, costo: c });
  };

  if (schermo.includes("crepe") || schermo.includes("rottur")) {
    add("schermoRotto", "Schermo crepato o rotto");
  } else if (schermo.includes("molto graffiat")) {
    // Swappie tratta il vetro molto graffiato come sostituzione piena del vetro.
    add("schermoRotto", "Vetro molto graffiato (da sostituire)");
  }

  // Sotto il 90% la batteria va sostituita. Verifichiamo la risposta buona
  // invece delle cattive, cosi' non dipendiamo dal formato degli intervalli.
  const batt = q("batt");
  if (batt && !batt.includes("90")) {
    add("batteria", "Batteria da sostituire (sotto 90%)");
  }

  if (scocca.includes("molto danneggiata")) {
    add("telaioPiegato", "Scocca piegata o molto danneggiata");
  }
  if (q("faceid").includes("non funziona")) add("faceId", "Face ID non funzionante");

  const alt = q("altoparlante");
  if (alt.includes("gracchia")) add("altoparlante", "Altoparlante gracchiante o rotto");
  else if (alt.includes("basso")) addMeta("altoparlante", "Altoparlante con volume basso");

  const conn = q("conn");
  if (conn.includes("non funziona")) add("connettore", "Connettore di ricarica non funzionante");
  else if (conn.includes("intermittenti")) addMeta("connettore", "Connettore intermittente");

  const danni = (r.danni || []).map(d => String(d).toLowerCase());
  if (danni.some(d => d.includes("acqua"))) add("acqua", "Contatto con liquidi");
  if (danni.some(d => d.includes("scocca sostituita"))) add("scoccaSostituita", "Scocca gia' sostituita");
  if (danni.some(d => d.includes("tasti"))) add("tasti", "Tasti laterali difettosi");
  if (danni.some(d => d.includes("microfono"))) add("microfono", "Microfono difettoso");
  if (danni.some(d => d.includes("fotocamera"))) add("fotocamera", "Fotocamera difettosa");

  if (riparazioni.length > 0) {
    prezzo -= PRESA_IN_CARICO;
    voci.push(`Presa in carico e test: −€${PRESA_IN_CARICO}`);
    for (const rip of riparazioni) {
      prezzo -= rip.costo;
      voci.push(`${rip.etichetta}: −€${rip.costo}`);
    }
  }

  // ── 4. Ricondizionato: meno garanzie sulla provenienza ────────────────────
  if (q("acq").includes("ricondizionato")) {
    const taglio = Math.round(prezzo * 0.08);
    prezzo -= taglio;
    voci.push(`Acquistato gia' ricondizionato: −€${taglio}`);
  }

  // ── 5. Margine PriceCore e pavimento ──────────────────────────────────────
  prezzo *= MARGINE;
  const pavimento = Math.max(PAVIMENTO_MIN, Math.round(base * PAVIMENTO_PCT));
  const finale = Math.max(pavimento, Math.round(prezzo));

  const ratio = base > 0 ? finale / base : 0;
  const grado = ratio >= 0.82 ? "A" : ratio >= 0.6 ? "B" : ratio >= 0.35 ? "C" : "D";

  return { finale, deprezzamenti: voci, grado, ratio };
}
