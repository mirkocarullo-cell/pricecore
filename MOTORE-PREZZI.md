# Motore prezzi PriceCore

Il calcolo del prezzo sta tutto in [`src/motorePrezzi.js`](src/motorePrezzi.js).
L'AI non decide il prezzo: fornisce solo i testi (punti di forza, consigli, copy
annuncio, valore del nuovo).

Verifica:

```
node src/motorePrezzi.test.mjs
```

## Come funziona

Il metodo e' quello di Swappie, ricavato dalla loro API pubblica
`/api/sell/api/v3/prices/`:

```
prezzo = base(modello, storage)        prezzo di ritiro, stato "come nuovo"
       x tier estetico                 quanto pesa l'usura, per modello
       - presa in carico               una volta, se c'e' almeno un guasto
       - somma costi riparazione       EURO FISSI, non percentuali
       x margine PriceCore
       con pavimento al valore ricambi
```

**I guasti non sono percentuali.** Uno schermo rotto costa 144 EUR sia su un
telefono da 200 EUR che su uno da 600: e' il costo del pezzo. Con le percentuali
i danni erano sottostimati sui modelli economici e sovrastimati sui costosi.

Le percentuali restano solo dove hanno senso: il tier estetico e il margine.

## Le tabelle

| tabella | cosa contiene | fonte |
|---|---|---|
| `BASE` | prezzo di ritiro "come nuovo" per modello e taglio | API Swappie IT, 2026-09-20 |
| `TIER_MODELLO` | quanto pesa l'usura estetica, per modello | idem |
| `COSTO_SCHERMO`, `COSTO_BATTERIA` | costo riparazione per modello | idem |
| `COSTI_RIPARAZIONE` | costo per fascia, per le altre riparazioni | stimati su Swappie |
| `MODELLI` | elenco del menu a tendina | — |

Copertura: 31 iPhone, dall'SE 2020 al 17 Pro Max, inclusi Air, 17e, 16e e i
mini, con i tagli reali (64 GB → 2 TB).

### Il tier estetico non e' una costante

Quanto pesa l'usura dipende moltissimo dall'eta' del telefono:

| modello | segni minimi | segni evidenti | molto segnato |
|---|---|---|---|
| iPhone 17 | 0,96 | 0,90 | 0,87 |
| iPhone 15 | 0,91 | 0,86 | 0,76 |
| iPhone 12 | 0,84 | 0,75 | 0,64 |
| iPhone SE 2020 | 0,65 | 0,50 | 0,27 |

Sui telefoni vecchi il costo fisso di ricondizionamento pesa molto di piu' sul
prezzo. Un moltiplicatore unico sbaglierebbe a entrambi gli estremi.

## Le manopole

- **`MARGINE`** (0.95): quanto PriceCore sta sotto Swappie. Un solo punto da
  toccare per spostare tutti i prezzi.
- **`COSTO_SCHERMO`, `COSTO_BATTERIA`, `COSTI_RIPARAZIONE`**: sono i costi di
  **Swappie**, non quelli di laboratorio. Abbassandoli ai costi reali, PriceCore
  puo' pagare i telefoni danneggiati piu' di Swappie restando in margine. E' il
  vantaggio competitivo che loro non hanno.
- **`PRESA_IN_CARICO`** (15 EUR): manodopera e logistica, applicata una volta
  sola se serve almeno una riparazione.

## Cosa controlla il test

1. **19 casi contro i prezzi reali Swappie**, dall'iPhone SE 2020 al 17 Pro Max.
   PriceCore deve restare fra il 15% e lo 0% sotto Swappie, oppure entro 5 EUR:
   su un telefono da 40 EUR lo scarto in euro conta piu' della percentuale.
2. **Tutte le 21 risposte peggiorative devono abbassare il prezzo.** I match di
   stringa falliscono in silenzio: e' cosi' che "molto graffiato" inizialmente
   non aveva effetto (l'etichetta ha la m minuscola) e che la batteria 70-79%
   non veniva conteggiata (le etichette usano l'en-dash, non il trattino).
3. **Ogni voce del menu deve avere un prezzo su ogni taglio.** Intercetta i
   modelli aggiunti al menu e dimenticati in tabella, e le differenze di grafia
   fra le due liste ("mini" contro "Mini").

## Punti aperti

- **I prezzi invecchiano.** Swappie stesso proietta −8/−10% a trimestre: un
  iPhone 15 256GB passa da 237 EUR a 217 in tre mesi. Le tabelle vanno
  riverificate ogni 3-6 mesi rileggendo l'API.
- **iPhone 8, X, XR, XS e XS Max sono fuori dal menu di proposito.** Swappie ha
  smesso di comprarli e quota 5 EUR fissi per tutti, quindi non esiste un
  riferimento. Per trattarli servono i tuoi prezzi di acquisto reali.
- **Gli Android non sono verificati.** Samsung, Xiaomi e Pixel usano ancora i
  valori della vecchia tabella, che nessuna fonte conferma. Swappie e' solo
  iPhone: per quelli serve ricalibrare su Back Market o Refurbed.
- **I tagli che non esistono.** La domanda sullo storage propone sempre
  64/128/256/512 GB e 1 TB anche per modelli che non hanno quei tagli (un
  iPhone 17 Pro Max da 128 GB non esiste). In quel caso il prezzo viene scalato
  dal taglio piu' vicino. Si potrebbe filtrare la domanda in base al modello.
