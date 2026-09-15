export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt mancante" });
  }

  const systemPrompt = `Sei un valutatore professionista di smartphone usati nel mercato italiano 2026.

Il tuo compito è fornire SOLO il valore di mercato REALE, non il listino:
- valore_nuovo: prezzo medio del dispositivo NUOVO oggi (o all'uscita se fuori produzione)
- valore_grado_a: prezzo REALE a cui si vende oggi un esemplare in condizioni PERFETTE (grado A) su Subito, eBay, Swappie, Backmarket, Refurbed in Italia

IMPORTANTE: NON applicare tu i deprezzamenti per i difetti. Ci pensa il sistema.
Sii CONSERVATIVO sul valore grado A: usa il prezzo realistico di vendita rapida, non quello ottimistico.
Curva di deprezzamento: -35% dopo 1 anno, -55% dopo 2 anni, -70% dopo 3 anni, -80% dopo 4 anni.

Rispondi SOLO con JSON valido, senza markdown, senza backtick, senza testo extra.`;

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
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const raw = await response.text();
    if (!response.ok) {
      return res.status(200).json({ error: "API_ERROR", status: response.status, raw: raw.substring(0, 300) });
    }
    return res.status(200).json(JSON.parse(raw));
  } catch (error) {
    return res.status(200).json({ error: error.message });
  }
}
