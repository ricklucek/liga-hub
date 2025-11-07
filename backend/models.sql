CREATE TABLE IF NOT EXISTS players (
  UserID VARCHAR(36) PRIMARY KEY,
  Nome_Completo VARCHAR(255),
  Apelido VARCHAR(255),
  Cidade VARCHAR(255),
  Jogo_1 VARCHAR(100),
  Jogo_2 VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret VARCHAR(32),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organizations (
  OrgID VARCHAR(36) PRIMARY KEY,
  Nome_da_Org VARCHAR(255),
  Cidade VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS leagues (
  LigaID VARCHAR(36) PRIMARY KEY,
  Nome_da_Liga VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS tournaments (
  TorneioID VARCHAR(36) PRIMARY KEY,
  Nome_do_Torneio VARCHAR(255),
  Tipo VARCHAR(50),
  Jogos_Inclusos TEXT
);

CREATE TABLE IF NOT EXISTS matches (
  PartidaID VARCHAR(36) PRIMARY KEY,
  TorneioID VARCHAR(36),
  Jogo VARCHAR(100),
  Tipo_Partida VARCHAR(50),
  Lado_A_ID VARCHAR(36),
  Lado_B_ID VARCHAR(36),
  Score_A INT,
  Score_B INT,
  Vencedor_ID VARCHAR(36),
  FOREIGN KEY (TorneioID) REFERENCES tournaments(TorneioID)
);

CREATE TABLE IF NOT EXISTS competitor_org (
  UserID VARCHAR(36),
  OrgID VARCHAR(36),
  Permissao VARCHAR(50),
  PRIMARY KEY (UserID, OrgID),
  FOREIGN KEY (UserID) REFERENCES players(UserID),
  FOREIGN KEY (OrgID) REFERENCES organizations(OrgID)
);

CREATE TABLE IF NOT EXISTS tournament_league (
  TorneioID VARCHAR(36),
  LigaID VARCHAR(36),
  PRIMARY KEY (TorneioID, LigaID),
  FOREIGN KEY (TorneioID) REFERENCES tournaments(TorneioID),
  FOREIGN KEY (LigaID) REFERENCES leagues(LigaID)
);