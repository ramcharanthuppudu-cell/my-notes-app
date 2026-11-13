from flask import Flask, jsonify, render_template, request
import sqlite3
from pathlib import Path

app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
DATABASE = BASE_DIR / "notes.db"


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_db_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS notes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        conn.commit()


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/notes", methods=["GET", "POST"])
def notes():
    if request.method == "GET":
        with get_db_connection() as conn:
            notes = conn.execute(
                "SELECT id, content, created_at FROM notes ORDER BY created_at DESC"
            ).fetchall()
        return jsonify(
            [{
                "id": note["id"],
                "content": note["content"],
                "created_at": note["created_at"],
            } for note in notes]
        )

    payload = request.get_json(silent=True) or {}
    content = (payload.get("content") or "").strip()

    if not content:
        return jsonify({"error": "Note content is required."}), 400

    with get_db_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO notes (content) VALUES (?)",
            (content,),
        )
        conn.commit()
        note_id = cursor.lastrowid
        note = conn.execute(
            "SELECT id, content, created_at FROM notes WHERE id = ?",
            (note_id,),
        ).fetchone()

    return jsonify({
        "id": note["id"],
        "content": note["content"],
        "created_at": note["created_at"],
    }), 201


if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000, debug=True)
