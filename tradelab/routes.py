from flask import Blueprint, jsonify, request

from .db import get_db

bp = Blueprint("core", __name__)


def _to_float(value, field_name, required=False):
    if value is None:
        if required:
            raise ValueError(f"{field_name} is required")
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        raise ValueError(f"{field_name} must be a number")


def _calculate_pnl(side, quantity, entry_price, exit_price, fees):
    if exit_price is None:
        return None
    if side == "long":
        gross = (exit_price - entry_price) * quantity
    else:
        gross = (entry_price - exit_price) * quantity
    return round(gross - fees, 4)


def _calculate_rr(side, entry_price, stop_loss, take_profit):
    if stop_loss is None or take_profit is None:
        return None

    if side == "long":
        risk = entry_price - stop_loss
        reward = take_profit - entry_price
    else:
        risk = stop_loss - entry_price
        reward = entry_price - take_profit

    if risk <= 0 or reward <= 0:
        return None

    return round(reward / risk, 4)


def _trade_row_to_dict(row):
    return {
        "id": row["id"],
        "symbol": row["symbol"],
        "side": row["side"],
        "quantity": row["quantity"],
        "entry_price": row["entry_price"],
        "exit_price": row["exit_price"],
        "stop_loss": row["stop_loss"],
        "take_profit": row["take_profit"],
        "pnl": row["pnl"],
        "rr": row["rr"],
        "opened_at": row["opened_at"],
        "closed_at": row["closed_at"],
        "fees": row["fees"],
        "notes": row["notes"],
        "created_at": row["created_at"],
    }


@bp.get("/")
def index():
    return jsonify(
        {
            "app": "TradeLab",
            "status": "ok",
            "message": "Trade tracking backend initialized.",
        }
    )


@bp.post("/api/trades")
def create_trade():
    payload = request.get_json(silent=True) or {}

    symbol = str(payload.get("symbol", "")).strip().upper()
    side = str(payload.get("side", "")).strip().lower()

    if not symbol:
        return jsonify({"error": "symbol is required"}), 400
    if side not in {"long", "short"}:
        return jsonify({"error": "side must be 'long' or 'short'"}), 400

    try:
        quantity = _to_float(payload.get("quantity"), "quantity", required=True)
        entry_price = _to_float(payload.get("entry_price"), "entry_price", required=True)
        exit_price = _to_float(payload.get("exit_price"), "exit_price")
        stop_loss = _to_float(payload.get("stop_loss"), "stop_loss")
        take_profit = _to_float(payload.get("take_profit"), "take_profit")
        fees = _to_float(payload.get("fees", 0), "fees")
    except ValueError as exc:
        return jsonify({"error": str(exc)}), 400

    if quantity <= 0:
        return jsonify({"error": "quantity must be greater than 0"}), 400
    if entry_price <= 0:
        return jsonify({"error": "entry_price must be greater than 0"}), 400
    if exit_price is not None and exit_price <= 0:
        return jsonify({"error": "exit_price must be greater than 0"}), 400
    if fees is not None and fees < 0:
        return jsonify({"error": "fees must be >= 0"}), 400

    pnl = _calculate_pnl(side, quantity, entry_price, exit_price, fees)
    rr = _calculate_rr(side, entry_price, stop_loss, take_profit)

    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO trades (
            symbol, side, quantity, entry_price, exit_price,
            stop_loss, take_profit, pnl, rr,
            opened_at, closed_at, fees, notes
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            symbol,
            side,
            quantity,
            entry_price,
            exit_price,
            stop_loss,
            take_profit,
            pnl,
            rr,
            payload.get("opened_at"),
            payload.get("closed_at"),
            fees,
            payload.get("notes"),
        ),
    )
    db.commit()

    created = db.execute("SELECT * FROM trades WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return jsonify(_trade_row_to_dict(created)), 201


@bp.get("/api/stats")
def stats():
    db = get_db()

    totals = db.execute(
        """
        SELECT
            COUNT(*) AS total_trades,
            COALESCE(SUM(pnl), 0) AS total_pnl,
            COALESCE(AVG(rr), 0) AS avg_rr,
            SUM(CASE WHEN pnl > 0 THEN 1 ELSE 0 END) AS wins,
            SUM(CASE WHEN pnl < 0 THEN 1 ELSE 0 END) AS losses
        FROM trades
        """
    ).fetchone()

    win_rate = 0.0
    if totals["total_trades"] > 0:
        win_rate = round((totals["wins"] / totals["total_trades"]) * 100, 2)

    return jsonify(
        {
            "total_trades": totals["total_trades"],
            "wins": totals["wins"],
            "losses": totals["losses"],
            "win_rate_pct": win_rate,
            "total_pnl": round(totals["total_pnl"], 4),
            "avg_rr": round(totals["avg_rr"], 4),
        }
    )
