async function fetchJSON(path: string) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

  const res = await fetch(`${base}${path}`, { cache: "no-store" });
  
  return res.json();
}

export default async function Home() {
  const [players, orgs, leagues, tournaments, matches] = await Promise.all([
    fetchJSON("/players"),
    fetchJSON("/organizations"),
    fetchJSON("/leagues"),
    fetchJSON("/tournaments"),
    fetchJSON("/matches"),
  ]);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section>
        <h2>Jogadores</h2>
        <ul>
          {players.slice(0, 10).map((p: any) => (
            <li key={p.UserID}>
              <strong>{p.Apelido}</strong> — {p.Nome_Completo} ({p.Cidade}) / {p.Jogo_1}{p.Jogo_2 ? `, ${p.Jogo_2}` : ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Organizações</h2>
        <ul>
          {orgs.slice(0, 10).map((o: any) => (
            <li key={o.OrgID}><strong>{o.Nome_da_Org}</strong> — {o.Cidade}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Ligas</h2>
        <ul>
          {leagues.slice(0, 10).map((l: any) => (
            <li key={l.LigaID}><strong>{l.Nome_da_Liga}</strong></li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Torneios</h2>
        <ul>
          {tournaments.slice(0, 10).map((t: any) => (
            <li key={t.TorneioID}><strong>{t.Nome_do_Torneio}</strong> — {t.Tipo} — {t.Jogos_Inclusos}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Partidas</h2>
        <ul>
          {matches.slice(0, 10).map((m: any) => (
            <li key={m.PartidaID}>
              {m.PartidaID} — {m.Jogo} ({m.Tipo_Partida}) | {m.Lado_A_ID} vs {m.Lado_B_ID} | {m.Score_A}x{m.Score_B} — vencedor {m.Vencedor_ID}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}