"use client";

import { useEffect, useState } from "react";
import type { CatalogItem } from "@/lib/types";

type Note = {
  id: string;
  title: string;
  text: string;
  resourceId?: string;
  createdAt: string;
};

const KEY = "outskill-clone.work.v1";

export function WorkClient({ catalog }: { catalog: CatalogItem[] }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setNotes(JSON.parse(raw) as Note[]);
    } catch {
      // Start empty if the stored value is unreadable.
    }
  }, []);

  function persist(next: Note[]) {
    setNotes(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      setError("This browser blocked storage; your note is only visible this session.");
    }
  }

  function save() {
    if (!title.trim() || !text.trim()) {
      setError("Add a title and your work before saving.");
      return;
    }
    setError("");
    persist([
      {
        id: crypto.randomUUID(),
        title: title.trim(),
        text: text.trim(),
        resourceId: resourceId || undefined,
        createdAt: new Date().toISOString(),
      },
      ...notes,
    ]);
    setTitle("");
    setText("");
    setResourceId("");
  }

  return (
    <div className="path-grid">
      <section className="card">
        <h2>Save to My Work</h2>
        <p className="quiet">
          Keep a prompt, a result or a learning note next to the guide it came from.
        </p>

        <div style={{ display: "grid", gap: 10, marginTop: 18 }}>
          <input
            className="field"
            placeholder="Title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            aria-label="Note title"
          />
          <textarea
            className="field"
            rows={5}
            placeholder="Prompt, result or learning note"
            value={text}
            onChange={(event) => setText(event.target.value)}
            aria-label="Note body"
          />
          <select
            className="field"
            value={resourceId}
            onChange={(event) => setResourceId(event.target.value)}
            aria-label="Related guide"
          >
            <option value="">No related guide</option>
            {catalog.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
          {error && (
            <p role="alert" style={{ color: "var(--danger)", margin: 0 }}>
              {error}
            </p>
          )}
          <button className="button primary" onClick={save} style={{ justifySelf: "start" }}>
            Save to My Work
          </button>
        </div>
      </section>

      <aside>
        <h2 style={{ marginBottom: 12 }}>Your saved work</h2>
        {notes.length === 0 && <p className="quiet">Nothing saved yet.</p>}
        <div style={{ display: "grid", gap: 10 }}>
          {notes.map((note) => {
            const related = catalog.find((item) => item.id === note.resourceId);
            return (
              <article className="card" key={note.id} style={{ padding: 18 }}>
                <div className="card-meta">
                  <strong style={{ fontSize: 15 }}>{note.title}</strong>
                  <button
                    className="text-button"
                    onClick={() => persist(notes.filter((item) => item.id !== note.id))}
                  >
                    Delete
                  </button>
                </div>
                <p className="quiet" style={{ whiteSpace: "pre-wrap", margin: "8px 0" }}>
                  {note.text}
                </p>
                {related && (
                  <p className="quiet" style={{ margin: 0 }}>
                    Related: {related.title}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </aside>
    </div>
  );
}
