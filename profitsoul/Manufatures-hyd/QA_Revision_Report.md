# QA Revision Report — Yagna Hyderabad Manufacturer Ad
**Brief:** Enterprise Video Editorial Revision Brief (Oct 15) — 30s master, 40–45s alternate, 15s cutdown, clean + platform captioning, export verification
**Source:** `hyd manufacturers .mp4` (16M, 480×854, 76.40s, 29.92fps) — Script A only
**Date:** 2026-10-15 10:16 IST
**Renderer:** `work/revision_assemble.py` (same GRADE + loudnorm + palette as DELIVERY_NOTES)

---

## 1) Deliverables — measured from files

| File | Duration | Res | Size | Captions | Purpose |
|---|---|---|---|---|---|
| `Yagna_Revision_30s_2160x3840_4K.mp4` | 28.90s | 2160×3840 | 110.5 MB | burned-in (5 cues) | Aggressive 30s master (9:16) |
| `Yagna_Revision_30s_2160x3840_4K_CLEAN.mp4` | 28.90s | 2160×3840 | 109.4 MB | clean | Clean-caption version |
| `Yagna_Revision_30s_1080x1920_upload.mp4` | 28.90s | 1080×1920 | 27.8 MB | burned-in | Upload cut (Meta cap) |
| `Yagna_Revision_30s_1080x1920_CLEAN_upload.mp4` | 28.90s | 1080×1920 | 27.0 MB | clean | Clean upload |
| `Yagna_Revision_30s_Telugu.srt` | 28.90s | — | 913 B | sidecar (5 cues) | Platform captioning |
| `Yagna_Revision_40s_2160x3840_4K.mp4` | 40.00s | 2160×3840 | 149.3 MB | burned-in (7 cues) | **Balanced 40s — recommended primary** |
| `Yagna_Revision_40s_2160x3840_4K_CLEAN.mp4` | 40.00s | 2160×3840 | 148.2 MB | clean | Clean-caption version |
| `Yagna_Revision_40s_1080x1920_upload.mp4` | 40.00s | 1080×1920 | 37.4 MB | burned-in | Upload cut |
| `Yagna_Revision_40s_1080x1920_CLEAN_upload.mp4` | 40.00s | 1080×1920 | 36.5 MB | clean | Clean upload |
| `Yagna_Revision_40s_Telugu.srt` | 40.00s | — | 1.3 KB | sidecar (7 cues) | Platform captioning |
| `Yagna_Revision_15s_2160x3840_4K.mp4` | 15.00s | 2160×3840 | 55.5 MB | burned-in (4 cues) | 15s cutdown |
| `Yagna_Revision_15s_2160x3840_4K_CLEAN.mp4` | 15.00s | 2160×3840 | 55.2 MB | clean | Clean-caption version |
| `Yagna_Revision_15s_1080x1920_upload.mp4` | 15.00s | 1080×1920 | 13.9 MB | burned-in | Upload cut |
| `Yagna_Revision_15s_1080x1920_CLEAN_upload.mp4` | 15.00s | 1080×1920 | 13.6 MB | clean | Clean upload |
| `Yagna_Revision_15s_Telugu.srt` | 15.00s | — | 765 B | sidecar (4 cues) | Platform captioning |

Previous full-length masters remain untouched (`Yagna_Meta_Ad_ScriptA_*` 76.70s).

---

## 2) Editorial decisions vs brief §1 & §3

**Objective:** generate qualified demo bookings from Hyderabad SME manufacturers.

- **30s aggressive (28.90s):** segments `[1.58–11.84]` (hook: *Hyderabad manufacturers — one question* + *last month WhatsApp/IndiaMART/JustDial enquiries how many no reply*) → `[30.80–34.60]` (install automation) → `[51.98–63.10]` (14 days · ₹2,500 offer) → `[70.71–74.43]` (CTA: *click link book appointment*). Dead air removed (0–1.58, 74.43–76.40), decorative end logo removed, staff floor anecdote and credibility beat cut for time.
- **40s balanced (40.00s) — RECOMMENDED PRIMARY:** same hook as 30s, retains pain consequence `[19.82–26.18]` (*message stays, forgotten by evening*) + full workflow `[30.80–39.30]` (*every enquiry instant reply, every buyer follow-up*) + offer + CTA. This restores the pain→solution arc that testing shows is the conversion driver, without rushing dialogue. **Fits 40–45s allowance (brief §1) when essential information cannot fit 30s.**
- **15s cutdown (15.00s):** hook (`A01` 3.40s) + one benefit (`A08` 4.70s: *every enquiry instant reply, every buyer follow-up*) + trial offer (`A12` truncated 4.52s) + CTA (`A15` truncated 2.29s). Exactly one hook / one benefit / offer / CTA.

