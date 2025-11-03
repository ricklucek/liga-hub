import os
import pandas as pd
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "esports")
DB_PASSWORD = os.getenv("DB_PASSWORD", "esports")
DB_NAME = os.getenv("DB_NAME", "esports")

engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4", pool_pre_ping=True)

def run_sql_file(path):
    with engine.connect() as conn:
        with open(path, "r", encoding="utf-8") as f:
            statements = f.read().split(";")
            for stmt in statements:
                s = stmt.strip()
                if s:
                    conn.execute(text(s))
        conn.commit()

def df_to_table(df, table):
    df.to_sql(table, engine, if_exists="append", index=False, method="multi", chunksize=1000)

def seed():
    print("Creating tables...")
    run_sql_file("models.sql")

    print("Loading CSVs from ./data ...")
    players = pd.read_csv("data/competidores.csv")
    orgs = pd.read_csv("data/organizacoes.csv")
    leagues = pd.read_csv("data/ligas.csv")
    tournaments = pd.read_csv("data/torneios.csv")
    matches = pd.read_csv("data/partidas.csv")
    comp_org = pd.read_csv("data/competidor_organizacao.csv")
    tor_league = pd.read_csv("data/torneio_liga.csv")

    # Rename to match SQL table names/columns if needed (assumes same headers as docs)
    players.to_sql("players", engine, if_exists="append", index=False)
    orgs.to_sql("organizations", engine, if_exists="append", index=False)
    leagues.to_sql("leagues", engine, if_exists="append", index=False)
    tournaments.to_sql("tournaments", engine, if_exists="append", index=False)
    matches.to_sql("matches", engine, if_exists="append", index=False)
    comp_org.to_sql("competitor_org", engine, if_exists="append", index=False)
    tor_league.to_sql("tournament_league", engine, if_exists="append", index=False)

    print("Seed finished.")

if __name__ == "__main__":
    seed()