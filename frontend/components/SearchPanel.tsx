
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem } from "./ui/select";
import { apiBase } from "../lib/api";
import { Skeleton } from "./ui/skeleton";

export default function SearchPanel({ onOpenProfile }){
  const base = apiBase();
  const [scope, setScope] = useState("players");
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    let ctrl = new AbortController();
    async function run(){
      setLoading(true);
      try {
        const url = new URL("/search", base);
        url.searchParams.set("scope", scope);
        if (q) url.searchParams.set("q", q);
        const res = await fetch(url.toString(), { cache: "no-store", signal: ctrl.signal });
        const data = await res.json();
        setResults(data);
      } catch(e){ /* ignore */ }
      setLoading(false);
    }
    run();
    return ()=>ctrl.abort();
  }, [scope, q]);

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Modo Atual</CardTitle>
          <span className="badge">Searchbox</span>
        </CardHeader>
        <CardContent className="grid gap-3">
          <Select value={scope} onValueChange={setScope}>
            <SelectTrigger />
            <SelectContent>
              <SelectItem value="players">Competidor</SelectItem>
              <SelectItem value="organizations">Organização</SelectItem>
              <SelectItem value="leagues">Liga</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Input placeholder="Buscar..." value={q} onChange={(e)=>setQ(e.target.value)} />
            <Button onClick={()=>setQ(q)}>Buscar</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Resultados</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          {loading && <div className="grid gap-2"><Skeleton className="h-10"/><Skeleton className="h-10"/><Skeleton className="h-10"/></div>}
          {!loading && results.map(r => (
            <div key={r.id} className="result-item" onClick={()=>onOpenProfile({ id:r.id, type:r.type })}>
              <div className="font-medium">{r.title}</div>
              {r.subtitle && <div className="text-xs text-slate-500">{r.subtitle}</div>}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
