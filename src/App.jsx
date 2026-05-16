import { useState } from "react";

const ORANGE = "#ff6a00";

function Badge({ children }) {
  return <span style={{ fontSize: 11, background: ORANGE, padding: "3px 10px", borderRadius: 20, fontWeight: 700, display: "inline-block", color: "#fff" }}>{children}</span>;
}

function Card({ children, borderColor = "#222", style = {} }) {
  return <div style={{ background: "#141414", border: `1px solid ${borderColor}`, borderRadius: 14, padding: 18, marginBottom: 14, ...style }}>{children}</div>;
}

function SecTitle({ children, color = "#888" }) {
  return <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color, marginBottom: 12 }}>{children}</div>;
}

function Item({ children, color = ORANGE }) {
  return <div style={{ fontSize: 13, color: "#ccc", marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${color}`, lineHeight: 1.5 }}>{children}</div>;
}

function OptGroup({ options, multi = false, selected, onSelect }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
      {options.map(({ label, color }) => {
        const isSelected = multi ? selected.includes(label) : selected === label;
        const bc = isSelected ? (color || ORANGE) : "#2a2a2a";
        const bg = isSelected ? (color ? color + "22" : ORANGE + "22") : "#1a1a1a";
        return (
          <span key={label} onClick={() => onSelect(label)}
            style={{ padding: "10px 16px", borderRadius: 10, border: `1px solid ${bc}`, background: bg, color: isSelected ? "#fff" : "#888", fontSize: 14, cursor: "pointer" }}>
            {label}
          </span>
        );
      })}
    </div>
  );
}

function Progress({ step }) {
  return (
    <div style={{ display: "flex", gap: 4, marginBottom: 24 }}>
      {[1, 2, 3].map(i => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 4, background: i <= step ? ORANGE : "#222" }} />
      ))}
    </div>
  );
}

const LABEL = { fontSize: 12, color: "#666", textTransform: "uppercase", letterSpacing: ".8px", marginBottom: 8, marginTop: 18, display: "block" };

export default function PriceCore() {
  const [step, setStep] = useState(1);
  const [modello, setModello] = useState("");
  const [gb, setGb] = useState("");
  const [acq, setAcq] = useState("");
  const [batt, setBatt] = useState("");
  const [schermo, setSchermo] = useState("");
  const [conn, setConn] = useState("");
  const [danni, setDanni] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const toggleDanno = (label) => {
    if (label.includes("Nessun")) {
      setDanni(danni.includes(label) ? [] : [label]);
    } else {
      setDanni(prev => {
        const filtered = prev.filter(d => !d.includes("Nessun"));
        return filtered.includes(label) ? filtered.filter(d => d !== label) : [...filtered, label];
      });
    }
  };

  const gradeColor = (g = "") => g.includes("A") ? "#4caf50" : g.includes("B") ? ORANGE : "#f44336";

  const goStep = (n) => {
    if (n === 2 && !modello.trim()) { alert("Inserisci il modello"); return; }
    if (n === 2 && !gb) { alert("Seleziona lo storage"); return; }
    if (n === 3 && !batt) { alert("Seleziona stato batteria"); return; }
    if (n === 3 && !schermo) { alert("Seleziona stato schermo"); return; }
    if (n === 3 && !conn) { alert("Seleziona stato connettore"); return; }
    setStep(n);
    window.scrollTo(0, 0);
  };

  const valuta = async () => {
    const danniStr = danni.length ? danni.join(", ") : "Nessun altro danno";
    setLoading(true); setResult(null); setError(""); setStep(4);

    const prompt = `Sei un esperto di smartphone ricondizionati. Valuta questo dispositivo usato.
Dati: Modello: ${modello}, Storage: ${gb}, Batteria: ${batt}, Schermo: ${schermo}, Connettore: ${conn}, Altri danni: ${danniStr}, Acquistato: ${acq || "Nuovo"}.
Rispondi SOLO con JSON valido, nessun testo extra, nessun backtick.
{"modello":"nome completo","anno":"anno uscita","storage":"${gb}","valore_nuovo":"euro","valore_grado_a":"euro","valore_tuo":"euro","grado_stimato":"A o B o C","motivazione_grado":"2 righe","deprezzamenti":["motivo con impatto euro"],"punti_forza":["punto"],"consigli_vendita":"2-3 consigli","copy_annuncio":"4 righe italiano persuasivo"}`;

    try {
      const res = await fetch("/api/valuta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      const text = (data.content || []).find(b => b.type === "text")?.text || "";
      setResult(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch (e) {
      setError("Errore: " + e.message);
    }
    setLoading(false);
  };

  const scaricaPDF = () => {
    const d = result; if (!d) return;
    const gc = gradeColor(d.grado_stimato);
    const now = new Date().toLocaleDateString("it-IT");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;padding:40px;max-width:700px;margin:0 auto;color:#111}h1{font-size:22px;margin-bottom:4px}.sub{color:#666;font-size:13px;margin-bottom:30px}.badge{display:inline-block;background:#ff6a00;color:#fff;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:700;margin-bottom:10px}.grade{display:inline-block;padding:6px 16px;border-radius:20px;border:2px solid ${gc};color:${gc};font-weight:700;font-size:14px;margin:10px 0}.prices{display:flex;gap:16px;margin:20px 0}.pbox{flex:1;border:1px solid #ddd;border-radius:10px;padding:14px;text-align:center}.plabel{font-size:11px;color:#888;margin-bottom:6px}.pval{font-size:18px;font-weight:800}.sec{margin:20px 0}.stitle{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#666;margin-bottom:10px}.item{padding:6px 10px;border-left:3px solid #ddd;margin-bottom:6px;font-size:13px}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#999;text-align:center}</style></head><body>
<div class="badge">🔶 PriceCore — Valutazione Dispositivo</div>
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
<div class="footer">PriceCore by Mirko Tech Insider · ${now} · Valori indicativi di mercato</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `PriceCore_${d.modello.replace(/\s+/g, "_")}.html`; a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => { setStep(1); setModello(""); setGb(""); setAcq(""); setBatt(""); setSchermo(""); setConn(""); setDanni([]); setResult(null); setError(""); };

  const Btn = ({ children, onClick, outline = false, disabled = false }) => (
    <button onClick={onClick} disabled={disabled} style={{ width: "100%", padding: 14, borderRadius: 12, border: outline ? "1px solid #333" : "none", background: disabled ? "#222" : outline ? "transparent" : ORANGE, color: outline ? "#aaa" : "#fff", fontWeight: 700, fontSize: 15, cursor: disabled ? "not-allowed" : "pointer", marginTop: 10 }}>
      {children}
    </button>
  );

  return (
    <div style={{ background: "#0a0a0a", color: "#f0f0f0", minHeight: "100vh", padding: "24px 16px", fontFamily: "-apple-system, sans-serif" }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: ORANGE, textTransform: "uppercase", marginBottom: 4 }}>Mirko Tech Insider</div>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: -1, margin: 0 }}>Price<span style={{ color: ORANGE }}>Core</span></h1>
          <p style={{ color: "#555", fontSize: 13, marginTop: 6 }}>Scopri il valore reale del tuo dispositivo</p>
        </div>

        {step === 1 && (
          <div>
            <Progress step={1} />
            <label style={LABEL}>Modello dispositivo</label>
            <input value={modello} onChange={e => setModello(e.target.value)} placeholder="Es. iPhone 13 Pro, Samsung S22..."
              style={{ width: "100%", padding: "13px 14px", borderRadius: 10, border: "1px solid #2a2a2a", background: "#141414", color: "#fff", fontSize: 15, outline: "none" }} />
            <label style={LABEL}>Spazio di archiviazione</label>
            <OptGroup options={["64 GB","128 GB","256 GB","512 GB","1 TB"].map(l => ({ label: l }))} selected={gb} onSelect={setGb} />
            <label style={LABEL}>Acquistato da</label>
            <OptGroup options={[{ label: "✅ Nuovo", color: "#4caf50" }, { label: "🔄 Ricondizionato", color: ORANGE }]} selected={acq} onSelect={setAcq} />
            <Btn onClick={() => goStep(2)}>Avanti →</Btn>
          </div>
        )}

        {step === 2 && (
          <div>
            <Progress step={2} />
            <label style={LABEL}>Stato batteria</label>
            <OptGroup options={[{ label: "🟢 90–100%", color: "#4caf50" }, { label: "🟡 80–89%", color: "#4caf50" }, { label: "🟠 70–79%", color: ORANGE }, { label: "🔴 <70%", color: "#f44336" }]} selected={batt} onSelect={setBatt} />
            <label style={LABEL}>Schermo</label>
            <OptGroup options={[{ label: "✅ Perfetto", color: "#4caf50" }, { label: "🔍 Graffi lievi", color: ORANGE }, { label: "💥 Crepe / Rotture", color: "#f44336" }]} selected={schermo} onSelect={setSchermo} />
            <label style={LABEL}>Connettore di ricarica</label>
            <OptGroup options={[{ label: "✅ Funzionante", color: "#4caf50" }, { label: "⚠️ Problemi parziali", color: ORANGE }, { label: "❌ Non funziona", color: "#f44336" }]} selected={conn} onSelect={setConn} />
            <Btn onClick={() => goStep(3)}>Avanti →</Btn>
            <Btn outline onClick={() => setStep(1)}>← Indietro</Btn>
          </div>
        )}

        {step === 3 && (
          <div>
            <Progress step={3} />
            <label style={LABEL}>Altri danni (seleziona tutti quelli presenti)</label>
            <OptGroup multi options={[{ label: "💧 Contatto con acqua", color: "#f44336" }, { label: "🔧 Scocca sostituita", color: "#f44336" }, { label: "🔘 Tasti laterali difettosi", color: ORANGE }, { label: "🔊 Altoparlante difettoso", color: ORANGE }, { label: "🎙️ Microfono difettoso", color: ORANGE }, { label: "✅ Nessun altro danno", color: "#4caf50" }]} selected={danni} onSelect={toggleDanno} />
            <Btn onClick={valuta}>💰 Valuta il mio dispositivo</Btn>
            <Btn outline onClick={() => setStep(2)}>← Indietro</Btn>
          </div>
        )}

        {step === 4 && (
          <div>
            {loading && <div style={{ textAlign: "center", padding: 60, color: "#555" }}>⚙️<br /><br />Calcolo in corso...</div>}
            {error && <div style={{ background: "#1a0a0a", border: "1px solid #f44336", borderRadius: 10, padding: 16, color: "#f44336" }}>{error}</div>}
            {result && (() => {
              const d = result;
              const gc = gradeColor(d.grado_stimato);
              return (
                <div>
                  <Card style={{ background: "#111", borderColor: ORANGE + "44" }}>
                    <Badge>{d.anno} · {d.storage}</Badge>
                    <div style={{ fontSize: 20, fontWeight: 800, margin: "8px 0 4px" }}>{d.modello}</div>
                    <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, border: `1px solid ${gc}`, color: gc, fontWeight: 700, fontSize: 14, marginTop: 8 }}>
                      Grado stimato: {d.grado_stimato}
                    </div>
                    <div style={{ fontSize: 13, color: "#777", marginTop: 10, lineHeight: 1.6 }}>{d.motivazione_grado}</div>
                  </Card>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 14 }}>
                    {[["Valore nuovo", d.valore_nuovo, "#555"], ["Usato Grado A", d.valore_grado_a, "#4caf50"], ["Il tuo valore", d.valore_tuo, gc]].map(([l, v, c]) => (
                      <div key={l} style={{ background: "#141414", border: "1px solid #222", borderRadius: 10, padding: "14px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 10, color: "#555", marginBottom: 6 }}>{l}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <Card borderColor="#3a1a1a">
                    <SecTitle color="#f44336">📉 Deprezzamenti</SecTitle>
                    {(d.deprezzamenti || []).map((x, i) => <Item key={i} color="#f44336">{x}</Item>)}
                  </Card>
                  <Card borderColor={ORANGE + "44"}>
                    <SecTitle color={ORANGE}>✅ Punti di forza</SecTitle>
                    {(d.punti_forza || []).map((x, i) => <Item key={i} color={ORANGE}>{x}</Item>)}
                  </Card>
                  <Card borderColor="#2a2a1a">
                    <SecTitle color="#ffb74d">💡 Consigli vendita</SecTitle>
                    <p style={{ fontSize: 13, color: "#bbb", lineHeight: 1.7 }}>{d.consigli_vendita}</p>
                  </Card>
                  <Card borderColor="#1a1a2a">
                    <SecTitle color="#aaa">✍️ Copy annuncio</SecTitle>
                    <p style={{ fontSize: 14, color: "#ddd", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{d.copy_annuncio}</p>
                  </Card>
                  <Btn onClick={scaricaPDF}>📄 Scarica PDF</Btn>
                  <Btn outline onClick={reset}>🔄 Nuova valutazione</Btn>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