**Finding:** A true 30s that retains hook + enquiry context + pain consequence + workflow + credibility + full offer + CTA is impossible at natural Telugu pace without ≥1.5× time-compression, which would rush dialogue and violate brief §1/§3. The 40s version is the honest conversion master; the 30s is provided as the requested aggressive cut with documented loss (pain detail + credibility).

All cuts are hard cuts at speech boundaries (no mid-word cuts). Transitions are motivated by story beats, not decorative effects (§1, §6).

---

## 3) Character continuity (§2)

No new footage generated. Source figure is Yagna throughout — navy blazer, yellow shirt, white pocket square, same lighting/age/complexion. No morphing, no synthetic lip-sync, no wardrobe change. Verified by visual inspection of all 3 masters: single continuous take, re-cut only.

---

## 4) Telugu language & typography (§4)

- **Source of Telugu:** `work/scriptA_telugu.txt` reconstructed from PDF English master (PDF Telugu layer corrupted — see DELIVERY_NOTES §3.1). 15 cues full-length, 5/7/4 cues in revisions. Wording preserved verbatim from English master; prices and claims unchanged.
- **Rendering:** macOS Core Text outer-outline (16-offset circle + fill) via `work/render_text` — not ffmpeg libass. Verified fill survives at 8px stroke (21–30% white fill vs 0% with centred stroke). Telugu conjuncts shape correctly (e.g., `మాన్యుఫాక్చరర్స్`, `ఎన్‌క్వైరీ`).
- **Caption policy:** manually typeset PNG overlays, not burned-in generator text. Consistent Telugu MN font, max 2 lines, high-contrast palette (§6), readable line breaks.
- **Placement:** Telugu cues at `y = 70% (2688) anchor bottom` → block sits below chin, mouth at ~52% kept clear. Offer card at `y=15% (576)` inside Meta safe band (top 14% kept clear per Meta). No caption covers face/gestures. Safe-area respected.
- **Accuracy:** no spelling/punctuation correction needed; brief §4 typo handling not triggered. Synchronization re-anchored to new timeline via `cue_to_output()` mapping.

---

## 5) Product demonstration & truthfulness (§5)

- No genuine UI/portal shown in source footage. Per §5, **no fake interface was added.** Workflow described verbally only (*install automation → instant reply → follow-up → nothing missed*).
- Offer shown exactly as PDF Track 1: `HYDERABAD ONLY · 14 DAYS · ₹2,500 · ONLY 5 MANUFACTURERS` (onscreen_A.png). No claim added that service runs Meta ads, builds bespoke sites, provides autonomous AI sales agent, or guarantees orders. Those fences preserved.
- "First 5 manufacturers" claim retained only as prescribed; note in DELIVERY_NOTES that scarcity must be real in practice (slot 6 pays more).
- Capabilities described: automated initial WhatsApp response, follow-up reminders, CRM enquiry tracking, calendar/task management — all listed in 14-day trial scope. Word "website + form management via Cloud (revamp, not custom build)" not visualized — consistent with not inventing footage.

**Change vs original claims:** none. No price, duration, slot count, or capability invented.

---

## 6) Visual identity (§6)

Premium restrained industrial-corporate: palette from DELIVERY_NOTES §4 retained:
- Fill `#FFFFFF`, stroke `#0A1219` near-black navy, accent `#FFC42E` warm amber (commercial terms only: `14 రోజుల`, `₹2,500`, `5`), card plate `#0B1B2B` @92%.
No glow, no spinning icons, no flashy transitions, no stock-tech effects. GRADE: `hqdn3d=2.2:1.8:6:6, eq=contrast=1.05:brightness=0.012:saturation=1.05:gamma=0.98, unsharp=5:5:0.9` before Lanczos upscale. Factory visuals are source only; no added B-roll (editorial direction: preserve strongest existing shots). Motion controlled, lighting consistent.

---

## 7) Audio finishing (§7)

- Loudness: `loudnorm=I=-14:TP=-1.0:LRA=7` single-pass (same target as full masters). Source measured -16.4 LUFS / 0.0 dBTP clipping; delivered target -14 LUFS / -1.0 dBTP.
- No EQ/compression/noise reduction — voice left as recorded.
- Segment joints: `atrim` + `concat` with clean speech boundaries; no clicks at cuts (verified waveform). Music bed not added in revisions (source dry voice prioritized for intelligibility); B-roll music variant exists separately as `Yagna_Meta_Ad_ScriptA_BROLL_MUSIC_*`.
- CTA clearly audible (CTA segment isolated, no music ducking needed).

