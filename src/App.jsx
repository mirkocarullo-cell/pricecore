import { useState, useEffect } from "react";

const ORANGE = "#ff6a00";
const DARK = "#0a0a0a";
const CARD = "#141414";
const LINE = "#2a2a2a";
const MUTED = "#888";

const MODELS = [
  "iPhone 16 Pro Max", "iPhone 16 Pro", "iPhone 16 Plus", "iPhone 16",
  "iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15 Plus", "iPhone 15",
  "iPhone 14 Pro Max", "iPhone 14 Pro", "iPhone 14 Plus", "iPhone 14",
  "iPhone 13 Pro Max", "iPhone 13 Pro", "iPhone 13", "iPhone 13 Mini",
  "iPhone 12 Pro Max", "iPhone 12 Pro", "iPhone 12", "iPhone 12 Mini",
  "iPhone SE 2022", "iPhone 11 Pro Max", "iPhone 11 Pro", "iPhone 11",
  "Samsung Galaxy S24 Ultra", "Samsung Galaxy S24+", "Samsung Galaxy S24",
  "Samsung Galaxy S23 Ultra", "Samsung Galaxy S23+", "Samsung Galaxy S23",
  "Samsung Galaxy S22 Ultra", "Samsung Galaxy S22+", "Samsung Galaxy S22",
  "Xiaomi 14 Ultra", "Xiaomi 14 Pro", "Xiaomi 13 Pro", "Google Pixel 8 Pro", "Google Pixel 8", "Altro"
];

// ---- MOTORE DI DEPREZZAMENTO ----
function calcolaValore(gradoA, d) {
  let val = gradoA;
  const list = [];
  const pct = (label, p) => {
    const before = val;
    val = val * (1 - p);
    list.push(`${label}: -${Math.round(p * 100)}% (−€${Math.round(before - val)})`);
  };
  const eur = (label, e) => {
    val = Math.max(0, val - e);
    list.push(`${label}: −€${e}`);
  };

  // Blocchi gravi
  if (d.imei?.includes("No")) pct("IMEI non leggibile", 0.70);
  if (d.internet?.includes("No")) pct("Non si collega a internet", 0.80);
  if (d.schedamadre?.includes("Sì")) pct("Interventi su scheda madre", 0.80);
  if (d.faceid?.includes("No")) pct("Face ID non funzionante", 0.80);

  // Batteria
  if (d.batt?.includes("90")) pct("Batteria 90-100%", 0.02);
  else if (d.batt?.includes("80")) pct("Batteria 80-89% (da sostituire)", 0.17);
  else if (d.batt?.includes("70-79")) pct("Batteria 70-79% (da sostituire)", 0.22);
  else if (d.batt?.includes("Meno")) pct("Batteria sotto il 70% (da sostituire)", 0.22);

  // Schermo
  if (d.schermo?.includes("Piccoli graffi")) pct("Schermo con piccoli graffi", 0.09);
  else if (d.schermo?.includes("Crepe")) pct("Schermo crepato o rotto", 0.47);

  // Scocca
  if (d.scocca?.includes("Nessun danno")) pct("Scocca: usura fisiologica", 0.02);
  else if (d.scocca?.includes("segni lievi")) pct("Scocca con segni lievi", 0.07);
  else if (d.scocca?.includes("segni evidenti")) pct("Scocca con segni evidenti", 0.32);
  else if (d.scocca?.includes("molto danneggiata")) pct("Scocca molto danneggiata o piegata", 0.32);

  // Altoparlante
  if (d.altoparlante?.includes("basso")) pct("Altoparlante con volume basso", 0.05);
  else if (d.altoparlante?.includes("Gracchia")) pct("Altoparlante gracchiante o rotto", 0.20);

  // Connettore
  if (d.conn?.includes("intermittenti")) pct("Connettore intermittente", 0.05);
  else if (d.conn?.includes("Non funziona")) pct("Connettore di ricarica non funzionante", 0.22);

  // Altri danni (euro fissi)
  const dn = d.danni || [];
  if (dn.some(x => x.includes("acqua"))) eur("Contatto con liquidi", 100);
  if (dn.some(x => x.includes("Scocca sostituita"))) eur("Scocca sostituita", 60);
  if (dn.some(x => x.includes("Tasti"))) eur("Tasti laterali difettosi", 30);
  if (dn.some(x => x.includes("Microfono"))) eur("Microfono difettoso", 30);
  if (dn.some(x => x.includes("Fotocamera"))) eur("Fotocamera difettosa", 40);

  // Ricondizionato
  if (d.acq?.includes("Ricondizionato")) pct("Acquistato ricondizionato", 0.10);

  const finale = Math.max(30, Math.round(val));
  const ratio = gradoA > 0 ? finale / gradoA : 0;
  const grado = ratio >= 0.85 ? "A" : ratio >= 0.62 ? "B" : ratio >= 0.38 ? "C" : "D";
  return { finale, deprezzamenti: list, grado, ratio };
}

