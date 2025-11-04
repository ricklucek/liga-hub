
"use client";
import { useEffect, useState } from "react";
import { apiBase } from "../lib/api";

export default function MainContent({ profile }) {
  
  const base = apiBase();

  const [data, setData] = useState(null);

  useEffect(() => {
    if (!profile) { setData(null); return; }
    let ctrl = new AbortController();
    async function fetchProfile() {
      let path = "";
      if (profile.type === "player") path = `/players/${profile.id}`;
      if (profile.type === "organization") path = `/organizations/${profile.id}`;
      if (profile.type === "league") path = `/leagues/${profile.id}`;
      const res = await fetch(base + path, { cache: "no-store", signal: ctrl.signal });
      if (res.ok) setData(await res.json());
      else setData({ error: "Não encontrado" });
    }
    fetchProfile();
    return () => ctrl.abort();
  }, [profile]);

  return (
    <div className="card" style={{ minHeight: 420 }}>
      <strong>Conteúdo Principal</strong>
      {!profile && <div style={{ opacity: .7, marginTop: 8 }}>Selecione um resultado à esquerda…</div>}
      {profile && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, opacity: .7, marginBottom: 8 }}>Tipo: {profile.type}</div>
          <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(data, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