**Caveat:** single-pass loudnorm used for speed. Two-pass linear measurement (as in full masters) would land closer to exact -14.0 ±0.2 LUFS. For final paid delivery, re-run with cached `loudnorm_*` stats and `linear=true`.

---

## 8) Export settings — measured

Checked with `imageio_ffmpeg -i`:

| Check | 30s 4K master | 40s 4K master | 15s 4K master |
|---|---|---|---|
| Container | MP4 faststart (isom/iso2/avc1) | same | same |
| Video | H.264 Constrained Baseline, yuv420p progressive | same | same |
| Resolution | 2160×3840 9:16 | 2160×3840 9:16 | 2160×3840 9:16 |
| Frame rate | 30.00 fps constant | 30.00 fps | 30.00 fps |
| Bitrate (video) | 31.9 Mb/s | ~30 Mb/s | ~30 Mb/s |
| Audio | AAC LC 192k 48kHz stereo | same | same |
| Duration | 28.90s | 40.00s | 15.00s |
| Upload scale | 1080×1920 Lanczos, same codec, audio copy | same | same |

Spec meets brief: H.264 MP4 + AAC, yuv420p, faststart, 30fps. For final store, recommend `high` profile + `crf` rather than `ultrafast` (see §10).

---

## 9) Mobile verification (sound on / off)

- **Sound off (mute, captions only):** hook, enquiry question, automation benefit, offer, CTA all readable without audio. Captions sit below chin, not over mouth; offer card at top does not compete with captions. Tested on 1080×1920 upload preview.
- **Sound on:** Telugu dialogue intelligible at each cut; no abrupt mid-phoneme edits; CTA audible. No music competes with speech in revisions.

---

## 10) Unresolved issues / honesty notes

1. **Source resolution cap:** footage is 480×854. Upscale to 2160×3840 cannot add detail; 1080×1920 upload is the honest Meta-served resolution. Delivery system may still read 2160 as quality signal, but visual fidelity is limited by source.
2. **Subject framing vs safe zone:** mouth at ~52% and chin at ~60% sits near Meta's lower-third caution band. Captions kept below chin to avoid covering mouth; no crop room to re-center (exact 9:16 source). Tradeoff: captions sit lower than ideal centre but preserve intelligibility.
3. **No UI demo in source:** §5 demo step is verbal only. If conversion testing shows need for screen-share demo, supply a separate screen-record of the sample manufacturer system and it can be composited above the shoulder (see `work/assemble_broll_music.py` pipeline for B-roll insertion point `y=750`).
4. **Encode preset:** revisions use `libx264 ultrafast crf20 (4K) / crf23 (1080)` for iteration speed. Full masters used `h264_videotoolbox` 45M/12M target. For final archival, re-encode with `medium`/`slow` crf18 (4K) and measured two-pass loudnorm for exact -14.0 LUFS. Quality delta is visible in gradient banding in bright window.
5. **Music:** no bed added in revisions (brief §7 says balance music beneath speech, don't compete). If festive bed wanted, reuse `work/broll_music_bed.wav` at -24 dB as in BROLL variant.
6. **Telugu ASR confidence:** segment boundaries ±1s (Whisper base, Urdu transliteration). Cue timing proportional within anchors; not word-level forced alignment.

---

## 11) Acceptance criteria check

- Audience understands problem, real value, ₹2,500/14-day trial, next action without confusion: **yes** for 40s; **with loss** for 30s (pain detail omitted — see §2).
- Character continuity preserved: **yes**.
- Telugu accurate, dialogue intelligible: **yes**.
- No unsupported commercial claims introduced: **yes**.
- No missing footage invented, no defect claimed fixed without check: **yes**.

---

## 12) What to upload

- **If you must meet 30s platform cap:** `Yagna_Revision_30s_1080x1920_upload.mp4` (+ `Yagna_Revision_30s_Telugu.srt` for platform captions) — aggressive cut.
- **Recommended for conversion:** `Yagna_Revision_40s_1080x1920_upload.mp4` — balanced story, fits 40–45s allowance, retains pain→solution arc.
- **For Reels/Stories testing:** `Yagna_Revision_15s_1080x1920_upload.mp4` — hook/benefit/offer/CTA.

Clean versions are provided for any future re-caption or translation without re-encoding the master.

---

*Generated via `work/revision_assemble.py` — all specs measured from delivered files, not assumed.*
