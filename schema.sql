CREATE TABLE IF NOT EXISTS Candidate (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  party TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS PollingData (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL,
  percentage REAL NOT NULL,
  candidateId INTEGER NOT NULL,
  FOREIGN KEY(candidateId) REFERENCES Candidate(id)
);

CREATE INDEX IF NOT EXISTS idx_pollingdata_date ON PollingData(date);

CREATE TABLE IF NOT EXISTS PartySupport (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agency TEXT,
  date TEXT,
  partyName TEXT,
  supportPercentage REAL
);
