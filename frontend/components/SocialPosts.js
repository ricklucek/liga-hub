
"use client";
import { useEffect, useState } from "react";

export default function SocialPosts() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    setPosts([
      { id: "p1", author: "Liga XPTO", text: "Novo torneio anunciado!" },
      { id: "p2", author: "Org Alpha", text: "Bem-vindo ao nosso novo player!" },
    ]);
  }, []);

  return (
    <div className="card">
      <strong>Social Posts</strong>
      <ul className="list" style={{ marginTop:8 }}>
        {posts.map((p)=> (
          <li key={p.id} className="result-item">
            <div><strong>{p.author}</strong></div>
            <div style={{ fontSize:14 }}>{p.text}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
