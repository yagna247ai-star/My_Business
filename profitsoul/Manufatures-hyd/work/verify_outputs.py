#!/usr/bin/env python3
"""Verify the delivered cuts against the Meta upload checklist. Measures, does not assume."""
import re, subprocess, sys, os

F = '/Users/apple/Library/Accio/external-tools/v7dccae0500c8/python/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
BASE = '..'


def probe(path):
    r = subprocess.run([F, '-hide_banner', '-i', path], capture_output=True, text=True)
    t = r.stderr
    d = {}
    m = re.search(r'Duration: (\d+):(\d+):(\d+)\.(\d+)', t)
    if m:
        h, mi, s, cs = (int(x) for x in m.groups())
        d['duration'] = h * 3600 + mi * 60 + s + cs / 100
    m = re.search(r'Video: (\w+) \(([^)]*)\).*?, (yuv\d+p|yuvj\d+p|argb|rgba)', t)
    if m:
        d['vcodec'], d['profile'], d['pix_fmt'] = m.group(1), m.group(2), m.group(3)
    m = re.search(r'(\d{3,5})x(\d{3,5}) \[SAR', t) or re.search(r'(\d{3,5})x(\d{3,5})', t)
    if m:
        d['w'], d['h'] = int(m.group(1)), int(m.group(2))
    m = re.search(r'([\d.]+) fps', t)
    if m:
        d['fps'] = float(m.group(1))
    m = re.search(r'Audio: (\w+).*?, (\d+) Hz, (\w+), \w+, (\d+) kb/s', t)
    if m:
        d['acodec'], d['arate'], d['achan'], d['abitrate'] = m.group(1), int(m.group(2)), m.group(3), int(m.group(4))
    else:
        m = re.search(r'Audio: (\w+).*?, (\d+) Hz, (\w+)', t)
        if m:
            d['acodec'], d['arate'], d['achan'] = m.group(1), int(m.group(2)), m.group(3)
    m = re.search(r'bitrate: (\d+) kb/s', t)
    if m:
        d['vbitrate'] = int(m.group(1))
    # overall progressive flag
    d['progressive'] = 'progressive' in t
    return d


def loudness(path):
    r = subprocess.run([F, '-hide_banner', '-nostats', '-i', path,
                        '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    t = r.stderr
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', t)
    tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', t)
    lra = re.findall(r'LRA:\s+(-?[\d.]+) LU', t)
    return (float(i[-1]) if i else None,
            float(tp[-1]) if tp else None,
            float(lra[-1]) if lra else None)


def main():
    files = [f for f in sorted(os.listdir(BASE))
             if f.startswith('Yagna_Meta_Ad') and f.endswith('.mp4')]
    if not files:
        print('no deliverables found'); return 1
    ok = True
    for fn in files:
        p = os.path.join(BASE, fn)
        d = probe(p)
        size = os.path.getsize(p) / 1e6
        lufs, tp, lra = loudness(p)
        print(f'\n=== {fn} ===')
        print(f'  size           {size:.1f} MB')
        print(f'  duration       {d.get("duration", 0):.2f} s')
        print(f'  video          {d.get("vcodec")} {d.get("profile","")} {d.get("pix_fmt")}'
              f'{" progressive" if d.get("progressive") else ""}')
        print(f'  resolution     {d.get("w")}x{d.get("h")}')
        print(f'  frame rate     {d.get("fps")} fps')
        print(f'  video bitrate  {d.get("vbitrate")} kb/s')
        print(f'  audio          {d.get("acodec")} {d.get("abitrate")} kbps '
              f'{d.get("arate")} Hz {d.get("achan")}')
        print(f'  loudness       {lufs} LUFS   true peak {tp} dBTP   LRA {lra} LU')

        checks = [
            ('H.264 video codec', d.get('vcodec') == 'h264'),
            ('progressive scan', bool(d.get('progressive'))),
            ('yuv420p 8-bit', (d.get('pix_fmt') or '').startswith('yuv420p')),
            ('9:16 aspect ratio', bool(d.get('w')) and abs(d['w'] / d['h'] - 9 / 16) < 0.002),
            ('short edge >= 1080 px', min(d.get('w', 0), d.get('h', 0)) >= 1080),
            ('constant 30 fps', abs((d.get('fps') or 0) - 30) < 0.05),
            ('AAC audio', d.get('acodec') == 'aac'),
            ('audio >= 128 kbps', (d.get('abitrate') or 0) >= 128),
            ('stereo', d.get('achan') == 'stereo'),
            ('file under 4 GB', size < 4000),
            ('true peak <= -1.0 dBTP', (tp is not None) and tp <= -1.0),
            ('never clips (peak < 0)', (tp is None) or tp < 0.0),
            ('loudness within -16..-12 LUFS', (lufs is not None) and -16 <= lufs <= -12),
        ]
        for name, passed in checks:
            print(f'    [{"PASS" if passed else "FAIL"}] {name}')
            if not passed:
                ok = False
    print('\nOVERALL:', 'PASS' if ok else 'FAIL')
    return 0 if ok else 1


if __name__ == '__main__':
    sys.exit(main())
