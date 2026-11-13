document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("note-form");
  const noteInput = document.getElementById("note-input");
  const notesList = document.getElementById("notes-list");
  const status = document.getElementById("status");

  async function loadNotes() {
    try {
      const response = await fetch("/api/notes");
      const notes = await response.json();

      if (!notes.length) {
        notesList.innerHTML = '<div class="empty-state">No notes yet. Write one above to get started.</div>';
        return;
      }

      notesList.innerHTML = notes
        .map(
          (note) => `
            <article class="note-item">
              <div class="note-meta">
                <span>Saved</span>
                <time>${new Date(note.created_at).toLocaleString()}</time>
              </div>
              <p>${escapeHtml(note.content)}</p>
            </article>
          `
        )
        .join("");
    } catch (error) {
      notesList.innerHTML = '<div class="empty-state">Unable to load notes right now.</div>';
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = noteInput.value.trim();

    if (!content) {
      setStatus("Please enter a note before saving.", "error");
      return;
    }

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save note.");
      }

      noteInput.value = "";
      setStatus("Note saved successfully!", "success");
      await loadNotes();
    } catch (error) {
      setStatus(error.message, "error");
    }
  });

  function setStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  loadNotes();
});
