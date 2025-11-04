
"use client";
import { useState } from "react";

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  return (
    <div className="card" style={{ position: "relative" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <strong>Usuário</strong>
        <button className="btn" onClick={() => setOpen(!open)}>☰</button>
      </div>
      {open && (
        <div style={{ position:"absolute", right:12, top:42, background:"#fff", border:"1px solid #eee", borderRadius:10, padding:8, zIndex:10 }}>
          <div className="result-item">Adicionar Conta</div>
          <div className="result-item">Editar Perfil</div>
          <div className="result-item">Sair</div>
        </div>
      )}
    </div>
  );
}
