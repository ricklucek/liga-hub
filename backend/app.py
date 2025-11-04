
import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from sqlalchemy import create_engine, text

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


from sqlalchemy import text

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
    return jsonify([{**data} for data in rows])

@app.get("/players/<player_id>")
def get_player(player_id):
    with engine.connect() as conn:
        row = conn.execute(text("SELECT UserID, Nome_Completo, Apelido, Cidade, Jogo_1, Jogo_2 FROM players WHERE UserID=:id"), {"id": player_id}).mappings().first()
        if not row: 
            return jsonify({"error":"not found"}), 404
    return jsonify(dict(row))

@app.get("/organizations")
def get_orgs():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT OrgID, Nome_da_Org, Cidade FROM organizations")).mappings().all()
    return jsonify([{**data} for data in rows])

@app.get("/organizations/<org_id>")
def get_org(org_id):
    with engine.connect() as conn:
        row = conn.execute(text("SELECT OrgID, Nome_da_Org, Cidade FROM organizations WHERE OrgID=:id"), {"id": org_id}).mappings().first()
        if not row:
            return jsonify({"error":"not found"}), 404
    return jsonify(dict(row))

@app.get("/leagues")
def get_leagues():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT LigaID, Nome_da_Liga FROM leagues")).mappings().all()
    return jsonify([{**data} for data in rows])

@app.get("/leagues/<liga_id>")
def get_league(liga_id):
    with engine.connect() as conn:
        row = conn.execute(text("SELECT LigaID, Nome_da_Liga FROM leagues WHERE LigaID=:id"), {"id": liga_id}).mappings().first()
        if not row:
            return jsonify({"error":"not found"}), 404
    return jsonify(dict(row))

@app.get("/tournaments")
def get_tournaments():
    with engine.connect() as conn:
        rows = conn.execute(text("SELECT TorneioID, Nome_do_Torneio, Tipo, Jogos_Inclusos FROM tournaments")).mappings().all()
    return jsonify([{**data} for data in rows])

@app.get("/tournaments/<torneio_id>")
def get_tournament(torneio_id):
    with engine.connect() as conn:
        row = conn.execute(text("SELECT TorneioID, Nome_do_Torneio, Tipo, Jogos_Inclusos FROM tournaments WHERE TorneioID=:id"), {"id": torneio_id}).mappings().first()
        if not row:
            return jsonify({"error":"not found"}), 404
    return jsonify(dict(row))

@app.get("/matches")
def get_matches():
    with engine.connect() as conn:
        rows = conn.execute(text("""
            SELECT PartidaID, TorneioID, Jogo, Tipo_Partida, Lado_A_ID, Lado_B_ID, Score_A, Score_B, Vencedor_ID
            FROM matches
            ORDER BY PartidaID
        """)).mappings().all()
    return jsonify([{**data} for data in rows])

@app.get("/search")
def search():
    scope = request.args.get("scope", "players")
    q = request.args.get("q", "").strip()
    if scope == "players":
        sql = "SELECT UserID as id, Apelido as title, Nome_Completo as subtitle, 'player' as type FROM players"
        where = " WHERE Apelido LIKE :q OR Nome_Completo LIKE :q" if q else ""
    elif scope == "organizations":
        sql = "SELECT OrgID as id, Nome_da_Org as title, Cidade as subtitle, 'organization' as type FROM organizations"
        where = " WHERE Nome_da_Org LIKE :q" if q else ""
    elif scope == "leagues":
        sql = "SELECT LigaID as id, Nome_da_Liga as title, '' as subtitle, 'league' as type FROM leagues"
        where = " WHERE Nome_da_Liga LIKE :q" if q else ""
    else:
        return jsonify([])
    params = {"q": f"%{q}%"} if q else {}
    with engine.connect() as conn:
        rows = conn.execute(text(sql + where + " LIMIT 50"), params).mappings().all()
    return jsonify([{**data} for data in rows])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
