document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("note-form");
  const noteInput = document.getElementById("note-input");
  const notesList = document.getElementById("notes-list");
  const notesCount = document.getElementById("notes-count");
  const status = document.getElementById("status");

  async function apiRequest(url, options = {}) {
    const response = await fetch(url, options);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
    return data;
  }

  async function loadNotes() {
    notesList.setAttribute("aria-busy", "true");
    try {
      const notes = await apiRequest("/api/notes");
      renderNotes(notes);
    } catch (error) {
      notesList.replaceChildren(makeMessage("Unable to load your notes right now. Please refresh to try again."));
    } finally {
      notesList.removeAttribute("aria-busy");
    }
  }

  function renderNotes(notes) {
    notesCount.textContent = notes.length;
    if (!notes.length) {
      notesList.replaceChildren(makeMessage("Your page is a blank canvas. Save your first note above."));
      return;
    }

    const fragment = document.createDocumentFragment();
    notes.forEach((note) => {
      const article = document.createElement("article");
      article.className = "note-card";
      article.dataset.id = note.id;

      const header = document.createElement("div");
      header.className = "note-card-header";
      const marker = document.createElement("span");
      marker.className = "note-marker";
      marker.textContent = "✳";
      marker.setAttribute("aria-hidden", "true");
      const date = document.createElement("time");
      date.className = "note-date";
      date.dateTime = note.created_at.replace(" ", "T") + "Z";
      date.textContent = new Date(`${note.created_at.replace(" ", "T")}Z`).toLocaleString();
      header.append(marker, date);

      const content = document.createElement("p");
      content.className = "note-content";
      content.textContent = note.content;

      const actions = document.createElement("div");
      actions.className = "note-actions";
      const editButton = makeActionButton("Edit", "edit-note", "✎");
      const deleteButton = makeActionButton("Delete", "delete-note", "⌫");
      actions.append(editButton, deleteButton);
      article.append(header, content, actions);
      fragment.append(article);
    });
    notesList.replaceChildren(fragment);
  }

  function makeMessage(text) {
    const message = document.createElement("div");
    message.className = "empty-state";
    message.textContent = text;
    return message;
  }

  function makeActionButton(label, action, icon) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "button button-quiet";
    button.dataset.action = action;
    button.setAttribute("aria-label", `${label} note`);
    button.innerHTML = `<span aria-hidden="true">${icon}</span> ${label}`;
    return button;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const content = noteInput.value.trim();
    if (!content) return setStatus("Please write something before saving.", "error");

    const submitButton = form.querySelector("button[type='submit']");
    submitButton.disabled = true;
    try {
      await apiRequest("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      noteInput.value = "";
      setStatus("Your note is saved. Nice one!", "success");
      await loadNotes();
    } catch (error) {
      setStatus(error.message, "error");
    } finally {
      submitButton.disabled = false;
      noteInput.focus();
    }
  });

  notesList.addEventListener("click", async (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const card = button.closest(".note-card");
    const noteId = card.dataset.id;

    if (button.dataset.action === "edit-note") {
      const content = card.querySelector(".note-content");
      if (content) {
        const editor = document.createElement("textarea");
        editor.className = "note-editor";
        editor.maxLength = 1000;
        editor.value = content.textContent;
        editor.setAttribute("aria-label", "Edit note");
        content.replaceWith(editor);
        button.dataset.action = "save-edit";
        button.innerHTML = "<span aria-hidden=\"true\">✓</span> Save";
        button.setAttribute("aria-label", "Save edited note");
        const cancel = makeActionButton("Cancel", "cancel-edit", "×");
        button.after(cancel);
        editor.focus();
      }
      return;
    }

    if (button.dataset.action === "cancel-edit") {
      await loadNotes();
      return;
    }

    if (button.dataset.action === "save-edit") {
      const editor = card.querySelector(".note-editor");
      const content = editor.value.trim();
      if (!content) return setStatus("A note cannot be empty.", "error");
      button.disabled = true;
      try {
        await apiRequest(`/api/notes/${noteId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        });
        setStatus("Note updated.", "success");
        await loadNotes();
      } catch (error) {
        setStatus(error.message, "error");
        button.disabled = false;
      }
      return;
    }

    if (button.dataset.action === "delete-note") {
      if (!window.confirm("Delete this note? This can’t be undone.")) return;
      button.disabled = true;
      try {
        await apiRequest(`/api/notes/${noteId}`, { method: "DELETE" });
        setStatus("Note deleted.", "success");
        await loadNotes();
      } catch (error) {
        setStatus(error.message, "error");
        button.disabled = false;
      }
    }
  });

  function setStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
  }

  loadNotes();
});
