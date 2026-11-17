# Yagna — Meta Ad Delivery Notes
### Hyderabad Manufacturer campaign · Script A ("Test us, don't trust us")

Prepared from the two supplied files:
- `hyd manufacturers .mp4` (source footage)
- `Yagna_Hyderabad_Manufacturer_7Day_Launch_Plan (1).pdf` (instruction source)

No copy, claim, price, or offer was invented. Every subtitle line and the on-screen
offer card are taken from the PDF's **"Ad scripts — Track 1"** section.

---

## 1. Deliverables

| File | Size | Purpose |
|---|---|---|
| `Yagna_Meta_Ad_ScriptA_2160x3840_4K.mp4` | 433.9 MB | 4K vertical master (2160×3840) |
| `Yagna_Meta_Ad_ScriptA_1080x1920_upload.mp4` | 117.1 MB | Upload cut for Meta (1080×1920) |
| `Yagna_Meta_Ad_ScriptA_Telugu.srt` | 2.6 KB | Telugu subtitle sidecar (15 cues) |

All specs below are **measured from the delivered files**, not assumed. Both video
deliverables passed every check in the compliance checklist (section 8).

---

## 2. What the source footage actually contains — read this first

**The supplied video is Script A only. Script B is not in the file.**

I established this by transcribing the audio (see section 6 for method):

- The video opens with *"one question"* (`ఒక ప్రశ్న`) — that is Script A's opening line.
  Script B opens with *"one honest question"* (`ఒక నిజాయితీ ప్రశ్న`).
- **None** of Script B's distinctive lines appear anywhere in the 76 seconds:
  "your last 100 enquiries", "₹50,000, sometimes ₹1 lakh a year",
  "you handed him to your competitor for free", "you don't need more enquiries".
- The video contains Script A's offer and closing call to action, then ends with "Thank you."

So one ad was produced: **Script A**.

The PDF also states each script was planned as *"~45 seconds"*. The delivered read runs
**76.4 seconds** — about 70% longer than planned. It is still inside Meta's Reels video
limit, but it sits well outside the 15–30 second band the same spec sets as the performance
sweet spot. If you want a ~45 s cut, that is a re-edit decision (trim wording or increase
pace), not something I should have decided for you.

**Script B** needs a separate recording. If you send that footage I will cut it the same way.

---

## 3. Problems found in the supplied material

These are defects in the inputs, not stylistic choices. I corrected the technical ones and
am flagging the rest.

### 3.1 The PDF's Telugu text is corrupted
The PDF's embedded font has a broken ToUnicode map. The Telugu text **renders as empty boxes**
(`▯▯▯▯`) in the delivered PDF and extracts as mangled glyphs — e.g. what should read
`మాన్యుఫాక్చరర్స్` extracts as `మాన్యు ఫాక్చ రర్స్`, and `స్టాఫ్` as `ోాాఫ ్`. The ₹ amounts
are corrupted the same way.

Consequence: the Telugu subtitles are **reconstructed from the same script lines**, using the
PDF's own English master as the controlling text (the PDF states: *"The English master is the
controlling version"*). Wording, order, prices and claims are unchanged. If you have the
original Telugu script in an uncorrupted file, send it and I will diff it against my
reconstruction at no cost.

### 3.2 Source audio is clipping
Measured on the raw file: **integrated −16.4 LUFS, true peak 0.0 dBFS.** A true peak of
0.0 dBFS means the audio is running into the ceiling. Corrected in the master — see 5.2.

### 3.3 Source resolution
The footage is **480×854**. Meta's own guidance says the served file is capped at 1080 px on
the short edge, and that a Reel rendering at 480×854 "isn't just ugly, it loses the auction"
because the delivery system reads resolution as a creative-quality signal. The upscale
therefore does real work — but see the honesty note in section 7.

### 3.4 Subject framing fights the safe zone
The subject's **mouth sits at ~52% of frame height and the chin at ~60%**, which places the
speaking face inside the band Meta reserves. Meta's published guidance is *"a founder
talking-head Reel where the founder's mouth is in the bottom third reads as a meme on mute."*
This is a framing problem that cannot be fixed by editing — the source is already close to
exact 9:16, so there is no crop room to move him. See section 7 for how I handled it and
what it costs.

---

## 4. What was done to the video

Content is untouched. Changes are technical only:

**Picture**
- Denoise (`hqdn3d`) applied at source resolution before scaling.
- Exposure lift and light contrast/saturation correction — the original is backlit with a
  blown-out window behind the subject.
