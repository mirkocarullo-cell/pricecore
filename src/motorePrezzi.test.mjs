// Verifica del motore prezzi contro i valori reali di Swappie.
// Uso:  node src/motorePrezzi.test.mjs
//
// I valori "swappie" sono rilevati il 2026-09-20 dall'API pubblica
// /api/sell/api/v3/prices/ e dal wizard di vendita. Vanno riaggiornati
// quando si ricalibra la tabella BASE.

import { baseComeNuovo, calcolaValore, MARGINE, MODELLI } from "./motorePrezzi.js";

// Etichette copiate alla lettera dalle domande di App.jsx: il motore fa match
// su queste stringhe, quindi il test deve usare esattamente le stesse.
// Attenzione agli en-dash negli intervalli di batteria ("90–100%", non "90-100%").
const PERFETTO = {
  imei: "✅ Sì, mostra l'IMEI",
  internet: "✅ Sì, si collega senza problemi",
  schedamadre: "✅ No, mai aperto",
  faceid: "✅ Sì, funziona correttamente",
  batt: "🟢 90–100%",
  schermo: "✅ Perfetto, come nuovo",
  scocca: "✅ Nessun danno (come nuova)",
  altoparlante: "✅ Si sente benissimo!",
  conn: "✅ Funziona perfettamente",
  danni: ["✅ Nessun altro danno"],
  acq: "✅ Nuovo",
};

const BATT_85 = "🟡 80–89%";
const BATT_75 = "🟠 70–79%";
const GRAFFI = "🔍 Piccoli graffi visibili";
const GRAFFIATO = "🔦 Vetro molto graffiato";
const CREPATO = "💥 Crepe o rotture evidenti";
const SCOCCA_LIEVI = "🔍 Scocca con segni lievi";

const casi = [
  {
    nome: "iPhone 15 256GB — perfetto, batteria 90-100%",
    modello: "iPhone 15", gb: "256 GB", r: {},
    swappie: 460, nota: "LIKE_NEW da API",
  },
  {
    nome: "iPhone 15 256GB — batteria 85%, resto perfetto",
    modello: "iPhone 15", gb: "256 GB",
    r: { batt: BATT_85 },
    swappie: 416.08, nota: "verificato nel wizard",
  },
  {
    nome: "iPhone 15 256GB — batt 85% + graffi lievi + scocca segni lievi",
    modello: "iPhone 15", gb: "256 GB",
    r: { batt: BATT_85, schermo: GRAFFI, scocca: SCOCCA_LIEVI },
    swappie: 380.08, nota: "460 -36 estetica -17,92 -26 batteria",
  },
  {
    nome: "iPhone 15 256GB — batt 85% + vetro molto graffiato + scocca lievi",
    modello: "iPhone 15", gb: "256 GB",
    r: { batt: BATT_85, schermo: GRAFFIATO, scocca: SCOCCA_LIEVI },
    swappie: 237.08, nota: "IL BENCHMARK, verificato nel wizard",
  },
  {
    nome: "iPhone 15 256GB — schermo crepato",
    modello: "iPhone 15", gb: "256 GB",
    r: { schermo: CREPATO, scocca: SCOCCA_LIEVI },
    swappie: 261.08, nota: "ALMOST_NEW + BROKEN_SCREEN da API",
  },
  {
    nome: "iPhone 13 256GB — batteria 85%, scocca segni lievi",
    modello: "iPhone 13", gb: "256 GB",
    r: { batt: BATT_85, scocca: SCOCCA_LIEVI },
    swappie: 165.3, nota: "ALMOST_NEW + BATTERY_ISSUE da API",
  },
  {
    nome: "iPhone 16 128GB — perfetto",
    modello: "iPhone 16", gb: "128 GB", r: {},
    swappie: 550, nota: "LIKE_NEW da API",
  },
  {
    nome: "iPhone 15 Pro 256GB — schermo crepato, scocca segni lievi",
    modello: "iPhone 15 Pro", gb: "256 GB",
    r: { schermo: CREPATO, scocca: SCOCCA_LIEVI },
    swappie: 283.63, nota: "ALMOST_NEW + BROKEN_SCREEN da API",
  },
  {
    nome: "iPhone 14 128GB — IMEI non leggibile (solo ricambi)",
    modello: "iPhone 14", gb: "128 GB",
    r: { imei: "❌ No, non appare nulla" },
    swappie: 20, nota: "limit_price da API",
  },

  // Scenario identico su tutta la gamma: scocca con segni lievi + batteria da
  // sostituire. Serve a verificare che il metodo regga sia sui top di gamma
  // che sui modelli vecchi, dove l'usura estetica pesa molto di piu'.
  // Riferimento Swappie: ALMOST_NEW + BATTERY_ISSUE.
  ...[
    ["iPhone 17 Pro Max", "256 GB", 836.31],
    ["iPhone Air", "256 GB", 459.26],
    ["iPhone 16", "128 GB", 446.69],
    ["iPhone 16e", "128 GB", 280.53],
    ["iPhone 14 Pro", "256 GB", 337.53],
    ["iPhone 13 Mini", "128 GB", 105.52],
    ["iPhone 12", "128 GB", 78.73],
    ["iPhone 11", "64 GB", 38.26],
    ["iPhone SE 2022", "128 GB", 67.28],
    ["iPhone SE 2020", "128 GB", 18.81],
  ].map(([modello, gb, swappie]) => ({
    nome: `${modello} ${gb.replace(" ", "")} — usura lieve + batteria`,
    modello, gb,
    r: { batt: BATT_85, scocca: SCOCCA_LIEVI },
    swappie, nota: "ALMOST_NEW + BATTERY_ISSUE da API",
  })),
];

