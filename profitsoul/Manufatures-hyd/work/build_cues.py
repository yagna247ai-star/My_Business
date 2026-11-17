#!/usr/bin/env python3
"""Pre-render Telugu subtitle cue PNGs for Script A.

Text is the PDF's Script A ('Test us, don't trust us') Telugu, line for line.
The PDF specifies no colour palette, font or brand styling, so a palette was
chosen for contrast against this footage (see PALETTE below). Terms wrapped in
[[...]] are drawn in the accent colour -- used only for the commercial terms
(price / trial length / scarcity count), never to alter wording.

Palette rationale:
  background footage is a blown-out bright window (top) over a dark navy blazer
  (bottom). No single flat colour reads on both. White + heavy dark outline
  reads on both; a warm amber accent sits high-contrast on navy AND on white.
"""
import json, os, subprocess, sys

FONTFILE = '/System/Library/Fonts/Supplemental/Telugu MN.ttc'

PALETTE = {
    'fill':      '#FFFFFF',   # pure white  - base narration
    'stroke':    '#0A1219',   # near-black navy - guarantees edge separation
    'strokew':   '8',
    'accent':    '#FFC42E',   # warm amber - commercial terms only
    'lineheight': '1.36',
}
FONTSIZE = 108
MAXWIDTH = 1780
SIZES = [108, 100, 94, 88, 82]   # auto-shrink if a cue would exceed 2 lines

# Accent markup: [[...]] = accent colour.  Lines joined by explicit newline.
SCRIPTS = {
    'A': [
        ('A01', 'హైదరాబాద్ మాన్యుఫాక్చరర్స్ —\nఒక ప్రశ్న.'),
        ('A02', 'గత నెలలో మీ WhatsApp, IndiaMART,\nJustDial కి వచ్చిన ఎన్‌క్వైరీలో'),
        ('A03', 'ఎన్నింటికి ఎవరూ రిప్లై ఇవ్వలేదు?'),
        ('A04', 'మీ స్టాఫ్ ఫ్లోర్‌లో ఉంటారు.\nఫోన్ మోగుతుంది.'),
        ('A05', 'మెసేజ్ అలాగే ఉండిపోతుంది.\nసాయంత్రానికి మరిచిపోతారు —'),
        ('A06', 'ఆ బయ్యర్ అప్పటికే వేరే వారి దగ్గర\nఆర్డర్ చేసేశాడు.'),
        ('A07', 'మేము మీ బిజినెస్‌కి పూర్తి\nఆటోమేషన్ ఇన్‌స్టాల్ చేస్తాం.'),
        ('A08', 'ప్రతీ ఎన్‌క్వైరీకి వెంటనే రిప్లై.\nప్రతీ బయ్యర్‌కి ఫాలో-అప్.'),
        ('A09', 'ఏదీ మరిచిపోరు, ఏదీ మిస్ కాదు.'),
        ('A10', 'ఇప్పుడు అసలు విషయం. మేము హైదరాబాద్\nమాన్యుఫాక్చరింగ్ మార్కెట్‌లో కొత్త.'),
        ('A11', 'అందుకే మిమ్మల్ని నమ్మమని అడగట్లేదు —\nటెస్ట్ చేయమని అడుగుతున్నాం.'),
        ('A12', 'ఈ పండుగ సీజన్‌లో, పూర్తి [[14 రోజుల]]\nట్రయల్ కేవలం [[₹2,500]] కి ఇస్తున్నాం —'),
        ('A13', 'హైదరాబాద్‌లో కేవలం [[5]]\nమాన్యుఫాక్చరర్లకు మాత్రమే.'),
        ('A14', 'ఈ [[5]] తర్వాత, ధర పెరుగుతుంది.\nఈ [[₹2,500]] మళ్ళీ రాదు.'),
        ('A15', 'ఆ [[5]] మందిలో ఒకరు కావాలంటే, ఇప్పుడే\nకింద లింక్కి క్లిక్ చేసి బుక్ చేసుకోండి.'),
    ],
}

CARD = {
    'A': 'HYDERABAD ONLY · 14 DAYS · [[₹2,500]] · ONLY [[5]] MANUFACTURERS',
}


def render(out, text, size, font, extra):
    args = ['./render_text', '--out', out, '--font', font, '--size', str(size),
            '--maxwidth', str(MAXWIDTH), '--align', 'center',
            '--fill', PALETTE['fill'], '--stroke', PALETTE['stroke'],
            '--strokew', PALETTE['strokew'], '--lineheight', PALETTE['lineheight'],
            '--accent', PALETTE['accent'], '--text', text] + extra
    r = subprocess.run(args, capture_output=True, text=True)
    if r.returncode != 0:
        print('FAIL', out, r.stderr.strip()); return None
    return r.stdout.strip()


def png_size(out):
    import struct
    with open(out, 'rb') as f:
        head = f.read(33)
    w, h = struct.unpack('>II', head[16:24])
    return w, h


def main():
    os.makedirs('cues', exist_ok=True)
    os.makedirs('overlays', exist_ok=True)
    manifest = {}
    fontfile_args = ['--fontfile', FONTFILE]
    for sc, cues in SCRIPTS.items():
        entries = []
        for name, text in cues:
            chosen = None
            for size in SIZES:
                out = f'cues/{name}.png'
                res = render(out, text, size, 'TeluguMN', fontfile_args)
                if res is None:
                    continue
                w, h = png_size(out)
                two_line_cap = 2 * PALETTE_linemax(size) + 60
                if h <= two_line_cap or size == SIZES[-1]:
                    chosen = (name, size, w, h)
                    break
            if chosen:
                entries.append({'name': chosen[0], 'size': chosen[1],
                                'lines': text.split('\n'),
                                'w': chosen[2], 'h': chosen[3]})
                print(f'{chosen[0]} size={chosen[1]} {chosen[2]}x{chosen[3]}')
        # on-screen offer card (PDF on-screen text)
        card_out = f'overlays/onscreen_{sc}.png'
        render(card_out, CARD[sc], 84, 'AvenirNext-Bold',
               ['--box', '#0B1B2B', '--boxalpha', '0.92', '--boxpad', '42',
                '--boxradius', '28'])
        print('card', card_out, png_size(card_out))
        manifest[sc] = entries
    json.dump(manifest, open('cues_manifest.json', 'w', encoding='utf-8'),
              ensure_ascii=False, indent=1)
    print('manifest written')


def PALETTE_linemax(size):
    return size * float(PALETTE['lineheight'])


if __name__ == '__main__':
    main()
