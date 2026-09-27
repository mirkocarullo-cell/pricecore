// Riscrive le tabelle prezzi di src/motorePrezzi.js a partire dalla fotografia
// in dati/swappie.json (prodotta da scripts/estrai-swappie.js).
//
//   node scripts/aggiorna-prezzi.mjs
//
// Tocca solo le tabelle degli iPhone e la data: i modelli Android, i costi per
// fascia e la logica di calcolo restano come sono.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const radice = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE_DATI = path.join(radice, "dati", "swappie.json");
const FILE_MOTORE = path.join(radice, "src", "motorePrezzi.js");

if (!fs.existsSync(FILE_DATI)) {
  console.error(`Manca ${path.relative(radice, FILE_DATI)}.`);
  console.error("Generalo con scripts/estrai-swappie.js dalla console del browser su swappie.com.");
  process.exit(1);
}

const dati = JSON.parse(fs.readFileSync(FILE_DATI, "utf8"));
const nomi = Object.keys(dati.modelli);
if (!nomi.length) { console.error("Nessun modello nel file dati."); process.exit(1); }

const larghezza = Math.max(...nomi.map(n => n.length)) + 4;
const etichetta = (n) => `  ${(JSON.stringify(n) + ":").padEnd(larghezza)}`;

// Le righe Android nella tabella BASE vanno conservate: Swappie non le copre.
const sorgente = fs.readFileSync(FILE_MOTORE, "utf8");
const iAndroid = sorgente.indexOf("  // Android:");
if (iAndroid < 0) { console.error("Non trovo il blocco Android in BASE."); process.exit(1); }
const android = sorgente.slice(iAndroid, sorgente.indexOf("\n};", iAndroid));

let base = "export const BASE = {\n";
let schermo = "export const COSTO_SCHERMO = {\n";
let batteria = "export const COSTO_BATTERIA = {\n";
let tier = "export const TIER_MODELLO = {\n";

for (const n of nomi) {
  const m = dati.modelli[n];
  const tagli = Object.keys(m.base).map(Number).sort((a, b) => a - b);
  base += `${etichetta(n)}{ ${tagli.map(g => `${g}: ${m.base[g]}`).join(", ")} },\n`;
  if (m.schermo != null) schermo += `${etichetta(n)}${m.schermo},\n`;
  if (m.batteria != null) batteria += `${etichetta(n)}${m.batteria},\n`;
  if (m.tier && m.tier[0] != null) tier += `${etichetta(n)}[${m.tier.join(", ")}],\n`;
}
base += "\n" + android + "\n};";
schermo += "};";
batteria += "};";
tier += "};";

function sostituisci(testo, nome, nuovo) {
  const i = testo.indexOf(`export const ${nome} = {`);
  if (i < 0) throw new Error(`non trovo la tabella ${nome}`);
  const j = testo.indexOf("\n};", i);
  if (j < 0) throw new Error(`non trovo la fine di ${nome}`);
  return testo.slice(0, i) + nuovo + testo.slice(j + 3);
}

let out = sorgente;
out = sostituisci(out, "BASE", base);
out = sostituisci(out, "COSTO_SCHERMO", schermo);
out = sostituisci(out, "COSTO_BATTERIA", batteria);
out = sostituisci(out, "TIER_MODELLO", tier);

const rigaData = `export const DATA_TABELLA = "${dati.data}";`;
if (/export const DATA_TABELLA = "[^"]*";/.test(out)) {
  out = out.replace(/export const DATA_TABELLA = "[^"]*";/, rigaData);
} else {
  throw new Error("non trovo DATA_TABELLA in motorePrezzi.js");
}

fs.writeFileSync(FILE_MOTORE, out);
console.log(`Aggiornati ${nomi.length} modelli, fotografia del ${dati.data}.`);
console.log("Ora lancia: node src/motorePrezzi.test.mjs");
