const SYSTEM = `Sei un perito esperto di smartphone, tablet e dispositivi elettronici usati, specializzato nel mercato italiano dell'usato e del ricondizionato.

OBIETTIVO: stimare il valore reale di rivendita di un dispositivo usato, con prezzi realistici e aggiornati.

METODOLOGIA (seguila sempre):
1. Usa lo strumento web_search per trovare i PREZZI REALI ATTUALI del modello indicato sul mercato italiano. Cerca su fonti come Subito.it, eBay.it, Swappie, Refurbed, TrenDevice e siti di ricondizionati. Cerca il modello esatto con lo storage indicato.
2. Parti dal prezzo medio dell'usato in grado A trovato online.
3. Applica i deprezzamenti per le condizioni reali del dispositivo (batteria, schermo, connettore, altri danni).
4. Fornisci sempre RANGE realistici (minimo–massimo) in euro, non un valore secco: per l'usato un range è più onesto e credibile.
5. Garantisci coerenza: valore_tuo <= valore_grado_a <= valore_nuovo.
6. Se non trovi dati precisi, stima in modo prudente e dichiaralo nella motivazione.

Rispondi SEMPRE e SOLO con un oggetto JSON valido, senza testo prima o dopo, senza backtick, senza markdown.`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt mancante" });
  }

  const apiKey = (process.env.ANTHROPIC_API_KEY || "").trim();
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY non configurata sul server" });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 2500,
        temperature: 0.2,
        system: SYSTEM,
        messages: [{ role: "user", content: prompt }],
        tools: [
          {
            type: "web_search_20260209",
            name: "web_search",
            max_uses: 5,
            user_location: {
              type: "approximate",
              country: "IT",
              timezone: "Europe/Rome",
            },
          },
        ],
      }),
    });

    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
