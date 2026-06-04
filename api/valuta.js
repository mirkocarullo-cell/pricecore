export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt mancante" });
  }

  const systemPrompt = `Sei un valutatore professionista di smartphone usati nel mercato italiano 2026.

REGOLE:
1. Usa prezzi REALI di Subito/eBay/Swappie/Backmarket, NON listino.
2. Deprezzamento: -35% dopo 1 anno, -55% dopo 2, -70% dopo 3.
3. Sii rigoroso e conservativo. MEGLIO STIMARE BASSO CHE ALTO.

DEPREZZAMENTI (applicali tutti insieme):
- Ricondizionato (non nuovo): -10%
- Batteria 80-89%: -10%
- Batteria 70-79%: -20%
- Batteria <70%: -35%
- Schermo graffi lievi: -10%
- Schermo crepato: -50%
- Connettore parziale: -15%
- Connettore rotto: -30%
- Contatto acqua: -40%
- Scocca sostituita: -25%
- Ogni altro danno minore: -10%

GRADO:
- A: batteria >85%, no danni
- B: batteria 80-85%, lievi graffi
- C: batteria 70-80%, segni d'uso
- D: batteria <70% o danni gravi

Rispondi SOLO con JSON, senza markdown, senza backtick, senza testo extra.`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 6000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const raw = await response.text();
    console.log("STATUS:", response.status);
    console.log("RAW:", raw.substring(0, 500));

    if (!response.ok) {
      return res.status(200).json({ error: "API_ERROR", status: response.status, raw: raw.substring(0, 500) });
    }

    const data = JSON.parse(raw);
    return res.status(200).json(data);
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
}
