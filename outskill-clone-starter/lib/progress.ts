"use client";

import { useEffect, useState } from "react";
import type { ProgressEntry } from "./types";

const KEY = "outskill-clone.progress.v1";
const EVENT = "outskill-progress-change";
const EMPTY: ProgressEntry[] = [];

let snapshot: ProgressEntry[] = EMPTY;
let loaded = false;

function load(): ProgressEntry[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ProgressEntry[]) : EMPTY;
  } catch {
    return EMPTY;
  }
}

export function readProgress(): ProgressEntry[] {
  if (!loaded) {
    snapshot = load();
    loaded = true;
  }
  return snapshot;
}

export function setStatus(id: string, status: ProgressEntry["status"]) {
  const next = [
    { id, status, updatedAt: new Date().toISOString() },
    ...readProgress().filter((entry) => entry.id !== id),
  ];
  snapshot = next;
  loaded = true;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage can be unavailable in private modes; the UI stays optimistic.
  }
  window.dispatchEvent(new Event(EVENT));
}

export function useProgress() {
  const [entries, setEntries] = useState<ProgressEntry[]>(EMPTY);

  useEffect(() => {
    const sync = () => setEntries(readProgress());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return entries;
}

export function isComplete(entries: ProgressEntry[], id: string) {
  return entries.some((entry) => entry.id === id && entry.status === "completed");
}