// Valore base di riferimento per la stima live (prima della risposta AI)
function baseGradoA(modello, gb) {
  if (!modello) return 0;
  let base = 250;
  const m = modello;
  if (m.includes("16 Pro Max")) base = 950;
  else if (m.includes("16 Pro")) base = 800;
  else if (m.includes("16 Plus")) base = 650;
  else if (m.includes("16")) base = 580;
  else if (m.includes("15 Pro Max")) base = 780;
  else if (m.includes("15 Pro")) base = 650;
  else if (m.includes("15 Plus")) base = 520;
  else if (m.includes("15")) base = 460;
  else if (m.includes("14 Pro Max")) base = 620;
  else if (m.includes("14 Pro")) base = 520;
  else if (m.includes("14 Plus")) base = 400;
  else if (m.includes("14")) base = 350;
  else if (m.includes("13 Pro Max")) base = 480;
  else if (m.includes("13 Pro")) base = 400;
  else if (m.includes("13 Mini")) base = 250;
  else if (m.includes("13")) base = 290;
  else if (m.includes("12 Pro Max")) base = 340;
  else if (m.includes("12 Pro")) base = 280;
  else if (m.includes("12 Mini")) base = 170;
  else if (m.includes("12")) base = 210;
  else if (m.includes("11 Pro Max")) base = 250;
  else if (m.includes("11 Pro")) base = 210;
  else if (m.includes("11")) base = 160;
  else if (m.includes("SE 2022")) base = 130;
  else if (m.includes("S24 Ultra")) base = 700;
  else if (m.includes("S24+")) base = 500;
  else if (m.includes("S24")) base = 420;
  else if (m.includes("S23 Ultra")) base = 520;
  else if (m.includes("S23+")) base = 380;
  else if (m.includes("S23")) base = 320;
  else if (m.includes("S22 Ultra")) base = 350;
  else if (m.includes("S22+")) base = 260;
  else if (m.includes("S22")) base = 220;
  else if (m.includes("Xiaomi 14 Ultra")) base = 550;
  else if (m.includes("Xiaomi 14 Pro")) base = 400;
  else if (m.includes("Xiaomi 13 Pro")) base = 300;
  else if (m.includes("Pixel 8 Pro")) base = 450;
  else if (m.includes("Pixel 8")) base = 320;

  if (gb === "256 GB") base += Math.round(base * 0.10);
  if (gb === "512 GB") base += Math.round(base * 0.22);
  if (gb === "1 TB") base += Math.round(base * 0.35);
  if (gb === "64 GB") base -= Math.round(base * 0.06);
  return base;
}

function parseEuro(str) {
  if (!str) return 0;
  const n = String(str).replace(/\./g, "").match(/\d+/);
  return n ? parseInt(n[0], 10) : 0;
}

