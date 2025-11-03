# Esports MVP (Next.js + Flask 3.8 + MySQL on Docker)

## Subir tudo
```bash
docker compose up --build
```

Acesse:
- Backend: http://localhost:5000/health
- Frontend: http://localhost:3000

## Como carregar os CSVs
1) Coloque seus CSVs em `backend/data/` com os nomes:

```
competidores.csv
organizacoes.csv
ligas.csv
torneios.csv
partidas.csv
competidor_organizacao.csv
torneio_liga.csv
```

2) Rode o seed (em outro terminal):
```bash
docker compose exec backend python seed_from_csv.py
```

## Notas
- O schema em `backend/models.sql` replica as entidades descritas nos CSVs.
- O backend expõe endpoints REST simples: /players, /organizations, /leagues, /tournaments, /matches.
- O frontend (Next 16 App Router) lista os dados de forma simples.