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
    } else {
      valuta();
    }
  };

  const back = () => {
    if (result) { setResult(null); setStep(TOTAL_STEPS - 1); return; }
    if (step > 0) setStep(step - 1);
  };

  const valuta = async () => {
    setLoading(true); setResult(null); setError("");
    const prompt = `Valuta questo dispositivo usato nel mercato italiano 2026 con RIGORE.

DATI DISPOSITIVO:
- Modello: ${data.modello}
- Storage: ${data.gb}
- Acquistato: ${data.acq || "Nuovo"}
- IMEI leggibile: ${data.imei}
- Si connette a internet: ${data.internet}
- Face ID / riconoscimento: ${data.faceid}
- Batteria: ${data.batt}
- Schermo: ${data.schermo}
- Scocca: ${data.scocca}
- Altoparlante superiore: ${data.altoparlante}
- Connettore ricarica: ${data.conn}
- Lavori pregressi su scheda madre: ${data.schedamadre}
- Altri danni: ${(data.danni || []).join(", ") || "Nessuno"}

REGOLE OBBLIGATORIE DI DEPREZZAMENTO (applica sempre):
- Batteria sotto il 90% (80-89%, 70-79% o meno): sottrai ALMENO €40 (va cambiata)
- Batteria 70-79%: sottrai €70
- Batteria sotto 70%: sottrai €100
- Schermo con graffi lievi: sottrai €30
- Schermo con crepe/rotture: sottrai €150
- Scocca NON come nuova (lievi, evidenti o danneggiata): sottrai SEMPRE €50
- Scocca molto danneggiata o piegata: sottrai €120
- Altoparlante superiore si sente basso: sottrai €15
- Altoparlante superiore gracchia o non funziona: sottrai €30
- Face ID NON funziona: sottrai €80
- IMEI non leggibile: sottrai €200 (possibile dispositivo rubato)
- Non si connette a internet: sottrai €150
- Connettore ricarica parziale: sottrai €40
- Connettore ricarica rotto: sottrai €80
- Contatto con acqua: sottrai €100
- Scocca sostituita: sottrai €60
- Lavori pregressi su scheda madre: sottrai €80
- Ricondizionato (non nuovo): applica -10% sul totale finale
- Ogni altro danno minore (tasti, microfono, fotocamera): sottrai €30 ciascuno

PARTI dal valore di mercato reale grado A (usa prezzi Subito/Swappie/Backmarket 2026), poi applica TUTTI i deprezzamenti pertinenti in euro.

Rispondi SOLO con JSON valido, senza markdown, senza backtick.
{"modello":"nome completo","anno":"anno uscita","storage":"${data.gb}","valore_nuovo":"euro","valore_grado_a":"euro","valore_tuo":"euro","grado_stimato":"A o B o C o D","motivazione_grado":"2 righe","deprezzamenti":["motivo con impatto euro"],"punti_forza":["punto"],"consigli_vendita":"2-3 consigli","copy_annuncio":"4 righe italiano persuasivo"}`;
    try {
      const res = await fetch("/api/valuta", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json();
      const text = (json.content || []).find(b => b.type === "text")?.text || "";
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
      setTimeout(() => setShowDonate(true), 2500);
    } catch (e) { setError("Errore: " + e.message); }
    setLoading(false);
  };

  const reset = () => { setStep(0); setData({}); setResult(null); setShowDonate(false); };

  const gradeColor = (g = "") => g.includes("A") ? "#4caf50" : g.includes("B") ? ORANGE : g.includes("C") ? "#ff9800" : "#f44336";

  const scaricaPDF = () => {
    const d = result; if (!d) return;
    const gc = gradeColor(d.grado_stimato);
    const now = new Date().toLocaleDateString("it-IT");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#111}h1{font-size:22px;margin-bottom:4px}.sub{color:#666;font-size:13px;margin-bottom:30px}.badge{display:inline-block;background:#ff6a00;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:10px}.grade{display:inline-block;padding:6px 16px;border-radius:20px;border:2px solid ${gc};color:${gc};font-weight:700;font-size:14px;margin:10px 0}.prices{display:flex;gap:16px;margin:20px 0}.pbox{flex:1;border:1px solid #ddd;border-radius:10px;padding:14px;text-align:center}.plabel{font-size:11px;color:#888;margin-bottom:6px}.pval{font-size:18px;font-weight:800}.sec{margin:20px 0}.stitle{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:10px}.item{padding:6px 10px;border-left:3px solid #ddd;margin-bottom:6px;font-size:13px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center}</style></head><body>
<div class="badge">🔶 PriceCore — Valutazione</div>
<h1>${d.modello} · ${d.storage}</h1><div class="sub">Data: ${now}</div>
<div class="grade">Grado stimato: ${d.grado_stimato}</div>
<p style="font-size:13px;color:#555;line-height:1.6;margin-top:8px">${d.motivazione_grado}</p>
<div class="prices">
<div class="pbox"><div class="plabel">Valore nuovo</div><div class="pval" style="color:#888">${d.valore_nuovo}</div></div>
<div class="pbox"><div class="plabel">Usato Grado A</div><div class="pval" style="color:#2e7d32">${d.valore_grado_a}</div></div>
<div class="pbox" style="border-color:${gc}"><div class="plabel">Il tuo dispositivo</div><div class="pval" style="color:${gc}">${d.valore_tuo}</div></div>
</div>
<div class="sec"><div class="stitle">Deprezzamenti</div>${(d.deprezzamenti||[]).map(x=>`<div class="item" style="border-color:#c62828">${x}</div>`).join("")}</div>
<div class="sec"><div class="stitle">Punti di forza</div>${(d.punti_forza||[]).map(x=>`<div class="item" style="border-color:#ff6a00">${x}</div>`).join("")}</div>
<div class="sec"><div class="stitle">Consigli vendita</div><p style="font-size:13px;color:#444;line-height:1.7">${d.consigli_vendita}</p></div>
<div class="footer">PriceCore by Mirko Tech Insider · ${now}</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `PriceCore_${d.modello.replace(/\s+/g, "_")}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  // STIMA LIVE con deprezzamenti in euro
  const stimaLive = () => {
    if (!data.modello) return null;
    let base = 400;
    if (data.modello.includes("16 Pro Max") || data.modello.includes("15 Pro Max")) base = 900;
    else if (data.modello.includes("16 Pro") || data.modello.includes("15 Pro")) base = 750;
    else if (data.modello.includes("14 Pro Max") || data.modello.includes("13 Pro Max")) base = 650;
    else if (data.modello.includes("14 Pro") || data.modello.includes("13 Pro")) base = 500;
    else if (data.modello.includes("Pro Max") || data.modello.includes("Ultra")) base = 400;
    else if (data.modello.includes("Pro") || data.modello.includes("Plus")) base = 350;
    else if (data.modello.includes("16") || data.modello.includes("15")) base = 550;
    else if (data.modello.includes("14")) base = 400;
    else if (data.modello.includes("13")) base = 300;
    else if (data.modello.includes("12")) base = 220;
    else if (data.modello.includes("11")) base = 170;
    else base = 250;
    
    if (data.gb === "256 GB") base += 60;
    if (data.gb === "512 GB") base += 150;
    if (data.gb === "1 TB") base += 250;
    
    if (data.acq?.includes("Ricondizionato")) base *= 0.9;
    
    // Deprezzamenti fissi in euro
    if (data.imei?.includes("No")) base -= 200;
    if (data.internet?.includes("No")) base -= 150;
    if (data.faceid?.includes("No")) base -= 80;
    if (data.batt?.includes("80-89")) base -= 40;
    if (data.batt?.includes("70-79")) base -= 70;
    if (data.batt?.includes("Meno")) base -= 100;
    if (data.schermo?.includes("Piccoli graffi") || data.schermo?.includes("graffi visibili")) base -= 30;
    if (data.schermo?.includes("Crepe")) base -= 150;
    if (data.scocca?.includes("segni lievi")) base -= 50;
    if (data.scocca?.includes("segni evidenti")) base -= 50;
    if (data.scocca?.includes("molto danneggiata")) base -= 120;
    if (data.altoparlante?.includes("basso")) base -= 15;
    if (data.altoparlante?.includes("Gracchia")) base -= 30;
    if (data.conn?.includes("intermittenti") || data.conn?.includes("parziali")) base -= 40;
    if (data.conn?.includes("Non funziona")) base -= 80;
    if (data.schedamadre?.includes("Sì")) base -= 80;
    
    if (data.danni?.includes("💧 Contatto con acqua")) base -= 100;
    if (data.danni?.includes("🔧 Scocca sostituita")) base -= 60;
    if (data.danni?.includes("🔘 Tasti laterali difettosi")) base -= 30;
    if (data.danni?.includes("🎙️ Microfono difettoso")) base -= 30;
    if (data.danni?.includes("📷 Fotocamera difettosa")) base -= 30;
    
    return Math.max(30, Math.round(base));
  };

  const liveValue = stimaLive();

  const Pill = ({ label, desc, color, selected, onClick }) => {
    const bc = selected ? (color || ORANGE) : LINE;
    const bg = selected ? (color ? color + "22" : ORANGE + "1a") : "#1a1a1a";
    return (
      <div onClick={onClick} style={{
        padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${bc}`, background: bg,
        color: selected ? "#fff" : "#aaa", cursor: "pointer", fontSize: 14, fontWeight: 500,
        transition: "all .2s", display: "flex", flexDirection: "column", gap: 4, marginBottom: 10,
        transform: selected ? "scale(1.01)" : "scale(1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 18, height: 18, borderRadius: "50%", border: `2px solid ${selected ? (color || ORANGE) : "#444"}`,
            flex: "0 0 auto", position: "relative", transition: "all .2s"
          }}>
            {selected && <div style={{ position: "absolute", inset: 3, borderRadius: "50%", background: color || ORANGE }} />}
          </div>
          <span style={{ fontWeight: 600 }}>{label}</span>
        </div>
        {desc && <span style={{ fontSize: 12.5, color: "#888", paddingLeft: 28, lineHeight: 1.4 }}>{desc}</span>}
      </div>
    );
  };

  const STEPS_DEF = [
    {
      title: "Modello del dispositivo",
      sub: "Seleziona il modello esatto per una valutazione precisa.",
      content: (
        <select value={data.modello || ""} onChange={e => update("modello", e.target.value)}
          style={{
            width: "100%", padding: "16px 18px", borderRadius: 12, border: `1.5px solid ${LINE}`,
            background: "#1a1a1a", color: "#fff", fontSize: 16, outline: "none", cursor: "pointer",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23ff6a00' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 18px center"
          }}>
          <option value="">Seleziona il modello</option>
          {MODELS.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      ),
      valid: () => !!data.modello
    },
    {
      title: "Capacità di archiviazione",
      sub: "Verifica la memoria in Impostazioni → Info.",
      content: ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"].map(c =>
        <Pill key={c} label={c} selected={data.gb === c} onClick={() => update("gb", c)} />
      ),
      valid: () => !!data.gb
    },
    {
      title: "Acquistato come",
      sub: "Il dispositivo era nuovo o ricondizionato al momento dell'acquisto?",
      content: [
        { label: "✅ Nuovo", color: "#4caf50" },
        { label: "🔄 Ricondizionato", color: ORANGE }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.acq === o.label} onClick={() => update("acq", o.label)} />),
      valid: () => !!data.acq
    },
    {
      title: "Il telefono legge l'IMEI?",
      sub: "Vai sul tastierino numerico e digita *#06# — deve apparire un codice.",
      content: [
        { label: "✅ Sì, mostra l'IMEI", color: "#4caf50" },
        { label: "❌ No, non appare nulla", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.imei === o.label} onClick={() => update("imei", o.label)} />),
      valid: () => !!data.imei
    },
    {
      title: "Il telefono si collega a internet?",
      sub: "Prova sia con Wi-Fi che con rete dati mobile.",
      content: [
        { label: "✅ Sì, si collega senza problemi", color: "#4caf50" },
        { label: "❌ No, non si collega", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.internet === o.label} onClick={() => update("internet", o.label)} />),
      valid: () => !!data.internet
    },
    {
      title: "Il Face ID funziona?",
      sub: "Prova a sbloccare il telefono con il riconoscimento facciale.",
      content: [
        { label: "✅ Sì, funziona correttamente", color: "#4caf50" },
        { label: "❌ No, non funziona", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.faceid === o.label} onClick={() => update("faceid", o.label)} />),
      valid: () => !!data.faceid
    },
    {
      title: "Stato della batteria",
      sub: "Controlla in Impostazioni → Batteria → Stato batteria.",
      content: [
        { label: "🟢 90–100%", color: "#4caf50" },
        { label: "🟡 80–89%", color: ORANGE },
        { label: "🟠 70–79%", color: "#ff9800" },
        { label: "🔴 Meno del 70%", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.batt === o.label} onClick={() => update("batt", o.label)} />),
      valid: () => !!data.batt
    },
    {
      title: "Condizione dello schermo",
      sub: "Controlla la presenza di graffi, crepe o segni di usura.",
      content: [
        { label: "✅ Perfetto, come nuovo", color: "#4caf50" },
        { label: "🔍 Piccoli graffi visibili", color: ORANGE },
        { label: "💥 Crepe o rotture evidenti", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.schermo === o.label} onClick={() => update("schermo", o.label)} />),
      valid: () => !!data.schermo
    },
    {
      title: "Segni sulla scocca",
      sub: "Ispeziona il retro e i lati del dispositivo.",
      content: [
        { label: "✅ Nessun danno (come nuova)", desc: "La scocca è integra, come appena uscita dalla scatola.", color: "#4caf50" },
        { label: "🔍 Scocca con segni lievi", desc: "Piccole ammaccature o graffi lievi appena visibili.", color: ORANGE },
        { label: "⚠️ Scocca con segni evidenti", desc: "Segni evidenti di cadute o graffi profondi.", color: "#ff9800" },
        { label: "💥 Scocca molto danneggiata o piegata", desc: "Deformazioni importanti, scocca visibilmente compromessa.", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} desc={o.desc} color={o.color} selected={data.scocca === o.label} onClick={() => update("scocca", o.label)} />),
      valid: () => !!data.scocca
    },
    {
      title: "Altoparlante superiore",
      sub: "Fai una chiamata di prova e ascolta la qualità dell'audio.",
      content: [
        { label: "✅ Si sente benissimo!", color: "#4caf50" },
        { label: "🔉 Si sente basso ma funziona", color: ORANGE },
        { label: "❌ Gracchia o non funzionante", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.altoparlante === o.label} onClick={() => update("altoparlante", o.label)} />),
      valid: () => !!data.altoparlante
    },
    {
      title: "Connettore di ricarica",
      sub: "Verifica che la ricarica funzioni con cavo originale.",
      content: [
        { label: "✅ Funziona perfettamente", color: "#4caf50" },
        { label: "⚠️ Problemi intermittenti", color: ORANGE },
        { label: "❌ Non funziona", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.conn === o.label} onClick={() => update("conn", o.label)} />),
      valid: () => !!data.conn
    },
    {
      title: "Lavori pregressi su scheda madre",
      sub: "Il telefono ha mai subito riparazioni o interventi sulla scheda madre?",
      content: [
        { label: "✅ No, mai aperto", color: "#4caf50" },
        { label: "⚠️ Sì, riparazioni pregresse", color: "#f44336" }
      ].map(o => <Pill key={o.label} label={o.label} color={o.color} selected={data.schedamadre === o.label} onClick={() => update("schedamadre", o.label)} />),
      valid: () => !!data.schedamadre
    },
    {
      title: "Altri danni",
      sub: "Seleziona tutto ciò che si applica al tuo dispositivo.",
      content: (() => {
        const opts = [
          { label: "💧 Contatto con acqua", color: "#f44336" },
          { label: "🔧 Scocca sostituita", color: "#f44336" },
          { label: "🔘 Tasti laterali difettosi", color: ORANGE },
          { label: "🎙️ Microfono difettoso", color: ORANGE },
          { label: "📷 Fotocamera difettosa", color: ORANGE },
          { label: "✅ Nessun altro danno", color: "#4caf50" }
        ];
        return opts.map(o => {
          const selected = (data.danni || []).includes(o.label);
          return (
            <div key={o.label} onClick={() => {
              const curr = data.danni || [];
              if (o.label.includes("Nessun")) {
                update("danni", curr.includes(o.label) ? [] : [o.label]);
              } else {
                const filtered = curr.filter(d => !d.includes("Nessun"));
                update("danni", filtered.includes(o.label) ? filtered.filter(d => d !== o.label) : [...filtered, o.label]);
              }
            }} style={{
              padding: "14px 18px", borderRadius: 12, border: `1.5px solid ${selected ? o.color : LINE}`,
              background: selected ? o.color + "22" : "#1a1a1a", color: selected ? "#fff" : "#aaa",
              cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all .2s",
              display: "flex", alignItems: "center", gap: 10, marginBottom: 10
            }}>
              <div style={{
                width: 18, height: 18, borderRadius: 4, border: `2px solid ${selected ? o.color : "#444"}`,
                flex: "0 0 auto", position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                background: selected ? o.color : "transparent", transition: "all .2s"
              }}>
                {selected && <span style={{ color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</span>}
              </div>
              {o.label}
            </div>
          );
        });
      })(),
      valid: () => (data.danni || []).length > 0
    }
  ];

  const currentStep = STEPS_DEF[step];
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  if (result) {
    const d = result;
    const gc = gradeColor(d.grado_stimato);
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

          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>
            <button onClick={back} style={{ background: "none", border: "none", color: "#fff", fontSize: 24, cursor: "pointer" }}>←</button>
            <b style={{ fontSize: 18 }}>Risultato valutazione</b>
          </div>

          <div style={{ background: `linear-gradient(135deg, ${CARD}, #1a1a1a)`, border: `2px solid ${gc}44`, borderRadius: 20, padding: 30, textAlign: "center", marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: MUTED, letterSpacing: 2, textTransform: "uppercase" }}>Il tuo dispositivo vale</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: gc, lineHeight: 1.1, margin: "10px 0", textShadow: `0 0 30px ${gc}44` }}>{d.valore_tuo}</div>
            <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, border: `1.5px solid ${gc}`, color: gc, fontWeight: 700, fontSize: 13, marginTop: 6 }}>Grado {d.grado_stimato}</div>
            <div style={{ fontSize: 13, color: "#aaa", marginTop: 16, lineHeight: 1.6 }}>{d.motivazione_grado}</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Valore nuovo</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#888" }}>{d.valore_nuovo}</div>
            </div>
            <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, textAlign: "center" }}>
              <div style={{ fontSize: 11, color: MUTED, marginBottom: 6 }}>Usato Grado A</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#4caf50" }}>{d.valore_grado_a}</div>
            </div>
          </div>

          <div style={{ background: CARD, border: "1px solid #3a1a1a", borderRadius: 14, padding: 18, marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#f44336", marginBottom: 12 }}>📉 Deprezzamenti</div>
            {(d.deprezzamenti || []).map((x, i) => <div key={i} style={{ fontSize: 13, color: "#ccc", marginBottom: 8, paddingLeft: 10, borderLeft: "2px solid #f44336", lineHeight: 1.5 }}>{x}</div>)}
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
        <p style={{ color: MUTED, fontSize: 14 }}>L'AI sta calcolando il valore del tuo dispositivo</p>
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
                <span style={{ color: ORANGE, fontWeight: 800, fontSize: 22 }}>{liveValue ? `€ ${liveValue}` : "-"}</span>
              </div>
            </div>
            {Object.keys(data).length > 0 && (
              <div style={{ background: CARD, border: `1px solid ${LINE}`, borderRadius: 14, padding: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Le tue risposte</div>
                {[
                  ["Modello", data.modello],
                  ["Capacità", data.gb],
                  ["Acquistato", data.acq],
                  ["IMEI", data.imei],
                  ["Internet", data.internet],
                  ["Face ID", data.faceid],
                  ["Batteria", data.batt],
                  ["Schermo", data.schermo],
                  ["Scocca", data.scocca],
                  ["Altoparlante", data.altoparlante],
                  ["Connettore", data.conn],
                  ["Scheda madre", data.schedamadre],
                  ["Altri danni", (data.danni || []).join(", ")]
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
            <div style={{
              background: CARD, border: `1px solid ${LINE}`, borderRadius: 18, padding: 30,
              opacity: fadeIn ? 1 : 0, transform: fadeIn ? "translateY(0)" : "translateY(15px)",
              transition: "all .4s ease"
            }}>
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
                }}>
                  {step === TOTAL_STEPS - 1 ? "💰 Valuta ora" : "Continua →"}
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