console.log(`\nMotore prezzi PriceCore — margine ${Math.round((1 - MARGINE) * 100)}% sotto Swappie\n`);
console.log(
  "caso".padEnd(62) + "base".padStart(6) + "PriceCore".padStart(11) +
  "Swappie".padStart(10) + "delta".padStart(9) + "  grado"
);
console.log("-".repeat(106));

let fuoriRange = 0;
for (const c of casi) {
  const base = baseComeNuovo(c.modello, c.gb);
  const risposte = { ...PERFETTO, ...c.r, modello: c.modello };
  const out = calcolaValore(base, risposte);
  const delta = c.swappie ? ((out.finale - c.swappie) / c.swappie) * 100 : 0;
  // Vogliamo stare fra il 15% e lo 0% sotto Swappie. Sui telefoni vecchi e
  // poco costosi la percentuale e' rumorosa (su un iPhone 11 da 40 EUR bastano
  // 2 EUR per sforare il 5%), quindi passa anche chi resta entro 5 EUR.
  const scartoEuro = Math.abs(out.finale - c.swappie);
  const ok = (delta <= 0.5 && delta >= -15) || scartoEuro <= 5;
  if (!ok) fuoriRange++;
  console.log(
    c.nome.slice(0, 61).padEnd(62) +
    String(base).padStart(6) +
    ("€" + out.finale).padStart(11) +
    ("€" + c.swappie).padStart(10) +
    ((delta >= 0 ? "+" : "") + delta.toFixed(1) + "%").padStart(9) +
    "  " + out.grado + (ok ? "   ok" : "   FUORI RANGE")
  );
}

console.log("-".repeat(106));

