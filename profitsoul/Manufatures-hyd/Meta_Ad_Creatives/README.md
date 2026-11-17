# Meta Ad Creatives — Hyderabad Manufacturer campaign (Track 1)

Static ad images built from the same copy as the video ads. **All copy is taken from the
PDF's "Ad scripts — Track 1" section.** No claim, figure, price or offer was invented.

---

## ⚠️ Read this first — a language conflict

The PDF is explicit, twice:

> *"Hyderabad manufacturers, **Telugu only. No English creatives.**"*
>
> *"One market, one niche: Hyderabad manufacturers, Telugu only."*

You asked for "all languages included", so **both variants are supplied**:

| Set | Files | Status |
|---|---|---|
| **Telugu** | `*_Telugu.jpg` | Matches the PDF's stated strategy |
| **Bilingual** (Telugu + English) | `*_Bilingual.jpg` | **Overrides** the PDF's "no English creatives" rule |

Both sets are otherwise identical. Upload whichever you want — but the PDF's strategy is
Telugu-only, so if you run the bilingual set you are departing from your own written plan.
Delete the set you don't want; nothing else needs to change.

---

## What's included (14 images)

Three messages × three placements × two language variants.

| # | Creative | Message | Sizes |
|---|---|---|---|
| 01 | **Offer hero** | Festive offer, ₹2,500 / 14 days / 5 manufacturers | 1:1, 4:5, 9:16 |
| 02 | **Hook A** | *"Did anyone reply to last month's enquiries?"* — Script A's opener | 4:5, 9:16 |
| 03 | **Hook B** | *"You are losing the leads you already paid for"* — Script B's opener | 4:5, 9:16 |

- **1:1** 1080×1080 · **4:5** 1080×1350 · **9:16** 1080×1920 — all under Meta's image limits
- `00_CONTACT_SHEET.png` shows all 14 at a glance

**Placement:** 4:5 is the strongest feed performer; 9:16 suits Reels/Stories; 1:1 covers
feed and right-column. Hook A pairs with the cold audience, Hook B with the retargeting
audience (people who watched 50% of Script A and didn't book).

---

## Design rules applied

- **Palette** — the PDF specifies no brand colours, fonts or styling anywhere (all 9 pages
  were parsed for colour/hex/palette/brand/font references and none exist). Chosen for this
  footage: navy `#0B1B2B` plate, white body copy, amber `#FFC42E` **reserved for commercial
  figures only** — `₹2,500`, `5`, `₹50,000`, `₹1 లక్ష`. Narration copy stays white, so the
  eye is pulled to the numbers that sell.
- **The "ONLY 5" badge** on the offer creatives is the playful scarcity device — the print
  equivalent of the video's scarcity beat.
- **Telugu typography** is typeset with a Core Text renderer, not ffmpeg/libass, because
  libass has no HarfBuzz and mis-shapes Telugu conjuncts (`మాన్యుఫాక్చరర్స్` renders broken).
- **Subject framing** — briefs are built so the face sits above the panel with the mouth
  fully visible, avoiding Meta's bottom-35% UI zone.

---

## Honest limitations

- **The photos are real frames from the Script A take**, not new photography. Yagna's
  expression is a mid-sentence frame; a re-shoot would let us pick a stronger pose. The
  source is 480×854, so the portrait is upscaled — clean and spec-compliant, but not
  optically sharp at 100% zoom.
- **Hook B's image shows Yagna**, but Script B was never recorded — so there is no
  Script B video to match it to. That's fine for a static ad (the image is generic), but
  don't pair it with the Script A video expecting message consistency.
- **The PDF's own Telugu text is corrupted** (broken font/ToUnicode map — it renders as
  empty boxes and extracts as mangled glyphs). Telugu here was reconstructed from the
  English master, which the PDF designates as the controlling version. Meaning is
  unchanged, but if you have an uncorrupted Telugu script, send it and I'll re-typeset.
- **Prices and claims are unverified.** ₹2,500, 14 days, 5 slots, ₹50,000–₹1 lakh — all
  come from your PDF. Meta requires substantiation for pricing and income claims, so make
  sure the landing page states the same terms before you run these.
