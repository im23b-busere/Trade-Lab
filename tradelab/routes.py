from flask import Blueprint, jsonify

bp = Blueprint("core", __name__)


@bp.get("/")
def index():
    return jsonify(
        {
            "app": "TradeLab",
            "status": "ok",
            "message": "Trade tracking backend initialized.",
        }
    )
