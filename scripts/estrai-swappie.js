// Estrae da Swappie la fotografia dei prezzi che serve al motore.
//
// L'API di Swappie risponde 403 alle richieste da riga di comando (Cloudflare),
// quindi va interrogata da dentro una pagina swappie.com. Non si automatizza
// con un cron: serve un browser.
//
// COME SI USA
//   1. apri https://swappie.com/it/vendere/iphone/iphone-15/
//   2. apri la console del browser (F12 -> Console)
//   3. incolla tutto questo file e premi invio
//   4. aspetta ~30 secondi: stampa un JSON e lo copia negli appunti
//   5. salvalo come dati/swappie.json nel repo
//   6. node scripts/aggiorna-prezzi.mjs
//
// Poi lancia il test: node src/motorePrezzi.test.mjs

(async () => {
  const MODELLI = [
    "iPhone 17 Pro Max", "iPhone 17 Pro", "iPhone 17", "iPhone 17e", "iPhone Air",
    "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16", "iPhone 16e",
    "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
    "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
    "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13 mini", "iPhone 13",
    "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12 mini", "iPhone 12",
    "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
    "iPhone SE 2022", "iPhone SE 2020",
  ];
  // Swappie applica un costo fisso di presa in carico dentro ogni detrazione.
  // Va tolto per ottenere il costo secco della riparazione.
  const OVERHEAD = 16;
  const TAGLI = ["64GB", "128GB", "256GB", "512GB", "1024GB", "2048GB"];

  const st = encodeURIComponent(JSON.stringify(TAGLI));
  const modelli = {};

  for (const m of MODELLI) {
    const url = `/api/sell/api/v3/prices/?model_name=${encodeURIComponent(m)}` +
                `&country=IT&storages=${st}&variants=%5B%5D`;
    const r = await fetch(url).then(x => x.json());
    if (!r.results || !r.results.length) { console.warn("nessun dato per", m); continue; }

    // prezzo di ritiro "come nuovo", per taglio
    const base = {};
    for (const x of r.results) {
      if (x.functional_condition.length || x.visual_condition !== "LIKE_NEW") continue;
      base[x.model_name.replace(m, "").trim().replace("GB", "")] = x.price.price;
    }

    // costo riparazione: differenza fra sano e guasto, meno l'overhead
    const ref = r.results[0].model_name;
    const sano = r.results.find(x => x.model_name === ref &&
      x.visual_condition === "ALMOST_NEW" && !x.functional_condition.length);
    const costo = (code) => {
      const g = r.results.find(x => x.model_name === ref &&
        x.visual_condition === "ALMOST_NEW" &&
        x.functional_condition.length === 1 && x.functional_condition[0] === code);
      if (!g || !sano) return null;
      return Math.max(5, Math.round(sano.price.price - g.price.price - OVERHEAD));
    };

    // quanto pesa l'usura estetica: media del rapporto su tutti i tagli
    const per = {};
    for (const x of r.results) {
      if (x.functional_condition.length) continue;
      (per[x.model_name] = per[x.model_name] || {})[x.visual_condition] = x.price.price;
    }
    const acc = { ALMOST_NEW: [], GOOD: [], MODERATE: [] };
    for (const n in per) {
      const ln = per[n].LIKE_NEW;
      if (!ln) continue;
      for (const t in acc) if (per[n][t]) acc[t].push(per[n][t] / ln);
    }
    const media = (a) => a.length
      ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(3)
      : null;

    modelli[m] = {
      base,
      schermo: costo("BROKEN_SCREEN"),
      batteria: costo("BATTERY_ISSUE"),
      tier: [media(acc.ALMOST_NEW), media(acc.GOOD), media(acc.MODERATE)],
      pavimento: r.results[0].price.limit_price,
    };
  }

  const out = {
    data: new Date().toISOString().slice(0, 10),
    fonte: "swappie.com /api/sell/api/v3/prices/ country=IT",
    modelli,
  };
  const testo = JSON.stringify(out, null, 1);
  console.log(testo);
  try {
    await navigator.clipboard.writeText(testo);
    console.log(`\n${Object.keys(modelli).length} modelli, copiati negli appunti.`);
    console.log("Salvali in dati/swappie.json e lancia: node scripts/aggiorna-prezzi.mjs");
  } catch {
    console.log("\nCopia il JSON qui sopra a mano in dati/swappie.json");
  }
})();
