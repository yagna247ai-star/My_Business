#!/usr/bin/env python3
"""Build static Meta ad creatives (1:1, 4:5, 9:16) from the Script A/B copy.

All copy is taken from the PDF's 'Ad scripts - Track 1'; no claim, figure or offer
is invented. Telugu is typeset with the Core Text renderer so conjuncts shape
correctly (ffmpeg/libass cannot).

Palette (the PDF specifies none): navy #0B1B2B plate, white body copy,
amber #FFC42E reserved for commercial figures.
"""
import os, subprocess
from PIL import Image, ImageDraw, ImageFilter

RT = './render_text'
TEL = ('TeluguMN', '/System/Library/Fonts/Supplemental/Telugu MN.ttc')
ENG = ('AvenirNext-Bold', None)
ENG_R = ('AvenirNext-DemiBold', None)

NAVY = (11, 27, 43)
AMBER = (255, 196, 46)
WHITE = (255, 255, 255)
MUTED = (176, 191, 208)

OUT = 'creatives'
os.makedirs(f'{OUT}/tmp', exist_ok=True)


def tpng(name, text, size, maxw, font, fill='#FFFFFF', accent='#FFC42E',
         stroke=0, lineheight=1.30, pad=6, align='center'):
    """Render a text layer with Core Text and return it as an RGBA image."""
    safe = os.path.basename(str(name)).replace('/', '_').replace(' ', '_')
    out = f'{OUT}/tmp/{safe}.png'
    cmd = [RT, '--out', out, '--font', font[0], '--size', str(size),
           '--maxwidth', str(maxw), '--align', align, '--fill', fill,
           '--accent', accent, '--lineheight', str(lineheight), '--pad', str(pad),
           '--text', text]
    if font[1]:
        cmd += ['--fontfile', font[1]]
    if stroke:
        cmd += ['--strokew', str(stroke), '--stroke', '#0A1219']
    subprocess.run(cmd, check=True, capture_output=True)
    return Image.open(out).convert('RGBA')


def centre(dst, img, cx, y):
    dst.alpha_composite(img, (int(cx - img.width / 2), int(y)))
    return y + img.height


def panel(canvas, top):
    """Hard-edged navy panel. A soft gradient was tried first and produced a muddy
    grey band over the bright window, so the edge is kept crisp and the amber bar
    above it reads as a deliberate design device."""
    w, h = canvas.size
    ImageDraw.Draw(canvas).rectangle([0, top, w, h], fill=NAVY + (255,))
    return top