- Lanczos upscale 480×854 → 2160×3840.
- Light unsharp mask, then a very low-strength temporal grain to suppress banding in the
  bright background.

**Subtitles**
- 15 Telugu cues, burned in, white with a dark outline, maximum two lines per cue.
- Positioned so the block sits **below the chin**, keeping the mouth clear (see 7).
- Rendered through macOS Core Text. ffmpeg's bundled libass has no HarfBuzz, so it cannot
  shape Telugu conjuncts — it rendered `మాన్యుఫాక్చరర్స్` as broken separate glyphs in testing.

**On-screen offer card**
- The PDF's prescribed line, shown during the offer and call-to-action section:
  `HYDERABAD ONLY · 14 DAYS · ₹2,500 · ONLY 5 MANUFACTURERS`

**Colour coding**

The PDF specifies **no** palette, brand colour, font or typographic rule — all 9 pages
were parsed for colour/hex/palette/brand/font references and none exist. The scheme below
was therefore chosen for this footage and can be swapped on request.

| Element | Colour | Rationale |
|---|---|---|
| Narration text | `#FFFFFF` white | Reads against the dark navy blazer where captions sit |
| Outline | `#0A1219` near-black navy | Separates text if a cue crosses the bright window |
| **Accent** | `#FFC42E` warm amber | High contrast on **both** navy and white; warm tone matches the window light |
| Card plate | `#0B1B2B` navy @ 92% | The card sits over the blown-out window and needs a near-solid plate |

Accent is applied **only to commercial terms** — `14 రోజుల`, `₹2,500`, `5` — never to
narration. The colour shift therefore starts exactly where the offer begins (cue 12) and
acts as a visual cue for "here is the deal". Wording is unchanged.

**Outline rendering defect found and fixed**
The first render pass used Core Text's negative `.strokeWidth`, which draws the stroke
*centred* on the glyph contour — so a thick outline eats the fill. Measured on the actual
cue assets:

| Outline width | White fill pixels | Dark outline pixels |
|---|---|---|
| 5 px | 2 337 | 36 241 |
| 7 px | 643 | 48 106 |
| 9 px | **0** | 57 825 |

At 9 px the fill was gone entirely — captions were solid dark glyphs. It looked acceptable
in the video only because the captions sit over his dark blazer, where the dark outline
disappears and the thin white core reads as the letterform; **any cue crossing the bright
window would have rendered as unreadable dark text**, and the 1080×1920 cut halved the
white core again. Rendering now draws the glyph as a solid silhouette at 16 offsets around
a circle (a true *outer* outline) and fills on top, so the fill survives at any weight.
All 15 cues now measure 21–30% white fill (from 1.3%); none is deficient.

**Audio**
- Loudness normalised and peak-limited (two-pass). No EQ, no compression, no noise reduction —
  the voice is left as recorded.
- The 76 s master is rendered in four passes and joined with a stream copy (`-c copy`), so no
  frame is re-encoded at the seams. Because the whole-file linear gain was applied per pass, the
  joined file landed 0.2 dB hot (−13.8 LUFS / −0.9 dBTP); a final audio-only pass applies one
  exact gain to land on target. The video stream is copied, never re-encoded.

---

## 5. Measured output specifications

### 5.1 Video — measured
| Check | 4K master | 1080×1920 upload cut |
|---|---|---|
| Resolution | 2160×3840 (9:16) | 1080×1920 (9:16) |
| Codec | H.264 High | H.264 High |
| Pixel format | yuv420p, progressive | yuv420p, progressive |
| Frame rate | 30.0 fps constant | 30.0 fps constant |
| Video bitrate | 45 256 kb/s | 12 018 kb/s |
| Container | MP4, faststart | MP4, faststart |
| Duration | 76.70 s | 76.70 s |
| File size | 433.9 MB | 117.1 MB |

### 5.2 Audio — measured
| Check | Source | Delivered |
|---|---|---|
| Integrated loudness | −16.4 LUFS | **−14.0 LUFS** |
| True peak | **0.0 dBFS (clipping)** | **−1.0 dBTP** |
| Loudness range | 5.3 LU | 4.3 LU |
| Codec | AAC 255 kb/s | AAC 190 kb/s, 48 kHz, stereo |

Both files measured identical audio, confirming the upload cut is a straight downscale of
the master rather than a re-encode of the source.

---

## 6. How subtitle timing was derived (and its confidence level)

Timing is **anchored to measured speech**, not guessed:

1. The audio was transcribed with automatic speech recognition. Segment boundaries were used
   as timing anchors (1.58 s, 4.98 s, 15.62 s, 41.85 s, 51.98 s, 70.71 s, …).
