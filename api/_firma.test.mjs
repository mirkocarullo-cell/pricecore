// Test della firma delle richieste partner: node api/_firma.test.mjs
import assert from "assert";
import { canonico, firma, verifica, FINESTRA_SECONDI } from "./_firma.js";

const SEGRETO = "x".repeat(48);
process.env.PC_SECRET_REPAIRLAB = SEGRETO;

const payload = { azione: "valuta", risposte: { modello: "iPhone 13", gb: "128 GB", danni: ["acqua"] } };
const ora = Date.now();
const ts = Math.floor(ora / 1000);
const buona = firma(SEGRETO, ts, payload);

// L'ordine delle chiavi non deve cambiare la firma: dopo un giro di JSON
// le chiavi tornano in ordine diverso e la richiesta deve restare valida.
assert.equal(
  canonico({ b: 1, a: 2 }),
  canonico(JSON.parse(JSON.stringify({ a: 2, b: 1 }))),
  "la forma canonica deve ignorare l'ordine delle chiavi"
);

const ok = (extra = {}) =>
  verifica({ client: "repairlab", timestamp: ts, firmaRicevuta: buona, payload, ora, ...extra });

assert.equal(ok().ok, true, "una richiesta firmata bene deve passare");

// Corpo modificato dopo la firma
const manomesso = { ...payload, risposte: { ...payload.risposte, modello: "iPhone 15 Pro Max" } };
assert.equal(ok({ payload: manomesso }).ok, false, "il corpo manomesso deve essere rifiutato");

// Replay fuori finestra
assert.equal(
  verifica({ client: "repairlab", timestamp: ts - FINESTRA_SECONDI - 1, firmaRicevuta: firma(SEGRETO, ts - FINESTRA_SECONDI - 1, payload), payload, ora }).ok,
  false,
  "una richiesta vecchia deve scadere"
);

// Firma di un altro segreto
assert.equal(ok({ firmaRicevuta: firma("y".repeat(48), ts, payload) }).ok, false, "segreto sbagliato");

// Client sconosciuto e firma malformata
assert.equal(ok({ client: "altro" }).ok, false, "client sconosciuto");
assert.equal(ok({ firmaRicevuta: "corta" }).ok, false, "firma malformata");
assert.equal(ok({ firmaRicevuta: undefined }).ok, false, "firma mancante");

// Segreto troppo corto in configurazione: meglio rifiutare tutto
process.env.PC_SECRET_REPAIRLAB = "corto";
assert.equal(ok().ok, false, "segreto troppo corto");
process.env.PC_SECRET_REPAIRLAB = SEGRETO;

console.log("firma: tutti i test passati");
