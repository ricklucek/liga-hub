
"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { apiBase } from "../lib/api";

export default function MainContent({ profile }){
  const base = apiBase();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    if (!profile){ setData(null); return; }
    let ctrl = new AbortController();
    async function load(){
      setLoading(true);
      try {
        let path = "";
        if (profile.type === "player") path = `/players/${profile.id}`;
        if (profile.type === "organization") path = `/organizations/${profile.id}`;
        if (profile.type === "league") path = `/leagues/${profile.id}`;
        const res = await fetch(base + path, { cache: "no-store", signal: ctrl.signal });
        const json = await res.json();
        setData(json);
      } catch(e){ setData({ error: "Falha ao carregar" }); }
      setLoading(false);
    }
    load();
    return ()=>ctrl.abort();
  }, [profile]);

  return (
    <Card className="min-h-[420px]">
      <CardHeader><CardTitle>Conteúdo Principal</CardTitle></CardHeader>
      <CardContent>
        {!profile && <div className="text-slate-500">Selecione um resultado à esquerda…</div>}
        {profile && loading && <div className="grid gap-2"><Skeleton className="h-6 w-48"/><Skeleton className="h-4 w-full"/><Skeleton className="h-4 w-3/4"/></div>}
        {profile && !loading && <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>}
      </CardContent>
    </Card>
  );
}