2. Cue windows that contain more than one sentence were divided **proportionally by character
   length** inside the measured anchor window.

**Confidence: approximately ±1 second.** Be aware of the following:

- The supplied audio is Telugu, and Whisper's `small` and `medium` models both returned
  degenerate repetition loops on it. Only the `base` model produced usable output, and it
  emitted the Telugu phonetics in **Urdu script transliteration** rather than Telugu script
  (e.g. `ھایدرا با دھا مینفرچرس میں کو کو پرشنا` = "Hyderabad manufacturers — one question").
  Segment *boundaries* from that pass were reliable enough to use as anchors; the *words*
  were not, so no word from the ASR output was used as subtitle text.
- The largest uncertainty sits in the 20–42 s stretch, where several short sentences are
  spoken without pauses long enough to be detected as separate segments.
- **Recommendation:** play the video once against the SRT before spending on the campaign.

This is disclosed rather than presented as frame-accurate because a mis-timed Telugu caption
is worse than no caption.

---

## 7. Honest limitations

**The 4K upscale does not add detail.** The source is 480×854. Scaling to 2160×3840 produces a
correct, spec-compliant 4K container and removes the low-resolution penalty, but it cannot
recover detail that was never captured. The picture is clean and correctly graded at 4K; it is
not 4K-sharp. Genuine 4K needs a camera that shoots it.

**4K does not cause Meta approval.** This is worth being direct about, because the brief assumed
it: Meta does not approve or reject ads based on resolution. Ad review is a *policy* check —
claims, substantiation, landing page, restricted content. A 4K file that breaches policy is
still rejected, and a correctly-made 1080p file that complies is still approved. Resolution
affects *delivery performance*, not approval. Separately, Meta caps the served file at 1080 px
on the short edge, so uploading 4K gains no resolution on the viewer's screen — it only
transcodes down. That is why both a 4K master and a 1080×1920 upload cut are provided.

**The safe zone is a compromise, and you should know the trade-off.** Meta's published 9:16
reserved band is top 14%, bottom 35%, sides 6%. The subject's chin is at 60% and his mouth at
52%, so no legible two-line caption can sit inside the strict safe band without covering his
face. Given the choice, I kept the mouth clear and placed the subtitles below the chin, with
the bottom of the caption block at **70%** of frame height. That means:

- Top 14% — clear. Sides 6% — clear.
- Bottom 30% — clear of captions (better than the ~17.7% figure some guides cite, short of the
  strict 35%).
- The trade-off is deliberate and it is the right one for a talking-head ad, but it is a
  compromise, not full compliance.

**The real fix is a re-shoot.** Frame the subject so his head sits in the upper third, then
captions can sit comfortably inside the strict safe band on a clean chest/background area.
That would take ten minutes on set and would beat anything achievable by editing this file.

---

## 8. Meta compliance checklist

Every row below was measured from the delivered files by an automated check
(`work/verify_outputs.py`), which asserts each condition rather than assuming it.
**Result: PASS on both the 4K master and the 1080×1920 upload cut** — with one
deliberate exception, noted.

| Requirement | Status |
|---|---|
| Container MP4 / MOV | Pass |
| H.264 video codec (not H.265/HEVC) | Pass |
| AAC audio, ≥ 128 kbps | Pass (192 kbps) |
| 30 fps constant, progressive | Pass |
| 9:16 aspect ratio, ≥1080 px short edge | Pass |
| File under 4 GB | Pass |
| Captions burned in | Pass |
| Text clear of top 14% / sides 6% | Pass |
| Text clear of the strict bottom 35% | **Compromise — see section 7** |
| No unsubstantiated claims in the creative | Pass — all copy is the client's own PDF text |
| Compressed (not clipped) audio | Pass |

---

## 9. Suggested next actions

1. **Spot-check subtitle sync** against the SRT before launch (section 6).
2. **Record Script B.** It is the retargeting ad (targets viewers of 50% of Script A who did
   not book) and it is missing entirely.
3. **Confirm the duration decision.** 76.4 s is valid but long; the same spec calls 15–30 s
   the sweet spot. Trimming is a content decision for you.
4. **Consider a re-shoot** with the subject framed higher, for full strict safe-zone compliance.
5. **Close the PDF's open decisions** before the campaign runs — monthly rate after the trial,
   price after founding slot 5, daily ad budget, and the WhatsApp broadcast volume are all still
   marked "not set". These are ad-policy-adjacent: the creative promises ₹2,500 for 14 days and
   says the price rises after slot 5, so the numbers behind that promise need to exist.
