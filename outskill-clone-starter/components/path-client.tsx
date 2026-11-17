"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { buildPath, groupByPhase } from "@/lib/path-engine";
import { isComplete, useProgress } from "@/lib/progress";
import type { CatalogItem, Profile, Role } from "@/lib/types";

const PROFILE_KEY = "outskill-clone.profile.v1";

const roles: { id: Exclude<Role, "all">; label: string }[] = [
  { id: "leadership-operations", label: "Leadership & operations" },
  { id: "marketing-sales", label: "Marketing & sales" },
  { id: "finance-accounting", label: "Finance & accounting" },
  { id: "data-analytics", label: "Data & analytics" },
  { id: "product-strategy", label: "Product & strategy" },
  { id: "design-creative", label: "Design & creative" },
  { id: "software-technology", label: "Software & technology" },
  { id: "education-consulting", label: "Education & consulting" },
  { id: "personal-home", label: "Home & personal life" },
];

const goals: { id: Profile["goal"]; label: string }[] = [
  { id: "productivity", label: "Make everyday work easier" },
  { id: "research", label: "Research and understand information" },
  { id: "content", label: "Create useful content" },
  { id: "automation", label: "Make a recurring process easier" },
  { id: "products", label: "Build a small useful product" },
];

const tasks: { id: string; label: string; goal: Profile["goal"] }[] = [
  { id: "summarise-notes", label: "Turn notes into a summary", goal: "productivity" },
  { id: "triage-inbox", label: "Sort a messy inbox", goal: "productivity" },
  { id: "compare-sources", label: "Compare two sources", goal: "research" },
  { id: "draft-message", label: "Draft a message for a team", goal: "content" },
  { id: "map-workflow", label: "Map a repeating workflow", goal: "automation" },
  { id: "describe-tool", label: "Describe a small tool before building it", goal: "products" },
];

const inputs: { id: Profile["input"]; label: string }[] = [
  { id: "notes", label: "Notes or messages" },
  { id: "documents", label: "Documents or reference material" },
  { id: "table", label: "A table or spreadsheet" },
  { id: "none", label: "Nothing yet" },
];

const experiences: { id: Profile["experience"]; label: string }[] = [
  { id: "new", label: "I am new to this" },
  { id: "occasional", label: "I use it occasionally" },
  { id: "regular", label: "I use it most weeks" },
  { id: "builder", label: "I build things with it" },
];

const paces: { id: Profile["pace"]; label: string }[] = [
  { id: "15", label: "15 minutes" },
  { id: "30", label: "30 minutes" },
  { id: "60", label: "An hour" },
];

const supports: { id: Profile["support"]; label: string }[] = [
  { id: "beginner", label: "Full worked examples" },
  { id: "intermediate", label: "Hints and partial prompts" },
  { id: "advanced", label: "An independent challenge first" },
];

type Draft = Partial<Profile>;

