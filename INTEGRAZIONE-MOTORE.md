# Come innestare il nuovo motore prezzi in App.jsx

Il nuovo motore sta in `src/motorePrezzi.js`. Il test in `src/motorePrezzi.test.mjs`
lo verifica contro i prezzi reali Swappie (`node src/motorePrezzi.test.mjs`).

**Attenzione:** il `src/App.jsx` che hai in locale e' una versione vecchia (wizard
a 3 step, prezzo deciso dall'AI). Non contiene il motore prezzi e non va
deployata. Le modifiche qui sotto vanno fatte sull'App.jsx del repo GitHub.

## 1. Import

In cima a `src/App.jsx`:

```js
import { baseComeNuovo, calcolaValore } from "./motorePrezzi";
```

## 2. Cancella le vecchie funzioni

Elimina `baseGradoA(...)` e `calcolaValore(...)` da App.jsx: sono sostituite.

## 3. Sistema le chiamate

Oggi nel codice live c'e' questo (nomi minificati a parte):

```js
const gradoA = parseEuro(ai.valore_grado_a) || baseGradoA(risposte.modello, risposte.gb);
const calcolo = calcolaValore(gradoA, risposte);
```

Diventa:

```js
const base = baseComeNuovo(risposte.modello, risposte.gb);
const calcolo = calcolaValore(base, risposte);
```

Stessa cosa per l'anteprima del prezzo in tempo reale:

```js
const anteprima = risposte.modello
  ? calcolaValore(baseComeNuovo(risposte.modello, risposte.gb), risposte)
  : null;
```

`calcolaValore` restituisce la stessa forma di prima
(`{ finale, deprezzamenti, grado, ratio }`), quindi schermata risultato e PDF
non vanno toccati.

### Perche' togliere `parseEuro(ai.valore_grado_a) || ...`

Oggi il valore grado A che arriva dall'AI **ha la precedenza** sulla tabella.
Vuol dire che il prezzo finale dipende da un numero che l'AI inventa a ogni
chiamata: non e' riproducibile e non e' verificabile contro Swappie. Con la
tabella nuova (prezzi Swappie reali) l'AI deve restare solo su testi: punti di
forza, consigli, copy annuncio, valore del nuovo.

## 4. Aggiungi un'opzione alla domanda sullo schermo

Swappie ha 4 livelli di vetro, PriceCore ne ha 3 e salta da "piccoli graffi"
(estetico, poco) direttamente a "crepe". Ma il vetro **molto graffiato** per
Swappie e' gia' sostituzione piena: sull'iPhone 15 sono 144 EUR. E' il singolo
scostamento piu' grosso tra i due preventivi.

Nelle opzioni dello schermo:

```js
{ label: "✅ Perfetto", color: "#4caf50" },
{ label: "🔍 Piccoli graffi", color: ORANGE },
{ label: "🔦 Molto graffiato", color: "#ff9800" },   // <-- nuova
{ label: "💥 Crepe / Rotture", color: "#f44336" },
```

Il motore gestisce gia' la stringa "Molto graffiat".

## 5. Verifica

```bash
node src/motorePrezzi.test.mjs
```

Tutti i casi devono restare tra -15% e 0% rispetto a Swappie. Al 2026-09-20 il
motore sta tra -0,2% e -5,5%.

---

# Cosa cambia rispetto a prima

## Il metodo

Swappie **non usa percentuali sui guasti**. Usa:

```
prezzo = base(modello, storage, tier estetico)
       - presa in carico (una volta, se c'e' almeno un guasto)
       - somma dei costi di riparazione in EURO
       con pavimento al valore ricambi
```

Uno schermo rotto costa 144 EUR sia su un telefono da 200 che su uno da 600.
Con le percentuali del vecchio motore i danni erano sottostimati sui telefoni
economici e sovrastimati su quelli costosi.

Le percentuali restano solo dove hanno senso: il **tier estetico** (usura
generale, 1.00 / 0.93 / 0.86 / 0.76) e il margine PriceCore.

## I numeri, prima e dopo

Caso di riferimento: iPhone 15 256GB, batteria 85%, vetro graffiato, scocca con
segni lievi.

| | valore |
|---|---|
| PriceCore in produzione oggi | ~355 EUR |
| Swappie, stesso dispositivo | 237 EUR |
| PriceCore col nuovo motore | 231 EUR |

Il motore in produzione pagava **il 50% in piu' di Swappie**. Due cause:

1. **Base gonfiata.** `baseGradoA` dava 460 per "iPhone 15" e poi ci aggiungeva
   +10% per il 256GB, arrivando a 506. Ma 460 e' esattamente il prezzo Swappie
   del **256GB**, non del 128. Il moltiplicatore di storage veniva applicato a un
   numero che gia' lo conteneva.
2. **Percentuali troppo blande** sui guasti veri (schermo graffiato -9%, cioe'
   ~45 EUR, contro 144 EUR di costo reale del vetro).

## Punti aperti

- **La tabella BASE va riverificata ogni 3-6 mesi.** Swappie stesso proietta
  -8/-10% a trimestre: l'iPhone 15 256GB passa da 237 EUR oggi a 217 tra 3 mesi.
- **`MARGINE = 0.95`** e' la manopola per stare sotto Swappie. Alzalo o abbassalo
  in un punto solo.
- **I costi di riparazione sono quelli di Swappie, non i tuoi.** Sono il tuo
  vantaggio competitivo: se un vetro per iPhone 15 in laboratorio ti costa 60 e
  non 144, puoi pagare i danneggiati molto piu' di Swappie e restare in margine.
  Sostituisci `COSTO_SCHERMO`, `COSTO_BATTERIA` e `COSTI_RIPARAZIONE` con il tuo
  listino reale.
- **Gli Android non sono verificati.** Samsung/Xiaomi/Pixel usano ancora i valori
  della vecchia tabella, che nessuna fonte conferma. Swappie e' solo iPhone: per
  quelli serve ricalibrare su Back Market o Refurbed.
- **Soglie di grado** cambiate da 0.85/0.62/0.38 a 0.82/0.60/0.35, per tenere
  conto del fatto che il prezzo ora parte dal "come nuovo" e non dal "grado A".

## Documentazione da correggere

`pricecore-claude-md.md` e' fuori sincrono con la produzione: le percentuali
elencate (batteria -20%, schermo -12%, scocca -10%) non sono quelle del codice
live (-17%, -9%, -7%), e il benchmark "Swappie 261 EUR, PriceCore 239" non
corrisponde ne' a Swappie oggi (237) ne' a quello che l'app calcola (355).
Anche `CLAUDE.md` nella root descrive una struttura diversa e un altro modello AI.
