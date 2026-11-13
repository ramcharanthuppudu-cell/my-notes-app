# my-notes-app

A simple single-page note-taking application built with Python and Flask. Notes are sent from the browser to a backend API, saved in SQLite, and rendered back on the page without reloading.

## Features

- Write and save notes from a browser form
- Send note data to a Python backend via a POST request
- Store notes in a SQLite database
- Display saved notes immediately on the same page

## Run locally

1. Clone the repository.
2. Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

3. Start the app:

```bash
python app.py
```

4. Open http://localhost:5000 in your browser.

## Project structure

- `app.py` — Flask application and API routes
- `templates/index.html` — frontend layout
- `static/style.css` — page styling
- `static/script.js` — client-side logic for saving and loading notes
- `notes.db` — SQLite database file created when the app starts
