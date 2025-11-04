
"use client";
import { useEffect, useState } from "react";
import { apiBase } from "../lib/api";

export default function SearchPanel({ onOpenProfile }) {
  const [scope, setScope] = useState("players");
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const base = apiBase();

  useEffect(() => {
    let ctrl = new AbortController();
    async function run() {
      try {
        const url = new URL("/search", base);
        url.searchParams.set("scope", scope);
        if (q) url.searchParams.set("q", q);
        const res = await fetch(url.toString(), { cache: "no-store", signal: ctrl.signal });
        const data = await res.json();
        setResults(data);
      } catch (e) {
        if (e.name !== "AbortError") console.error(e);
      }
    }
    run();
    return () => ctrl.abort();
  }, [scope, q]);

  return (
    <div className="left">
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <strong>Modo Atual</strong><span className="badge">Searchbox</span>
        </div>
        <div className="searchbox">
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="players">Competidor</option>
            <option value="organizations">Organização</option>
            <option value="leagues">Liga</option>
          </select>
          <input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>
      <div className="card">
        <strong style={{ display: "block", marginBottom: 8 }}>Resultados</strong>
        <ul className="list">
          {results.map((r) => (
            <li className="result-item" key={r.id} onClick={() => onOpenProfile({ id: r.id, type: r.type })}>
              <div><strong>{r.title}</strong></div>
              <div style={{ fontSize: 12, opacity: .7 }}>{r.subtitle}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
