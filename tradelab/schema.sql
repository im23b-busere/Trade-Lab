DROP TABLE IF EXISTS trades;

CREATE TABLE trades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    side TEXT NOT NULL CHECK (side IN ('long', 'short')),
    quantity REAL NOT NULL,
    entry_price REAL NOT NULL,
    exit_price REAL,
    opened_at TEXT,
    closed_at TEXT,
    fees REAL NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
