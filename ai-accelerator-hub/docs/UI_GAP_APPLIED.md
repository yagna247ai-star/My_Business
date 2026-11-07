# UI Gap Report — Applied Notes (`standalone.html`)

**Spec:** `docs/UI_GAP_REPORT_standalone_vs_reference.md` (v1.0, 2026-11-04)
**Applied to:** `standalone.html` (now 698 lines)
**Date:** 2026-11-04

## Applied (P0)
- G-01 tokens: semantic tokens added; gold fixed to `#E8B94F`; gold rule enforced (fill + dark text, never gold-on-white); theme toggle persists `ah_theme` and respects OS default; light theme re-skins shell (dark navy stays default).
- G-03 app header: breadcrumb + streak pill (3 days ×1.0) + rank badge + theme toggle + sound toggle (default off) + user chip. Marketing pill, "Live cohort", connection badge, and "Start free" removed from in-app header.
- Feed, Resources, Showcase, Unstuck built as real in-page sections (`#feed`, `#resources`, `#showcase`, `#unstuck`) per §3–6 anatomy, with working composer/tabs/likes/accordion/mode-switch.
- Graph moved into collapsed "Internal diagnostics — mentors only" block; Cypher text replaced with plain language.

## Applied (P1)
- Sidebar labels: Feed, Ranks, Showcase (new), Unstuck. `aria-current="page"` on Home. Collapse control added top-right (brand row); bottom rail handle kept. Neo4j info box removed.
- FAB "Unstuck" on all views (scrolls to coach with page context).
- Engineering copy removed from learner view (RLS tile, Source column, idempotency wording, stack footer).
- Data fixed: XP 57 everywhere, rank #2, all 15 level tiles with "· locked" text, weekly progress "0/15 levels · 1/90 activities", reality-checked copy.
- Client-side "+5 XP" button removed; success copy is "Submitted for review…".

## Applied (P2/hygiene + §10)
- Contrast: no `text-white/20–/30` remains. Light-theme pairs checked to named tokens.
- Reduced-motion guard, labelled form inputs with `aria-describedby`/`aria-invalid`, icon `aria-hidden`, fixed Expand chevron path, removed duplicate CSS rule, page title "AI Accelerator Hub — Demo".

## Decisions taken (§11 → choice)
- D-1 hybrid-light: kept 17-item groups (prior approved), adopted reference labels/order for the four reference modules. Full IA rebuild deferred.
- D-2: tags/filters/groups generated from level config pattern (Level 1/2 chips; groups from activities).
- D-3: rank ladder mapped to Newcomer/Operator/Engineer/Architect wording; badge shows OPERATOR.
- D-4: gold-ink on cream everywhere (single style).
- D-5: sound off by default. D-7: Coach + Career AI modes. D-6/D-8: product framing kept; dark shell default with real light theme.

## Deliberately deferred (needs designs per §9)
- Ranks, Feedback, Certificates, Diamond full pages; Wins-tab design beyond one card; Resources expanded-row design beyond the minimum list; "How this app works" destination.