// Controllo di sanita': ogni risposta peggiorativa deve abbassare il prezzo.
// Serve a intercettare i match di stringa che falliscono in silenzio (e' cosi'
// che "Molto graffiato" non funzionava: l'etichetta ha la m minuscola).
const b15 = baseComeNuovo("iPhone 15", "256 GB");
const rif = calcolaValore(b15, { ...PERFETTO, modello: "iPhone 15" }).finale;
const peggioramenti = [
  ["batteria 80-89%", { batt: BATT_85 }],
  ["batteria 70-79%", { batt: BATT_75 }],
  ["graffi lievi", { schermo: GRAFFI }],
  ["vetro molto graffiato", { schermo: GRAFFIATO }],
  ["schermo crepato", { schermo: CREPATO }],
  ["scocca segni lievi", { scocca: SCOCCA_LIEVI }],
  ["scocca segni evidenti", { scocca: "⚠️ Scocca con segni evidenti" }],
  ["scocca piegata", { scocca: "💥 Scocca molto danneggiata o piegata" }],
  ["altoparlante basso", { altoparlante: "🔉 Si sente basso ma funziona" }],
  ["altoparlante rotto", { altoparlante: "❌ Gracchia o non funzionante" }],
  ["connettore intermittente", { conn: "⚠️ Problemi intermittenti" }],
  ["connettore rotto", { conn: "❌ Non funziona" }],
  ["face id rotto", { faceid: "❌ No, non funziona" }],
  ["scheda madre aperta", { schedamadre: "⚠️ Sì, riparazioni pregresse" }],
  ["internet ko", { internet: "❌ No, non si collega" }],
  ["acqua", { danni: ["💧 Contatto con acqua"] }],
  ["scocca sostituita", { danni: ["🔧 Scocca sostituita"] }],
  ["tasti", { danni: ["🔘 Tasti laterali difettosi"] }],
  ["microfono", { danni: ["🎙️ Microfono difettoso"] }],
  ["fotocamera", { danni: ["📷 Fotocamera difettosa"] }],
  ["ricondizionato", { acq: "🔄 Ricondizionato" }],
];

let muti = 0;
for (const [nome, patch] of peggioramenti) {
  const v = calcolaValore(b15, { ...PERFETTO, modello: "iPhone 15", ...patch }).finale;
  if (v >= rif) {
    muti++;
    console.log(`  IGNORATO: "${nome}" non cambia il prezzo (€${v}, riferimento €${rif})`);
  }
}
console.log(
  muti === 0
    ? `Tutte le ${peggioramenti.length} risposte peggiorative abbassano il prezzo.`
    : `${muti} risposte peggiorative non hanno effetto: match di stringa da correggere.`
);

console.log(
  fuoriRange === 0
    ? "Tutti i casi entro il range [-15%, 0%] rispetto a Swappie."
    : `${fuoriRange} caso/i fuori dal range [-15%, 0%] rispetto a Swappie.`
);

// Copertura: ogni voce del menu deve trovare un prezzo in tabella, per ogni
// taglio offerto dall'app. Intercetta i modelli aggiunti al menu e dimenticati
// in BASE, e le differenze di grafia tra le due liste ("mini" vs "Mini").
const TAGLI = ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"];
const scoperti = [];
for (const m of MODELLI) {
  if (m === "Altro") continue;              // fallback voluto sul valore AI
  for (const gb of TAGLI) {
    const b = baseComeNuovo(m, gb);
    if (!(b > 0)) scoperti.push(`${m} ${gb}`);
  }
}
// Un prezzo per il 256GB deve sempre salire rispetto al 128GB
const incoerenti = [];
for (const m of MODELLI) {
  if (m === "Altro") continue;
  const b128 = baseComeNuovo(m, "128 GB");
  const b256 = baseComeNuovo(m, "256 GB");
  if (b128 > 0 && b256 > 0 && b256 < b128) incoerenti.push(`${m}: 128GB €${b128} > 256GB €${b256}`);
}

if (scoperti.length) {
  console.log(`${scoperti.length} combinazioni modello/taglio senza prezzo:`);
  for (const s of scoperti.slice(0, 10)) console.log("  " + s);
} else {
  console.log(`Tutti i ${MODELLI.length - 1} modelli del menu hanno un prezzo su tutti i tagli.`);
}
for (const i of incoerenti) console.log(`  ATTENZIONE prezzo non monotono — ${i}`);
console.log("");

// Dettaglio del benchmark storico
const bench = calcolaValore(b15, {
  ...PERFETTO, modello: "iPhone 15",
  batt: BATT_85, schermo: GRAFFIATO, scocca: SCOCCA_LIEVI,
});
console.log("Dettaglio benchmark (iPhone 15 256GB, batt 85%, vetro molto graffiato, scocca segni lievi):");
console.log(`  base come nuovo: €${b15}`);
for (const v of bench.deprezzamenti) console.log("  " + v);
console.log(`  margine PriceCore ${Math.round((1 - MARGINE) * 100)}%`);
console.log(`  FINALE: €${bench.finale}  (grado ${bench.grado})  —  Swappie: €237,08\n`);
