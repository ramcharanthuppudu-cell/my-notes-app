import os
import sqlite3
from pathlib import Path

from flask import Flask, jsonify, render_template, request

app = Flask(__name__)
BASE_DIR = Path(__file__).resolve().parent
DATABASE = Path(os.environ.get("DATABASE_PATH", str(BASE_DIR / "notes.db")))


def get_db_connection():
    DATABASE.parent.mkdir(parents=True, exist_ok=True)
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


def serialize_note(note):
    return {
        "id": note["id"],
        "content": note["content"],
        "created_at": note["created_at"],
    }


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/notes", methods=["GET", "POST"])
def notes():
    if request.method == "GET":
        with get_db_connection() as conn:
            saved_notes = conn.execute(
                "SELECT id, content, created_at FROM notes ORDER BY created_at DESC, id DESC"
            ).fetchall()
        return jsonify([serialize_note(note) for note in saved_notes])

    payload = request.get_json(silent=True) or {}
    content = (payload.get("content") or "").strip()
    if not content:
        return jsonify({"error": "Note content is required."}), 400
    if len(content) > 1000:
        return jsonify({"error": "Notes must be 1000 characters or fewer."}), 400

    with get_db_connection() as conn:
        cursor = conn.execute("INSERT INTO notes (content) VALUES (?)", (content,))
        conn.commit()
        note = conn.execute(
            "SELECT id, content, created_at FROM notes WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
    return jsonify(serialize_note(note)), 201


@app.route("/api/notes/<int:note_id>", methods=["PUT", "DELETE"])
def note_detail(note_id):
    if request.method == "PUT":
        payload = request.get_json(silent=True) or {}
        content = (payload.get("content") or "").strip()
        if not content:
            return jsonify({"error": "Note content is required."}), 400
        if len(content) > 1000:
            return jsonify({"error": "Notes must be 1000 characters or fewer."}), 400

        with get_db_connection() as conn:
            cursor = conn.execute(
                "UPDATE notes SET content = ? WHERE id = ?", (content, note_id)
            )
            conn.commit()
            if cursor.rowcount == 0:
                return jsonify({"error": "Note not found."}), 404
            note = conn.execute(
                "SELECT id, content, created_at FROM notes WHERE id = ?", (note_id,)
            ).fetchone()
        return jsonify(serialize_note(note))

    with get_db_connection() as conn:
        cursor = conn.execute("DELETE FROM notes WHERE id = ?", (note_id,))
        conn.commit()
    if cursor.rowcount == 0:
        return jsonify({"error": "Note not found."}), 404
    return jsonify({"message": "Note deleted."})


# Create the table during deployment too, when Gunicorn imports this module.
init_db()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5000")))
