import type { CatalogItem, PathEntry, Profile } from "./types";

/**
 * Deterministic route builder.
 *
 * No model call: every branch is testable, explainable and instant.
 * Entries are keyed by content id, deduplicated, and keep insertion order.
 */
export function buildPath(profile: Profile, catalog: CatalogItem[]): PathEntry[] {
  const exists = (id: string) => catalog.some((item) => item.id === id);

  const entries: PathEntry[] = [];
  const add = (id: string, why: string, phase: string) => {
    if (!exists(id) || entries.some((entry) => entry.id === id)) return;
    entries.push({ id, why, phase });
  };

  add(
    "model-vs-app",
    "A clear distinction between the app and the model helps you choose the right workspace.",
    "Understand",
  );

  add(
    "ask-with-a-brief",
    "A four-line brief is the smallest unit of work you can evaluate and repair.",
    "Practise",
  );

  if (profile.input === "table" || profile.input === "notes") {
    add(
      "inbox-triage",
      "Your chosen material is unstructured text. Practise turning it into a checked table.",
      "Work with your material",
    );
  }

  if (profile.goal === "content" || profile.goal === "products") {
    add(
      "support-reply",
      "Writing for an audience means keeping facts intact while changing the format.",
      "Apply",
    );
  } else if (profile.goal === "automation") {
    add(
      "support-reply",
      "A reply with an explicit escalation rule is a small, safe workflow.",
      "Apply",
    );
  } else {
    add(
      "support-reply",
      "Apply the brief to a real-shaped task with a policy and a human decision point.",
      "Apply",
    );
  }

  add("context-window", "Know why a long document may never reach the model.", "Reference");

  return entries;
}

export const phases = [
  "Understand",
  "Practise",
  "Work with your material",
  "Apply",
  "Reference",
];

export function groupByPhase(entries: PathEntry[]) {
  return phases
    .map((phase) => ({ phase, items: entries.filter((entry) => entry.phase === phase) }))
    .filter((group) => group.items.length > 0);
}