export default function PriceCore() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [showDonate, setShowDonate] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);

  const TOTAL_STEPS = 13;

  useEffect(() => {
    setFadeIn(false);
    const t = setTimeout(() => setFadeIn(true), 50);
    return () => clearTimeout(t);
  }, [step]);

  const update = (key, val) => setData(prev => ({ ...prev, [key]: val }));

  const next = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else valuta();
  };

  const back = () => {
    if (result) { setResult(null); setStep(TOTAL_STEPS - 1); return; }
    if (step > 0) setStep(step - 1);
  };

  const valuta = async () => {
    setLoading(true); setResult(null); setError("");
    const prompt = `Dispositivo: ${data.modello}, storage ${data.gb}, mercato italiano.
Fornisci il valore di mercato reale. Rispondi SOLO con questo JSON:
{"modello":"nome completo ufficiale","anno":"anno di uscita","valore_nuovo":"€ importo","valore_grado_a":"€ importo","punti_forza":["punto 1","punto 2","punto 3"],"consigli_vendita":"2-3 consigli pratici per vendere meglio questo modello","copy_annuncio":"annuncio di vendita pronto, 4 righe, italiano, persuasivo"}`;

    try {
      const res = await fetch("/api/valuta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      const text = (json.content || []).find(b => b.type === "text")?.text || "";
      const ai = JSON.parse(text.replace(/```json|```/g, "").trim());
      const gradoA = parseEuro(ai.valore_grado_a) || baseGradoA(data.modello, data.gb);
      const calc = calcolaValore(gradoA, data);
      setResult({ ...ai, gradoA, ...calc });
      setTimeout(() => setShowDonate(true), 2500);
    } catch (e) {
      setError("Errore: " + e.message);
    }
    setLoading(false);
  };

  const reset = () => { setStep(0); setData({}); setResult(null); setShowDonate(false); };
  const gradeColor = (g = "") => g === "A" ? "#4caf50" : g === "B" ? ORANGE : g === "C" ? "#ff9800" : "#f44336";

  const liveCalc = data.modello ? calcolaValore(baseGradoA(data.modello, data.gb), data) : null;

  const scaricaPDF = () => {
    const d = result; if (!d) return;
    const gc = gradeColor(d.grado);
    const now = new Date().toLocaleDateString("it-IT");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#111}h1{font-size:22px;margin-bottom:4px}.sub{color:#666;font-size:13px;margin-bottom:26px}.badge{display:inline-block;background:#ff6a00;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:10px}.grade{display:inline-block;padding:6px 16px;border-radius:20px;border:2px solid ${gc};color:${gc};font-weight:700;font-size:14px;margin:10px 0}.prices{display:flex;gap:16px;margin:20px 0}.pbox{flex:1;border:1px solid #ddd;border-radius:10px;padding:14px;text-align:center}.plabel{font-size:11px;color:#888;margin-bottom:6px}.pval{font-size:18px;font-weight:800}.sec{margin:20px 0}.stitle{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:10px}.item{padding:6px 10px;border-left:3px solid #ddd;margin-bottom:6px;font-size:13px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center}</style></head><body>
<div class="badge">PriceCore — Valutazione dispositivo</div>
<h1>${d.modello} · ${data.gb}</h1><div class="sub">Data valutazione: ${now}</div>
<div class="grade">Grado stimato: ${d.grado}</div>
<div class="prices">
<div class="pbox"><div class="plabel">Valore nuovo</div><div class="pval" style="color:#888">${d.valore_nuovo}</div></div>
<div class="pbox"><div class="plabel">Usato Grado A</div><div class="pval" style="color:#2e7d32">€ ${d.gradoA}</div></div>
<div class="pbox" style="border-color:${gc}"><div class="plabel">Il tuo dispositivo</div><div class="pval" style="color:${gc}">€ ${d.finale}</div></div>
</div>
<div class="sec"><div class="stitle">Deprezzamenti applicati</div>${d.deprezzamenti.map(x=>`<div class="item" style="border-color:#c62828">${x}</div>`).join("") || '<div class="item">Nessun deprezzamento</div>'}</div>
<div class="sec"><div class="stitle">Punti di forza</div>${(d.punti_forza||[]).map(x=>`<div class="item" style="border-color:#ff6a00">${x}</div>`).join("")}</div>
<div class="sec"><div class="stitle">Consigli di vendita</div><p style="font-size:13px;color:#444;line-height:1.7">${d.consigli_vendita}</p></div>
<div class="footer">PriceCore by Mirko Tech Insider · pricecore.it · ${now} · Valori indicativi di mercato</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `PriceCore_${d.modello.replace(/\s+/g, "_")}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const Pill = ({ label, desc, color, selected, onClick }) => (
    <div onClick={onClick} style={{
      padding: "14px 18px", borderRadius: 12,
      border: `1.5px solid ${selected ? (color || ORANGE) : LINE}`,
      background: selected ? (color ? color + "22" : ORANGE + "1a") : "#1a1a1a",
      color: selected ? "#fff" : "#aaa", cursor: "pointer", fontSize: 14,
      transition: "all .2s", display: "flex", flexDirection: "column", gap: 4, marginBottom: 10
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? (color || ORANGE) : "#444"}`, flex: "0 0 auto", position: "relative" }}>
          {selected && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: color || ORANGE }} />}
        </div>
        <span style={{ fontWeight: 600 }}>{label}</span>
      </div>
      {desc && <span style={{ fontSize: 12.5, color: "#888", paddingLeft: 28, lineHeight: 1.4 }}>{desc}</span>}
    </div>
  );

  const STEPS_DEF = [
    { title: "Modello del dispositivo", sub: "Seleziona il modello esatto per una valutazione precisa.",
      content: (
        <select value={data.modello || ""} onChange={e => update("modello", e.target.value)}
          style={{ width: "100%", padding: "16px 18px", borderRadius: 12, border: `1.5px solid ${LINE}`, background: "#1a1a1a", color: "#fff", fontSize: 16, outline: "none", cursor: "pointer", appearance: "none",
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ff6a00' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 18px center" }}>
          <option value="">Seleziona il modello</option>
          {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      ), valid: () => !!data.modello },

    { title: "Capacità di archiviazione", sub: "Verifica la memoria in Impostazioni → Generali → Info.",
      content: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"].map(c =>
        <Pill key={c} label={c} selected={data.gb === c} onClick={() => update("gb", c)} />),
      valid: () => !!data.gb },

    { title: "Acquistato come", sub: "Il dispositivo era nuovo o ricondizionato all'acquisto?",
      content: [{ label: "✅ Nuovo", color: "#4caf50" }, { label: "🔄 Ricondizionato", color: ORANGE }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.acq === o.label} onClick={() => update("acq", o.label)} />),
      valid: () => !!data.acq },

    { title: "Il telefono legge l'IMEI?", sub: "Apri il tastierino numerico e digita *#06# — deve apparire un codice.",
      content: [{ label: "✅ Sì, mostra l'IMEI", color: "#4caf50" }, { label: "❌ No, non appare nulla", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.imei === o.label} onClick={() => update("imei", o.label)} />),
      valid: () => !!data.imei },

    { title: "Il telefono si collega a internet?", sub: "Prova sia con Wi-Fi che con rete dati mobile.",
      content: [{ label: "✅ Sì, si collega senza problemi", color: "#4caf50" }, { label: "❌ No, non si collega", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.internet === o.label} onClick={() => update("internet", o.label)} />),
      valid: () => !!data.internet },

    { title: "Il Face ID funziona?", sub: "Prova a sbloccare il telefono con il riconoscimento facciale.",
      content: [{ label: "✅ Sì, funziona correttamente", color: "#4caf50" }, { label: "❌ No, non funziona", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.faceid === o.label} onClick={() => update("faceid", o.label)} />),
      valid: () => !!data.faceid },

    { title: "Stato della batteria", sub: "Impostazioni → Batteria → Stato e ricarica della batteria.",
      content: [{ label: "🟢 90–100%", color: "#4caf50" }, { label: "🟡 80–89%", color: ORANGE },
        { label: "🟠 70–79%", color: "#ff9800" }, { label: "🔴 Meno del 70%", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.batt === o.label} onClick={() => update("batt", o.label)} />),
      valid: () => !!data.batt },

    { title: "Condizione dello schermo", sub: "Controlla graffi, crepe e scheggiature sul vetro.",
      content: [{ label: "✅ Perfetto, come nuovo", color: "#4caf50" },
        { label: "🔍 Piccoli graffi visibili", color: ORANGE },
        { label: "💥 Crepe o rotture evidenti", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.schermo === o.label} onClick={() => update("schermo", o.label)} />),
      valid: () => !!data.schermo },

    { title: "Segni sulla scocca", sub: "Ispeziona il retro e i lati del dispositivo.",
      content: [
        { label: "✅ Nessun danno (come nuova)", desc: "La scocca è integra, come appena uscita dalla scatola.", color: "#4caf50" },
        { label: "🔍 Scocca con segni lievi", desc: "Piccole ammaccature o graffi lievi appena visibili.", color: ORANGE },
        { label: "⚠️ Scocca con segni evidenti", desc: "Segni evidenti di cadute o graffi profondi.", color: "#ff9800" },
        { label: "💥 Scocca molto danneggiata o piegata", desc: "Deformazioni importanti, scocca compromessa.", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} desc={o.desc} color={o.color} selected={data.scocca === o.label} onClick={() => update("scocca", o.label)} />),
      valid: () => !!data.scocca },

    { title: "Altoparlante superiore", sub: "Fai una chiamata di prova e ascolta la qualità dell'audio.",
      content: [{ label: "✅ Si sente benissimo!", color: "#4caf50" },
        { label: "🔉 Si sente basso ma funziona", color: ORANGE },
        { label: "❌ Gracchia o non funzionante", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.altoparlante === o.label} onClick={() => update("altoparlante", o.label)} />),
      valid: () => !!data.altoparlante },

    { title: "Connettore di ricarica", sub: "Verifica che la ricarica funzioni con un cavo originale.",
      content: [{ label: "✅ Funziona perfettamente", color: "#4caf50" },
        { label: "⚠️ Problemi intermittenti", color: ORANGE },
        { label: "❌ Non funziona", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.conn === o.label} onClick={() => update("conn", o.label)} />),
      valid: () => !!data.conn },

    { title: "Lavori pregressi su scheda madre", sub: "Il telefono ha mai subito interventi sulla scheda logica?",
      content: [{ label: "✅ No, mai aperto", color: "#4caf50" }, { label: "⚠️ Sì, riparazioni pregresse", color: "#f44336" }]
        .map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.schedamadre === o.label} onClick={() => update("schedamadre", o.label)} />),
      valid: () => !!data.schedamadre },

    { title: "Altri danni", sub: "Seleziona tutto ciò che si applica al tuo dispositivo.",
      content: (() => {
        const opts = [
          { label: "💧 Contatto con acqua", color: "#f44336" },
          { label: "🔧 Scocca sostituita", color: "#f44336" },
          { label: "🔘 Tasti laterali difettosi", color: ORANGE },
          { label: "🎙️ Microfono difettoso", color: ORANGE },
          { label: "📷 Fotocamera difettosa", color: ORANGE },
          { label: "✅ Nessun altro danno", color: "#4caf50" }];
        return opts.map(o => {
          const selected = (data.danni || []).includes(o.label);
          return (
            <div key={o.label} onClick={() => {
              const curr = data.danni || [];
              if (o.label.includes("Nessun")) update("danni", curr.includes(o.label) ? [] : [o.label]);
              else {
                const f = curr.filter(x => !x.includes("Nessun"));
                update("danni", f.includes(o.label) ? f.filter(x => x !== o.label) : [...f, o.label]);
              }
            }} style={{
              padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${selected ? o.color : LINE}`,
              background: selected ? o.color + "22" : "#1a1a1a", color: selected ? "#fff" : "#aaa",
              cursor: "pointer", fontSize: 14, transition: "all .2s", display: "flex", alignItems: "center", gap: 10, marginBottom: 10
            }}>
              <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? o.color : "#444"}`, flex: "0 0 auto", display: "flex", alignItems: "center", justifyContent: "center", background: selected ? o.color : "transparent" }}>
                {selected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              {o.label}
            </div>
          );
        });
      })(),
      valid: () => (data.danni || []).length > 0 }
  ];

  const currentStep = STEPS_DEF[step];
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  // ---- RISULTATO ----
  if (result) {
    const d = result;
    const gc = gradeColor(d.grado);
    return (
      <div style={{ background: DARK, color: "#f0f0f0", minHeight: "100vh", padding: "24px 16px", fontFamily: "-apple-system, sans-serif" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {showDonate && (
            <div onClick={() => setShowDonate(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
              <div onClick={e => e.stopPropagation()} style={{ background: CARD, border: `2px solid ${ORANGE}`, borderRadius: 16, padding: 28, maxWidth: 380, textAlign: "center", position: "relative" }}>
                <div onClick={() => setShowDonate(false)} style={{ position: "absolute", top: 12, right: 16, color: "#666", fontSize: 22, cursor: "pointer" }}>×</div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>☕</div>
                <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Ti è stato utile?</h2>
                <p style={{ color: "#aaa", fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
                  PriceCore è gratuito grazie al supporto della community.<br />Offrimi un caffè per mantenerlo attivo! 💛
                </p>
                <a href="https://ko-fi.com/mirkotechinsider" target="_blank" rel="noopener noreferrer" style={{ display: "block", padding: 14, borderRadius: 10, background: ORANGE, color: "#fff", fontWeight: 700, fontSize: 15, textDecoration: "none", marginBottom: 10 }}>☕ Offri un caffè</a>
                <div onClick={() => setShowDonate(false)} style={{ color: "#666", fontSize: 13, cursor: "pointer", padding: 8 }}>Magari più tardi</div>
              </div>
            </div>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
            <button onClick={back} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>←</button>
            <b style={{ fontSize: 18 }}>Risultato valutazione</b>
          </div>

          <div style={{ background: `linear-gradient(135deg, ${CARD}, #1a1a1a)`, border: `2px solid ${gc}44`, borderRadius: 20, padding: 30, textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: "uppercase" }}>Il tuo dispositivo vale</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: gc, lineHeight: 1.1, margin: "10px 0", textShadow: `0 0 30px ${gc}44` }}>€ {d.finale}</div>
            <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, border: `1.5px solid ${gc}`, color: gc, fontWeight: 700, fontSize: 13 }}>Grado {d.grado}</div>
            <div style={{ fontSize: 13, color: "#999", marginTop: 14 }}>{d.modello} · {data.gb} · {d.anno}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Valore nuovo</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#888" }}>{d.valore_nuovo}</div>
            </div>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Usato Grado A</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#4caf50" }}>€ {d.gradoA}</div>
            </div>
          </div>

          <div style={{ background: CARD, border: "1px solid #3a1a1a", borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#f44336", marginBottom: 12 }}>📉 Deprezzamenti applicati</div>
            {d.deprezzamenti.length ? d.deprezzamenti.map((x, i) =>
              <div key={i} style={{ fontSize: 13, color: "#ccc", marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #f44336", lineHeight: 1.5 }}>{x}</div>
            ) : <div style={{ fontSize: 13, color: "#4caf50" }}>Nessun deprezzamento applicato</div>}
          </div>

          <div style={{ background: CARD, border: `1px solid ${ORANGE}44`, borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: ORANGE, marginBottom: 12 }}>✅ Punti di forza</div>
            {(d.punti_forza || []).map((x, i) => <div key={i} style={{ fontSize: 13, color: "#ccc", marginBottom: 8, paddingLeft: 10, borderLeft: `2px solid ${ORANGE}`, lineHeight: 1.5 }}>{x}</div>)}
          </div>

          <div style={{ background: CARD, border: "1px solid #2a2a1a", borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#ffb74d", marginBottom: 12 }}>💡 Consigli di vendita</div>
            <p style={{ fontSize: 13, color: "#bbb", lineHeight: 1.7 }}>{d.consigli_vendita}</p>
          </div>

          <div style={{ background: CARD, border: "1px solid #1a2a3a", borderRadius: 14, padding: 18, marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#64b5f6", marginBottom: 12 }}>✍️ Copy pronto per annuncio</div>
            <p style={{ fontSize: 14, color: "#ddd", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{d.copy_annuncio}</p>
          </div>

          <button onClick={scaricaPDF} style={{ width: "100%", padding: 16, borderRadius: 12, border: "none", background: ORANGE, color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer", marginBottom: 10 }}>📄 Scarica PDF</button>
          <button onClick={reset} style={{ width: "100%", padding: 16, borderRadius: 12, border: `1px solid ${LINE}`, background: "transparent", color: "#aaa", fontWeight: 600, fontSize: 15, cursor: "pointer" }}>🔄 Nuova valutazione</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ background: DARK, color: "#fff", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <div style={{ fontSize: 60, marginBottom: 20, animation: "spin 1.5s linear infinite" }}>⚙️</div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Analisi in corso...</h2>
        <p style={{ color: MUTED, fontSize: 14 }}>Sto calcolando il valore del tuo dispositivo</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: DARK, color: "#f0f0f0", minHeight: "100vh", padding: "20px 16px 40px", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <div style={{ paddingBottom: 18, borderBottom: `1px solid ${LINE}`, marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 2, color: ORANGE, textTransform: "uppercase" }}>Mirko Tech Insider</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -.5, margin: 0 }}>Price<span style={{ color: ORANGE }}>Core</span></h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 32 }}>
          <button onClick={back} disabled={step === 0} style={{ background: "none", border: "none", color: step === 0 ? "#333" : "#fff", fontSize: 22, cursor: step === 0 ? "not-allowed" : "pointer" }}>←</button>
          <div style={{ flex: 1, height: 8, background: "#1a1a1a", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ width: `${progress}%`, height: "100%", background: `linear-gradient(90deg, ${ORANGE}, #ff8a30)`, borderRadius: 20, transition: "width .5s ease" }} />
          </div>
          <span style={{ fontSize: 13, color: MUTED, minWidth: 40, textAlign: "right" }}>{step + 1}/{TOTAL_STEPS}</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: window.innerWidth > 820 ? "280px 1fr" : "1fr", gap: 30 }}>
          <aside>
            <div style={{ background: CARD, border: `1.5px solid ${ORANGE}44`, borderRadius: 14, padding: 18, marginBottom: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: ORANGE, fontWeight: 600, fontSize: 14 }}>Stima live:</span>
                <span style={{ color: ORANGE, fontWeight: 800, fontSize: 22 }}>{liveCalc ? `€ ${liveCalc.finale}` : "-"}</span>
              </div>
              {liveCalc && <div style={{ fontSize: 11, color: MUTED, marginTop: 6 }}>Valore indicativo, si affina a ogni risposta</div>}
            </div>
            {Object.keys(data).length > 0 && (
              <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Le tue risposte</div>
                {[["Modello", data.modello], ["Capacità", data.gb], ["Acquistato", data.acq], ["IMEI", data.imei],
                  ["Internet", data.internet], ["Face ID", data.faceid], ["Batteria", data.batt], ["Schermo", data.schermo],
                  ["Scocca", data.scocca], ["Altoparlante", data.altoparlante], ["Connettore", data.conn],
                  ["Scheda madre", data.schedamadre], ["Altri danni", (data.danni || []).join(", ")]
                ].filter(r => r[1]).map((r, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderTop: i > 0 ? `1px solid ${LINE}` : "none", fontSize: 12.5 }}>
                    <span style={{ color: MUTED }}>{r[0]}</span>
                    <span style={{ fontWeight: 600, textAlign: "right", color: "#ddd", maxWidth: 160 }}>{r[1]}</span>
                  </div>
                ))}
              </div>
            )}
          </aside>

          <main>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 18, padding: 30, opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(15px)", transition: "all .4s ease" }}>
              <h2 style={{ color: ORANGE, fontWeight: 700, fontSize: 24, marginBottom: 6 }}>{currentStep.title}</h2>
              <p style={{ color: "#aaa", fontSize: 15, marginBottom: 24 }}>{currentStep.sub}</p>
              {error && <div style={{ background: "#2a0a0a", border: "1px solid #f44336", borderRadius: 10, padding: 14, color: "#f44336", marginBottom: 16, fontSize: 13 }}>{error}</div>}
              {currentStep.content}
              <div style={{ marginTop: 24, textAlign: "right" }}>
                <button onClick={next} disabled={!currentStep.valid()} style={{
                  background: currentStep.valid() ? ORANGE : "#2a2a2a", color: currentStep.valid() ? "#fff" : "#666",
                  border: "none", borderRadius: 40, padding: "14px 36px", fontSize: 15, fontWeight: 700,
                  cursor: currentStep.valid() ? "pointer" : "not-allowed", transition: "all .2s",
                  boxShadow: currentStep.valid() ? `0 4px 20px ${ORANGE}44` : "none"
                }}>{step === TOTAL_STEPS - 1 ? "💰 Valuta ora" : "Continua →"}</button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