def pill_image(text, size, maxw=900):
    """Amber CTA pill, built as a standalone image so it can be centred with the rest."""
    im = tpng(f'pill_{abs(hash(text))}_{maxw}', text, size, maxw,
              TEL if _is_telugu(text) else ENG,
              fill='#0B1B2B', accent='#0B1B2B')
    pw, ph = im.width + 76, im.height + 34
    pill = Image.new('RGBA', (pw, ph), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle([0, 0, pw - 1, ph - 1],
                                           radius=ph // 2, fill=AMBER + (255,))
    pill.alpha_composite(im, (38, 17))
    return pill


def accent_bar(canvas, top, height=8, inset=0):
    w, _ = canvas.size
    ImageDraw.Draw(canvas).rectangle(
        [inset, top, w - inset, top + height], fill=AMBER + (255,))


def badge(canvas, cx, cy, r=118, label='ONLY', num='5'):
    """Amber circular scarcity badge - the playful accent on the offer."""
    lay = Image.new('RGBA', (r * 2 + 30, r * 2 + 30), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    c = r + 15
    d.ellipse([c - r, c - r, c + r, c + r], fill=AMBER + (255,))
    d.ellipse([c - r + 12, c - r + 12, c + r - 12, c + r - 12],
              outline=NAVY + (255,), width=5)
    lab = tpng(f'badge_lab_{r}_{num}', label, int(r * 0.30), int(r * 1.7),
               ENG, fill='#0B1B2B', accent='#0B1B2B')
    n = tpng(f'badge_num_{r}_{num}', num, int(r * 0.92), int(r * 1.6),
             ENG, fill='#0B1B2B', accent='#0B1B2B')
    centre(lay, lab, c, c - int(r * 0.52))
    centre(lay, n, c, c - int(r * 0.16))
    canvas.alpha_composite(lay, (int(cx - c), int(cy - c)))


def cta_pill(canvas, cx, y, text, size=44, bilingual=None):
    """Amber pill with navy CTA text."""
    txt = tpng(f'cta_{abs(hash(text))}', text, size, 900,
               TEL if _is_telugu(text) else ENG,
               fill='#0B1B2B', accent='#0B1B2B')
    pw, ph = txt.width + 76, txt.height + 34
    pill = Image.new('RGBA', (pw, ph), (0, 0, 0, 0))
    ImageDraw.Draw(pill).rounded_rectangle([0, 0, pw - 1, ph - 1], radius=ph // 2,
                                           fill=AMBER + (255,))
    pill.alpha_composite(txt, (38, 17))
    canvas.alpha_composite(pill, (int(cx - pw / 2), y))
    return y + ph


# ---------------------------------------------------------------- creatives

KEY_STRIP = '14 రోజుల ట్రయల్ [[₹2,500]] · హైదరాబాద్‌లో [[5]] మందికే'


def vertical(base, panel_top, bilingual, out, blocks, badge_num=None, bar=True):
    """Photo full-bleed on top, navy offer panel below."""
    c = Image.open(base).convert('RGBA')
    W, H = c.size
    panel(c, panel_top)
    if bar:
        accent_bar(c, panel_top)
    if badge_num:
        badge(c, W - 150, panel_top - 40, r=112, num=badge_num)
    # Render every block first, then centre the whole stack in the panel so the
    # copy sits optically balanced instead of hugging the top edge.
    stack = []
    for kind, arg in blocks:
        if kind == 'gap':
            stack.append(('gap', int(arg)))
        elif kind == 'text':
            text, size, fill, wide, lines = arg
            stack.append(('img', tpng(f'{out}_{len(stack)}', text, size, wide,
                                      TEL if _is_telugu(text) else ENG,
                                      fill=fill, lineheight=lines)))
        elif kind == 'eng':
            text, size, fill, wide = arg
            stack.append(('img', tpng(f'{out}_{len(stack)}_en', text, size, wide,
                                      ENG_R, fill=fill, lineheight=1.25)))
        elif kind == 'cta':
            text, size = arg
            stack.append(('img', pill_image(text, size)))

    total = sum(v if k == 'gap' else v.height for k, v in stack)
    y = panel_top + max(12, (H - panel_top - total) // 2)
    for k, v in stack:
        if k == 'gap':
            y += v
        else:
            centre(c, v, W / 2, y)
            y += v.height
    c.convert('RGB').save(out, quality=96)


def split(base, bilingual, out, blocks):
    """Photo left, navy text column right (for 1:1)."""
    src = Image.open(base).convert('RGBA')
    W, H = src.size
    colw = int(W * 0.46)
    c = Image.new('RGBA', (W, H), NAVY + (255,))
    photo = src.crop((int(W * 0.5 - colw / 2), 0, int(W * 0.5 + colw / 2), H))
    c.alpha_composite(photo, (0, 0))
    d = ImageDraw.Draw(c)
    d.rectangle([colw, 0, colw + 6, H], fill=AMBER + (255,))
    x0 = colw + 58
    cw = W - colw - 58 - 46
    stack = []
    for kind, arg in blocks:
        if kind == 'gap':
            stack.append(('gap', int(arg)))
        elif kind == 'text':
            text, size, fill, wide, lines = arg
            stack.append(('img', tpng(f'{out}_s{len(stack)}', text, size, cw,
                                      TEL if _is_telugu(text) else ENG,
                                      fill=fill, lineheight=lines, align='left')))
        elif kind == 'eng':
            text, size, fill, wide = arg
            stack.append(('img', tpng(f'{out}_s{len(stack)}_en', text, size, cw,
                                      ENG_R, fill=fill, lineheight=1.25, align='left')))
        elif kind == 'cta':
            text, size = arg
            stack.append(('img', pill_image(text, size, cw)))
    total = sum(v if k == 'gap' else v.height for k, v in stack)
    y = max(40, (H - total) // 2)
    for k, v in stack:
        if k == 'gap':
            y += v
        else:
            c.alpha_composite(v, (x0, int(y)))
            y += v.height
    c.convert('RGB').save(out, quality=96)


import re as _re


def _is_telugu(s):
    return bool(_re.search(r'[\u0C00-\u0C7F]', s))


# Offer line repeated across the hook creatives (from the PDF).
STRIP = '14 రోజుల ట్రయల్ [[₹2,500]] · హైదరాబాద్‌లో [[5]] మందికే'

EN_OFFER = 'THIS FESTIVE SEASON · FULL 14-DAY TRIAL · ONLY 5 MANUFACTURERS IN HYDERABAD'
EN_HOOK_A = ('Did anyone reply to last month / enquiries? · Every enquiry is answered in '
             '5 seconds · Nothing missed')
EN_HOOK_B = ('You are losing the leads you already paid for · ₹50,000–₹1 lakh a year on '
             'IndiaMART and JustDial enquiries · Reply in 5 seconds')

HOOK_A = 'గత నెలలో వచ్చిన ఎన్‌క్వైరీలకి ఎవరూ రిప్లై ఇవ్వలేదా?'
BODY_A = 'ప్రతీ ఎన్‌క్వైరీకి [[5]] సెకన్లలో రిప్లై. ఏదీ మిస్ కాదు.'
HOOK_B = 'మీరు డబ్బు కట్టిన లీడ్స్ పోతున్నాయి'
BODY_B = 'IndiaMART, JustDial ఎన్‌క్వైరీలకి సంవత్సరానికి [[₹50,000]] – [[₹1 లక్ష]]'
CTA = 'ఇప్పుడే బుక్ చేసుకోండి →'


def offer_blocks(scale, bilingual):
    b = [('text', ('ఈ పండుగ సీజన్', int(46 * scale), '#FFC42E', 900, 1.2)),
         ('gap', int(6 * scale)),
         ('text', ('[[₹2,500]]', int(200 * scale), '#FFC42E', 900, 1.0)),
         ('gap', int(2 * scale)),
         ('text', ('పూర్తి 14 రోజుల ట్రయల్', int(62 * scale), '#FFFFFF', 990, 1.25)),
         ('gap', int(4 * scale)),
         ('text', ('హైదరాబాద్‌లో కేవలం [[5]] మాన్యుఫాక్చరర్లకు', int(44 * scale),
                   '#FFFFFF', 990, 1.3))]
    if bilingual:
        b += [('gap', int(14 * scale)), ('eng', (EN_OFFER, int(32 * scale), '#B0BFD0', 990))]
    b += [('gap', int(24 * scale)), ('cta', (CTA, int(44 * scale)))]
    return b


def hook_blocks(hook, body, en, scale, bilingual):
    b = [('text', (hook, int(60 * scale), '#FFFFFF', 990, 1.28)),
         ('gap', int(14 * scale)),
         ('text', (body, int(42 * scale), '#FFFFFF', 990, 1.32)),
         ('gap', int(16 * scale)),
         ('text', (STRIP, int(40 * scale), '#FFC42E', 990, 1.3))]
    if bilingual:
        b += [('gap', int(12 * scale)), ('eng', (en, int(27 * scale), '#B0BFD0', 990))]
    return b


def main():
    os.makedirs(OUT, exist_ok=True)
    made = []
    for lang, tag in (('te', 'Telugu'), ('bi', 'Bilingual')):
        bi = (lang == 'bi')

        # --- 01 Offer hero -------------------------------------------------
        vertical('creatives/base/b916_hero.png', 1210, bi,
                 f'{OUT}/01_offer_9x16_{tag}.jpg', offer_blocks(1.0, bi), badge_num='5')
        vertical('creatives/base/b45_hero.png', 890, bi,
                 f'{OUT}/01_offer_4x5_{tag}.jpg', offer_blocks(0.82, bi), badge_num='5')
        split('creatives/base/b11_hero.png', bi, f'{OUT}/01_offer_1x1_{tag}.jpg',
              offer_blocks(0.62, bi))

        # --- 02 Hook A : missed enquiries ----------------------------------
        vertical('creatives/base/b916_hook.png', 1120, bi,
                 f'{OUT}/02_hookA_9x16_{tag}.jpg', hook_blocks(HOOK_A, BODY_A, EN_HOOK_A, 1.0, bi))
        vertical('creatives/base/b45_hook.png', 830, bi,
                 f'{OUT}/02_hookA_4x5_{tag}.jpg', hook_blocks(HOOK_A, BODY_A, EN_HOOK_A, 0.80, bi))

        # --- 03 Hook B : leads you already paid for ------------------------
        vertical('creatives/base/b916_hook.png', 1120, bi,
                 f'{OUT}/03_hookB_9x16_{tag}.jpg', hook_blocks(HOOK_B, BODY_B, EN_HOOK_B, 1.0, bi))
        vertical('creatives/base/b45_hook.png', 830, bi,
                 f'{OUT}/03_hookB_4x5_{tag}.jpg', hook_blocks(HOOK_B, BODY_B, EN_HOOK_B, 0.80, bi))

    for f in sorted(os.listdir(OUT)):
        if f.endswith('.jpg'):
            made.append(f)
    print(f'built {len(made)} creatives')
    for m in made:
        print('  ', m)


if __name__ == '__main__':
    main()