export function PathClient({ catalog }: { catalog: CatalogItem[] }) {
  const progress = useProgress();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [draft, setDraft] = useState<Draft>({});
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile(JSON.parse(raw) as Profile);
    } catch {
      // Ignore malformed drafts.
    }
    setReady(true);
  }, []);

  function update(patch: Draft) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function save() {
    if (!isComplete_(draft)) return;
    const next = draft as Profile;
    try {
      window.localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    } catch {
      // The path still works for this session.
    }
    setProfile(next);
    window.scrollTo({ top: 0 });
  }

  const path = useMemo(
    () => (profile ? buildPath(profile, catalog) : []),
    [profile, catalog],
  );

  if (!ready) return <p className="quiet">Opening your learning path…</p>;

  if (!profile) {
    return (
      <div className="card" style={{ maxWidth: 860 }}>
        <p className="eyebrow">A PATH THAT STARTS WITH YOU</p>
        <h1 style={{ fontSize: 34 }}>A few choices. A much clearer next step.</h1>
        <p className="quiet" style={{ marginTop: 10 }}>
          Step {step + 1} of 4. Your answers select a curated route; nothing is sent to a model.
        </p>

        <div style={{ marginTop: 26 }}>
          {step === 0 && (
            <div className="wizard-step">
              <label>Where will you use this?</label>
              <div className="choice-grid">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    className="choice"
                    aria-pressed={draft.role === role.id}
                    onClick={() => update({ role: role.id })}
                  >
                    {role.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <>
              <div className="wizard-step">
                <label>What outcome matters first?</label>
                <div className="choice-grid">
                  {goals.map((goal) => (
                    <button
                      key={goal.id}
                      className="choice"
                      aria-pressed={draft.goal === goal.id}
                      onClick={() => update({ goal: goal.id, task: "" })}
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wizard-step">
                <label>Which task would you practise first?</label>
                <div className="choice-grid">
                  {tasks
                    .filter((task) => !draft.goal || task.goal === draft.goal)
                    .map((task) => (
                      <button
                        key={task.id}
                        className="choice"
                        aria-pressed={draft.task === task.id}
                        onClick={() => update({ task: task.id })}
                      >
                        {task.label}
                      </button>
                    ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="wizard-step">
                <label>What material will you start with?</label>
                <div className="choice-grid">
                  {inputs.map((input) => (
                    <button
                      key={input.id}
                      className="choice"
                      aria-pressed={draft.input === input.id}
                      onClick={() => update({ input: input.id })}
                    >
                      {input.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wizard-step">
                <label>What have you actually done so far?</label>
                <div className="choice-grid">
                  {experiences.map((experience) => (
                    <button
                      key={experience.id}
                      className="choice"
                      aria-pressed={draft.experience === experience.id}
                      onClick={() => update({ experience: experience.id })}
                    >
                      {experience.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="wizard-step">
                <label>How long should one practice session take?</label>
                <div className="choice-grid">
                  {paces.map((pace) => (
                    <button
                      key={pace.id}
                      className="choice"
                      aria-pressed={draft.pace === pace.id}
                      onClick={() => update({ pace: pace.id })}
                    >
                      {pace.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wizard-step">
                <label>How much help do you want?</label>
                <div className="choice-grid">
                  {supports.map((support) => (
                    <button
                      key={support.id}
                      className="choice"
                      aria-pressed={draft.support === support.id}
                      onClick={() => update({ support: support.id })}
                    >
                      {support.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="wizard-step">
                <label htmlFor="name">What should we call you? (optional)</label>
                <input
                  id="name"
                  className="field"
                  maxLength={50}
                  value={draft.name ?? ""}
                  onChange={(event) => update({ name: event.target.value })}
                  placeholder="First name"
                />
              </div>
            </>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          {step > 0 && (
            <button className="button" onClick={() => setStep((value) => value - 1)}>
              Back
            </button>
          )}
          {step < 3 && (
            <button
              className="button primary"
              disabled={!canAdvance(step, draft)}
              onClick={() => setStep((value) => value + 1)}
            >
              Continue
            </button>
          )}
          {step === 3 && (
            <button className="button primary" disabled={!isComplete_(draft)} onClick={save}>
              Create my learning path
            </button>
          )}
        </div>
      </div>
    );
  }

  const groups = groupByPhase(path);

  return (
    <>
      <div className="page-heading">
        <p className="eyebrow">YOUR PERSONAL LEARNING PATH</p>
        <h1>{profile.name ? `Welcome back, ${profile.name}.` : "Your route starts here."}</h1>
        <p>
          {path.length} steps chosen from {catalog.length} items, based on your role, goal and
          starting material. Progress is saved on this device for the demo.
        </p>
      </div>

      <div className="path-grid">
        <section className="card">
          {groups.map((group) => (
            <div className="phase" key={group.phase}>
              <p className="phase-label">{group.phase}</p>
              {group.items.map((entry, index) => {
                const item = catalog.find((candidate) => candidate.id === entry.id);
                if (!item) return null;
                const done = isComplete(progress, item.id);
                return (
                  <Link className="path-stop" href={`/learn/${item.id}`} key={entry.id}>
                    <span className="num">{index + 1}</span>
                    <span>
                      <strong>
                        {item.title} {done && <span className="done-dot">· done</span>}
                      </strong>
                      <small>
                        {entry.why} · {item.minutes} min
                      </small>
                    </span>
                  </Link>
                );
              })}
            </div>
          ))}

          <button
            className="text-button"
            onClick={() => {
              setDraft(profile);
              setProfile(null);
              setStep(0);
            }}
          >
            Adjust my profile
          </button>
        </section>

        <aside className="card">
          <p className="eyebrow">HOW YOUR CHOICES SHAPED THIS ROUTE</p>
          <ul className="quiet" style={{ paddingLeft: 18 }}>
            <li>
              Role: <strong>{roles.find((role) => role.id === profile.role)?.label}</strong>
            </li>
            <li>
              Goal: <strong>{goals.find((goal) => goal.id === profile.goal)?.label}</strong>
            </li>
            <li>
              Material: <strong>{inputs.find((input) => input.id === profile.input)?.label}</strong>
            </li>
            <li>
              Support: <strong>{supports.find((item) => item.id === profile.support)?.label}</strong>
            </li>
          </ul>
          <p className="quiet" style={{ marginTop: 14 }}>
            No AI call was made. The same answers always produce the same route, which makes the
            path explainable and testable.
          </p>
        </aside>
      </div>
    </>
  );
}

function canAdvance(step: number, draft: Draft) {
  if (step === 0) return Boolean(draft.role);
  if (step === 1) return Boolean(draft.goal && draft.task);
  if (step === 2) return Boolean(draft.input && draft.experience);
  return true;
}

function isComplete_(draft: Draft): draft is Profile {
  return Boolean(
    draft.role &&
      draft.goal &&
      draft.task &&
      draft.input &&
      draft.experience &&
      draft.pace &&
      draft.support,
  );
}
