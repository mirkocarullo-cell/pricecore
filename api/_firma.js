// Firma HMAC delle richieste dei partner che usano il motore prezzi
// (oggi solo RepairLab Cloud). Il segreto non viaggia mai in rete: si firma
// timestamp + corpo della richiesta e si confronta in tempo costante.
//
// I file in api/ che iniziano con "_" non diventano endpoint su Vercel.
import { createHmac, timingSafeEqual } from "crypto";

// Oltre questa distanza dall'ora del server la richiesta e' scaduta: una
// richiesta intercettata non si puo' rigiocare all'infinito.
export const FINESTRA_SECONDI = 300;

// Un segreto per partner: revocarne uno non tocca gli altri.
const SEGRETI = {
  repairlab: () => process.env.PC_SECRET_REPAIRLAB,
};

const LUNGHEZZA_MINIMA_SEGRETO = 32;

/**
 * JSON deterministico: chiavi in ordine alfabetico a ogni livello.
 * Chi firma e chi verifica devono ottenere la stessa stringa byte per byte,
 * e l'ordine delle chiavi non sopravvive a un giro di parsing.
 */
export function canonico(v) {
  if (Array.isArray(v)) return `[${v.map(canonico).join(",")}]`;
  if (v && typeof v === "object") {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonico(v[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v === undefined ? null : v);
}

export function messaggio(timestamp, payload) {
  return `${timestamp}.${canonico(payload)}`;
}

export function firma(segreto, timestamp, payload) {
  return createHmac("sha256", segreto).update(messaggio(timestamp, payload)).digest("hex");
}

function confronta(a, b) {
  const x = Buffer.from(String(a), "utf8");
  const y = Buffer.from(String(b), "utf8");
  // timingSafeEqual lancia se le lunghezze differiscono: la lunghezza di un
  // hash esadecimale non e' un'informazione segreta, il controllo puo' uscire.
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/**
 * Verifica una richiesta firmata.
 * Ritorna { ok: true, client } oppure { ok: false, motivo }.
 * Il motivo serve ai log: al chiamante si risponde sempre 401 generico,
 * cosi' chi tenta non impara dove sbaglia.
 */
export function verifica({ client, timestamp, firmaRicevuta, payload, ora = Date.now() }) {
  const segreto = SEGRETI[String(client)]?.();
  if (!segreto) return { ok: false, motivo: "client sconosciuto o segreto non configurato" };
  if (segreto.length < LUNGHEZZA_MINIMA_SEGRETO) {
    return { ok: false, motivo: "segreto troppo corto: rigenerarlo" };
  }

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || ts <= 0) return { ok: false, motivo: "timestamp mancante o non valido" };
  if (Math.abs(Math.floor(ora / 1000) - ts) > FINESTRA_SECONDI) {
    return { ok: false, motivo: "richiesta scaduta o orologio sfasato" };
  }

  if (typeof firmaRicevuta !== "string" || firmaRicevuta.length !== 64) {
    return { ok: false, motivo: "firma mancante o malformata" };
  }
  if (!confronta(firma(segreto, ts, payload), firmaRicevuta)) {
    return { ok: false, motivo: "firma non valida" };
  }
  return { ok: true, client: String(client) };
}
