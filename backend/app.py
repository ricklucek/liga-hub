import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "esports")
DB_PASSWORD = os.getenv("DB_PASSWORD", "esports")
DB_NAME = os.getenv("DB_NAME", "esports")

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4", pool_pre_ping=True)

app = Flask(__name__)
CORS(app)

@app.get("/health")
def health():
    with engine.connect() as conn:
        res = conn.execute(text("SELECT 1")).scalar()
    return jsonify({"ok": True, "db": bool(res)})

# ---- Core Entities ----
@app.get("/players")
def get_players():
    q = request.args.get("q")
    sql = "SELECT UserID, Nome_Completo, Apelido, Cidade, Jogo_1, Jogo_2 FROM players"
    params = {}
    if q:
        sql += " WHERE Apelido LIKE :q OR Nome_Completo LIKE :q"
        params["q"] = f"%{q}%"
    with engine.connect() as conn:
        rows = conn.execute(text(sql), params).mappings().all()

    data = [{**obj} for obj in rows]

    return jsonify(data)

@app.get("/organizations")
def get_orgs():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT OrgID, Nome_da_Org, Cidade FROM organizations")).mappings().all()

    data = [{**obj} for obj in rows]

    return jsonify(data)

@app.get("/leagues")
def get_leagues():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT LigaID, Nome_da_Liga FROM leagues")).mappings().all()

    data = [{**obj} for obj in rows]

    return jsonify(data)

@app.get("/tournaments")
def get_tournaments():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT TorneioID, Nome_do_Torneio, Tipo, Jogos_Inclusos FROM tournaments")).mappings().all()

    data = [{**obj} for obj in rows]

    return jsonify(data)

@app.get("/matches")
def get_matches():
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT PartidaID, TorneioID, Jogo, Tipo_Partida, Lado_A_ID, Lado_B_ID, Score_A, Score_B, Vencedor_ID
            FROM matches
            ORDER BY PartidaID
        """)).mappings().all()

    data = [{**obj} for obj in rows]

    return jsonify(data)

# Simple player by id
@app.get("/players/<player_id>")
def get_player(player_id):
    with engine.connect() as conn:
        row = conn.execute(text("""
            SELECT UserID, Nome_Completo, Apelido, Cidade, Jogo_1, Jogo_2 FROM players WHERE UserID=:id
        """), {"id": player_id}).mappings().first()
        if not row: 
            return jsonify({"error":"not found"}), 404
    

    return jsonify(dict(**row))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)