import { sql } from "@vercel/postgres";

export default async function handler(req, res) {
  const pass = req.headers["x-dashboard-password"] || (req.query && req.query.pass);
  if (!process.env.DASHBOARD_PASSWORD || pass !== process.env.DASHBOARD_PASSWORD) {
    return res.status(401).json({ error: "Password errata" });
  }

  try {
    await sql`CREATE TABLE IF NOT EXISTS valutazioni (
      id SERIAL PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT now(),
      modello TEXT,
      storage TEXT,
      batteria TEXT,
      schermo TEXT,
      connettore TEXT,
      danni TEXT,
      acquisto TEXT,
      grado TEXT,
      valore_tuo TEXT,
      valore_tuo_num NUMERIC
    )`;

    const total = (await sql`SELECT count(*)::int AS n FROM valutazioni`).rows[0].n;
    const last7 = (await sql`SELECT count(*)::int AS n FROM valutazioni WHERE created_at > now() - interval '7 days'`).rows[0].n;
    const last30 = (await sql`SELECT count(*)::int AS n FROM valutazioni WHERE created_at > now() - interval '30 days'`).rows[0].n;
    const avg = (await sql`SELECT round(avg(valore_tuo_num))::int AS n FROM valutazioni WHERE valore_tuo_num IS NOT NULL`).rows[0].n;
    const topModels = (await sql`SELECT modello, count(*)::int AS n FROM valutazioni WHERE modello IS NOT NULL GROUP BY modello ORDER BY n DESC LIMIT 8`).rows;
    const grades = (await sql`SELECT grado, count(*)::int AS n FROM valutazioni WHERE grado IS NOT NULL GROUP BY grado ORDER BY grado`).rows;
    const perDay = (await sql`SELECT to_char(created_at::date, 'DD/MM') AS giorno, count(*)::int AS n FROM valutazioni WHERE created_at > now() - interval '30 days' GROUP BY created_at::date ORDER BY created_at::date`).rows;

    return res.status(200).json({ total, last7, last30, avg, topModels, grades, perDay });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
