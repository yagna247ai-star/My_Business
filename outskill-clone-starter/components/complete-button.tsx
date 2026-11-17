"use client";

import { isComplete, setStatus, useProgress } from "@/lib/progress";

export function CompleteButton({ id }: { id: string }) {
  const entries = useProgress();
  const done = isComplete(entries, id);

  return (
    <button
      className="button primary"
      disabled={done}
      onClick={() => setStatus(id, "completed")}
      aria-live="polite"
    >
      {done ? "Completed" : "Mark as completed"}
    </button>
  );
}
