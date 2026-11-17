#!/usr/bin/env python3
"""Pre-render the Script B Telugu cue PNGs and the Script B offer card.

Text is Script B ('You already paid for these leads') from the PDF's
'Ad scripts - Track 1' section. The PDF's own Telugu layer is corrupted, so the
Telugu below is reconstructed from the English master, which the PDF designates
as the controlling version. Wording, figures and claims are unchanged.

Assets are prepared now so the cut can be built the moment the Script B
performance is recorded -- no source footage for Script B exists yet.

Palette is identical to the delivered Script A cut (see DELIVERY_NOTES.md).
"""
import json, os, subprocess

HARD = '\n'
FONTFILE = '/System/Library/Fonts/Supplemental/Telugu MN.ttc'
ENGFONT = 'AvenirNext-Bold'

PALETTE = {
    'fill': '#FFFFFF',
    'stroke': '#0A1219',
    'strokew': '8',
    'accent': '#FFC42E',
    'lineheight': '1.36',
    'pad': '16',
}


def png_size(p):
    import struct
    with open(p, 'rb') as f:
        d = f.read(24)
    return struct.unpack('>II', d[16:24])


def render(out, font, size, maxwidth, text=None, textfile=None, extra=()):
    cmd = [RENDER, '--out', out, '--font', font, '--size', str(size),
           '--maxwidth', str(maxwidth), '--fill', PALETTE['fill'],
           '--strokew', PALETTE['strokew'], '--stroke', PALETTE['stroke'],
           '--accent', PALETTE['accent'], '--lineheight', PALETTE['lineheight'],
           '--pad', PALETTE['pad']]
    cmd += list(extra)
    if textfile:
        cmd += ['--textfile', textfile]
    else:
        cmd += ['--text', text]
    subprocess.run(cmd, check=True, capture_output=True)
    return png_size(out)


def two_line_cap(size):
    return 2 * size * float(PALETTE['lineheight']) + 60


# Script B cues. [[...]] = amber accent (commercial terms only).
CUES = [
    ('B01', 'హైదరాబాద్ మాన్యుఫాక్చరర్స్ —\nఒక నిజాయితీ ప్రశ్న.'),
    ('B02', 'మీ చివరి 100 IndiaMART, JustDial\nఎన్క్వైరీలు.'),
    ('B03', 'అందులో ఎన్ని ఆర్డర్లుగా మారాయి?'),
    ('B04', 'ఆ ఎన్క్వైరీల కోసం మీరు సంవత్సరానికి\n[[₹50,000]], కొన్నారు [[₹1 లక్ష]] చెల్లిస్తారు.'),
    ('B05', 'అవి వస్తాయి — కానీ చాలా వరకు\nరిప్లై రాదు, లేదా మరుసటి రోజు వస్తుంది.'),
    ('B06', 'ఆ బయ్యర్ కోసం మీరు అప్పటికే\nడబ్బు కట్టారు,'),
    ('B07', 'కానీ ఉచితంగా మీ పోటీదారుకి\nఇచ్చేస్తున్నారు.'),
    ('B08', 'మీకు కొత్త ఎన్క్వైరీలు అవసరం లేదు.'),
    ('B09', 'అప్పటికే డబ్బు కట్టిన వాటిని\nకోల్పోవడం ఆపాలి.'),
    ('B10', 'మేము మీ బిజినెస్కి పూర్తి\nఆటోమేషన్ ఇన్స్టాల్ చేస్తాం.'),
    ('B11', 'ప్రతీ ఎన్క్వైరీకి [[5 సెకన్లలో]] రిప్లై.\nప్రతీ బయ్యర్కి ఫాలో-అప్.'),
    ('B12', 'ఏదీ మిస్ కాదు, ఏదీ మరిచిపోరు.'),
    ('B13', 'మేము హైదరాబాద్ మాన్యుఫాక్చరింగ్\nమార్కెట్లో కొత్త.'),
    ('B14', 'అందుకే మిమ్మల్ని నమ్మమని అడగట్లేదు\n— టెస్ట్ చేయమని అడుగుతున్నాం.'),
    ('B15', 'ఈ పండుగ సీజన్లో, పూర్తి [[14 రోజుల]]\nట్రయల్ కేవలం [[₹2,500]] కి ఇస్తున్నాం —'),
    ('B16', 'హైదరాబాద్లో కేవలం [[5]] మాన్యుఫాక్చరర్లకు.\nఈ [[5]] తర్వాత, ధర పెరుగుతుంది.'),
    ('B17', 'ఈ [[₹2,500]] మళ్ళీ రాదు.'),
    ('B18', 'కింద లింక్కి క్లిక్ చేసి\nమీ అపాయింట్మెంట్ బుక్ చేసుకోండి.'),
]


def main():
    os.makedirs('cues_B', exist_ok=True)
    os.makedirs('overlays', exist_ok=True)
    manifest = {'B': []}

    for name, txt in CUES:
        out = f'cues_B/{name}.png'
        chosen = None
        for size in (100, 94, 88, 82):
            p = f'cues_B/_tmp.png'
            tf = 'cues_B/_tmp.txt'
            with open(tf, 'w', encoding='utf-8') as f:
                f.write(txt)
            w, h = render(p, 'TeluguMN', size, 1780, textfile=tf)
            # keep the largest size that still fits within two text lines
            if h <= two_line_cap(size) + 2 * (int(PALETTE['pad']) + int(PALETTE['strokew'])):
                os.replace(p, out)
                chosen = (size, w, h)
                break
        if chosen is None:
            os.replace('cues_B/_tmp.png', out)
            chosen = (82, *png_size(out))
        size, w, h = chosen
        nlines = 1 if h < 240 else 2
        manifest['B'].append({'name': name, 'size': size, 'lines': nlines,
                              'w': w, 'h': h, 'text': txt})
        print(f'{name} size={size} {w}x{h} lines={nlines}', flush=True)

    for f in ('cues_B/_tmp.txt',):
        if os.path.exists(f):
            os.remove(f)

    # Script B offer card, verbatim from the PDF
    card = ('HYDERABAD ONLY · You paid lakhs — stop losing the leads ·\n'
            '14 DAYS · [[₹2,500]] · [[5]] MANUFACTURERS')
    with open('overlays/_cardB.txt', 'w', encoding='utf-8') as f:
        f.write(card)
    w, h = render('overlays/onscreen_B.png', ENGFONT, 62, 1900,
                  textfile='overlays/_cardB.txt',
                  extra=['--align', 'center', '--box', '#0B1B2B',
                         '--boxalpha', '0.92', '--boxpad', '52',
                         '--boxradius', '30', '--strokew', '0'])
    os.remove('overlays/_cardB.txt')
    print(f'card onscreen_B {w}x{h}', flush=True)

    json.dump(manifest, open('cues_B_manifest.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('wrote cues_B_manifest.json', flush=True)


if __name__ == '__main__':
    RENDER = os.path.abspath('render_text')
    main()
