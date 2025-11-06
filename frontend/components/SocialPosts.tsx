
"use client";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export default function SocialPosts(){
  const posts = [
    { id: "p1", author: "Liga XPTO", text: "Novo torneio anunciado!" },
    { id: "p2", author: "Org Alpha", text: "Bem-vindo ao nosso novo player!" },
  ];
  return (
    <Card>
      <CardHeader><CardTitle>Social Posts</CardTitle></CardHeader>
      <CardContent className="grid gap-2">
        {posts.map(p => (
          <div key={p.id} className="result-item">
            <div className="text-sm"><strong>{p.author}</strong></div>
            <div className="text-sm text-slate-600">{p.text}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
