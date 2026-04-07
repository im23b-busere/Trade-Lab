# TradeLab

TradeLab ist ein einfaches Web-Tool zur Verwaltung und Auswertung von Trades.
Der Fokus dieses ersten Setups liegt auf einer klaren technischen Basis mit Flask und SQLite.

## Zielbild (MVP)
- Import von Trades per CSV/JSON
- Speicherung in SQLite
- Berechnung von PnL sowie Risk/Reward
- Dashboard mit Kernkennzahlen
- Export als CSV

## Tech-Stack
- Python 3.12+
- Flask
- SQLite

## Projektstruktur
- `app.py` - Anwendungseinstieg
- `tradelab/__init__.py` - App Factory
- `tradelab/db.py` - DB-Initialisierung und Verbindungs-Handling
- `tradelab/routes.py` - Basis-Routen
- `tradelab/schema.sql` - Initiales Datenbankschema

## Quickstart
1. Virtuelle Umgebung erstellen und aktivieren
2. Abhängigkeiten installieren:
   - `pip install -r requirements.txt`
3. Datenbank initialisieren:
   - `flask --app app init-db`
4. App starten:
   - `flask --app app run --debug`

## Hinweise
- Die Datenbank liegt lokal unter `instance/tradelab.sqlite3`.
- Import/Export und Dashboard-Logik folgen in den nächsten Commits.
