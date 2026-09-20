# Motore prezzi per i partner — `/api/valuta-motore`

Endpoint server-to-server che espone il motore deterministico
(`src/motorePrezzi.js`) ai prodotti collegati. Oggi lo usa **RepairLab Cloud**
per la sezione "Valutatore" del gestionale.

Non chiama l'AI: **una valutazione non consuma credito Anthropic.**

## Sicurezza

- Ogni richiesta e' firmata in HMAC-SHA256 (`api/_firma.js`). Il segreto non
  viaggia mai: si firma `timestamp.corpo-canonico` e si confronta in tempo
  costante.
- La firma copre il corpo: cambiare una risposta dopo la firma invalida tutto.
- Le richieste piu' vecchie di 5 minuti sono rifiutate (niente replay).
- Un segreto per partner, in variabile d'ambiente: `PC_SECRET_REPAIRLAB`
  (minimo 32 caratteri). Revocarne uno non tocca gli altri.
- Nessun header CORS: il browser non deve poterlo chiamare, solo un server.
- Chi sbaglia riceve sempre e solo `401 {"error":"Non autorizzato"}`; il
  motivo resta nei log di Vercel.

## Richiesta

```
POST /api/valuta-motore
x-pc-client: repairlab
x-pc-timestamp: <secondi unix>
x-pc-firma: <hmac-sha256 esadecimale>

{ "azione": "valuta", "risposte": { "modello": "iPhone 13", "gb": "128 GB", ... } }
```

Le chiavi delle risposte sono quelle del wizard: `modello`, `gb`, `acq`,
`imei`, `internet`, `faceid`, `batt`, `schermo`, `scocca`, `altoparlante`,
`conn`, `schedamadre`, `danni[]`. **I valori sono le etichette intere del
wizard, emoji comprese**: il motore le confronta in minuscolo su parole
distintive.

`{ "azione": "modelli" }` restituisce l'elenco dei modelli a listino, cosi' il
partner costruisce la tendina senza copiarsi il listino.

## Risposta

```json
{ "riconosciuto": true, "base": 200, "finale": 139, "grado": "B",
  "ratio": 0.695, "deprezzamenti": ["Stato estetico ...: −€17"] }
```

Modello non a listino: `{ "riconosciuto": false, "modello": "..." }`.
Il confronto e' **esatto** sull'elenco `MODELLI`: il motore cerca la chiave per
sottostringa, quindi un modello scritto a mano pescherebbe il prezzo di un
altro.

## Tracciamento

Ogni valutazione finisce nella tabella `valutazioni` con `origine = repairlab`,
quindi si vede nella dashboard insieme a quelle del sito. Se il database non
risponde la valutazione esce lo stesso.

## Test

```
node api/_firma.test.mjs
```
