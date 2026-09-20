// Motore prezzi PriceCore come servizio per i partner (oggi RepairLab Cloud).
//
// Nessuna chiamata all'AI: gira solo il motore deterministico di
// src/motorePrezzi.js, quindi una valutazione non costa nulla.
// Accesso solo server-to-server con richiesta firmata (api/_firma.js):
// niente CORS, niente chiavi nel browser.
import { sql } from "@vercel/postgres";
import { baseComeNuovo, calcolaValore, MODELLI } from "../src/motorePrezzi.js";
import { verifica } from "./_firma.js";

function corpo(req) {
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body && typeof req.body === "object" ? req.body : null;
}

// Traccia la valutazione nella stessa tabella della dashboard, con la
// colonna origine per distinguere il sito dai laboratori. Se il database
// non risponde la valutazione esce lo stesso: non e' un dato critico.
async function traccia(client, r, calc) {
  try {
    await sql`ALTER TABLE valutazioni ADD COLUMN IF NOT EXISTS origine TEXT`;
    await sql`INSERT INTO valutazioni
      (modello, storage, batteria, schermo, connettore, danni, acquisto, grado, valore_tuo, valore_tuo_num, origine)
      VALUES (${r.modello ?? null}, ${r.gb ?? null}, ${r.batt ?? null}, ${r.schermo ?? null},
              ${r.conn ?? null}, ${(r.danni || []).join(", ")}, ${r.acq ?? null},
              ${calc.grado}, ${`€${calc.finale}`}, ${calc.finale}, ${client})`;
  } catch (e) {
    console.error("valuta-motore: tracciamento non riuscito", e.message);
  }
}

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Metodo non consentito" });
  }

  const payload = corpo(req);
  if (!payload) return res.status(400).json({ error: "Corpo della richiesta non valido" });

  const esito = verifica({
    client: req.headers["x-pc-client"],
    timestamp: req.headers["x-pc-timestamp"],
    firmaRicevuta: req.headers["x-pc-firma"],
    payload,
  });
  if (!esito.ok) {
    // Al chiamante una risposta sola e generica; il dettaglio resta nei log.
    console.warn("valuta-motore: richiesta rifiutata —", esito.motivo);
    return res.status(401).json({ error: "Non autorizzato" });
  }

  // Elenco modelli: serve al partner per costruire la sua tendina senza
  // copiarsi il listino, cosi' resta allineato a ogni aggiornamento.
  if (payload.azione === "modelli") {
    return res.status(200).json({ modelli: MODELLI });
  }

  const r = payload.risposte;
  if (!r || typeof r !== "object") {
    return res.status(400).json({ error: "Risposte mancanti" });
  }

  // Solo modelli a listino: il motore cerca la chiave per sottostringa, quindi
  // un modello scritto a mano ("Samsung S23") pescherebbe il prezzo di un altro.
  // Il partner costruisce la sua tendina con l'azione "modelli", percio' qui
  // basta il confronto esatto.
  if (!MODELLI.includes(r.modello)) {
    return res.status(200).json({ riconosciuto: false, modello: r.modello ?? null });
  }

  const base = baseComeNuovo(r.modello, r.gb);
  if (!base) {
    return res.status(200).json({ riconosciuto: false, modello: r.modello });
  }

  const calc = calcolaValore(base, r);
  await traccia(esito.client, r, calc);

  return res.status(200).json({
    riconosciuto: true,
    base,
    finale: calc.finale,
    grado: calc.grado,
    ratio: calc.ratio,
    deprezzamenti: calc.deprezzamenti,
  });
}
