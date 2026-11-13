# Quick Notes

A clean single-page note-taking app built with Flask and SQLite. Notes are saved through a Python API and displayed on the same page. You can also edit or delete saved notes.

## Features

- Create notes (up to 1,000 characters)
- Edit and delete notes
- Persist notes in SQLite
- Responsive, accessible single-page interface

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open <http://localhost:5000> in your browser. The SQLite database is created as `notes.db` in the project directory by default. Set `DATABASE_PATH` to use a different location.

## Deploy on Render

This repository includes a `render.yaml` Blueprint configuration. To deploy:

1. Push the repository to GitHub and sign in to [Render](https://render.com/).
2. In Render, choose **New → Blueprint**, connect this repository, and apply the configuration.
3. Render builds the app with `pip install -r requirements.txt` and starts it with Gunicorn. The SQLite database is stored on the configured persistent disk at `/var/data/notes.db`.

The Blueprint uses a Starter web service because SQLite persistence requires a persistent disk. Review the current Render plan and pricing before deploying. Once deployment completes, open the service URL provided by Render.

## API

- `GET /api/notes` — list notes
- `POST /api/notes` — create a note with JSON `{ "content": "..." }`
- `PUT /api/notes/<id>` — update a note with JSON `{ "content": "..." }`
- `DELETE /api/notes/<id>` — delete a note
