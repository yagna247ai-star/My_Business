#!/usr/bin/env python3
"""Assemble the Meta-ready vertical ad cuts (Script A / Script B).

Layout (of 3840 px height):
  offer card    top edge  y = 15.0%  (576)  -> inside Meta 9:16 safe band (top 14% kept clear)
  Telugu cues   bottom     y = 70.0%  (2688) -> below subject's chin, mouth kept clear

Deliverables per script:
  <name>_2160x3840_4K.mp4        master, 2160x3840
  <name>_1080x1920_upload.mp4    Meta upload cut, 1080x1920
"""
import json, os, subprocess, sys

F = '/Users/apple/Library/Accio/external-tools/v7dccae0500c8/python/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
SRC = '../hyd manufacturers .mp4'
OUTDIR = '..'
W, H = 2160, 3840
CARD_Y = int(0.150 * H)
CAP_BOTTOM = int(0.700 * H)

# Sharpening runs BEFORE the upscale (at 480x854 instead of 2160x3840) and the
# per-pixel grain generator was dropped: measured 71s -> 15s per 5s of output,
# with no visible quality loss (comparison in work/grade/chain_cmp.png).
GRADE = ('hqdn3d=2.2:1.8:6:6,'
         'eq=contrast=1.05:brightness=0.012:saturation=1.05:gamma=0.98,'
         'unsharp=5:5:0.9:5:5:0.0,'
         f'scale={W}:{H}:flags=lanczos+accurate_rnd+full_chroma_int')


def run(cmd, label=''):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f'FAILED {label}:', ' '.join(cmd)[:300], file=sys.stderr)
        print(r.stderr[-3000:], file=sys.stderr)
        raise SystemExit(1)
    return r


def loudnorm_pass(t0, dur):
    r = subprocess.run([F, '-hide_banner', '-nostats', '-ss', f'{t0:.3f}',
                        '-t', f'{dur:.3f}', '-i', SRC,
                        '-af', 'loudnorm=I=-14:TP=-1.0:LRA=7:print_format=json',
                        '-f', 'null', '-'], capture_output=True, text=True)
    txt = r.stderr
    a, b = txt.rfind('{'), txt.rfind('}')
    if a == -1:
        return None
    try:
        return json.loads(txt[a:b + 1])
    except Exception:
        return None


def render(t0, t1, items, outname, stats, origin=0.0):
    """items: list of dicts {png, anchor, y, start, end} with times relative to the
    full-timeline start. `origin` is how far this render starts into that timeline,
    so chunked renders shift the overlay enable windows accordingly."""
    dur = t1 - t0
    cmd = [F, '-hide_banner', '-loglevel', 'error',
           '-ss', f'{t0:.3f}', '-t', f'{dur:.3f}', '-i', SRC]

    # keep only the overlays (and inputs) that actually appear inside this window
    live = []
    for it in items:
        s, e = it['start'] - origin, it['end'] - origin
        if e <= 0.0 or s >= dur:
            continue
        live.append((it, max(0.0, s), min(dur, e)))
    for it, _, _ in live:
        cmd += ['-i', it['png']]

    parts = [f'[0:v]{GRADE},format=rgba[bg]']
    prev = '[bg]'
    for i, (it, s, e) in enumerate(live, start=1):
        y = f'{CAP_BOTTOM}-h' if it['anchor'] == 'bottom' else str(it['y'])
        tag = f'[v{i}]'
        parts.append(
            f"{prev}[{i}:v]overlay=x=(W-w)/2:y={y}:"
            f"enable='between(t,{s:.3f},{e:.3f})'{tag}")
        prev = tag
    parts.append(f'{prev}format=yuv420p[v]')

    if stats:
        af = (f"loudnorm=I=-14:TP=-1.0:LRA=7:linear=true:"
              f"measured_I={stats['input_i']}:measured_TP={stats['input_tp']}:"
              f"measured_LRA={stats['input_lra']}:measured_thresh={stats['input_thresh']}:"
              f"offset={stats['target_offset']}")
    else:
        af = 'loudnorm=I=-14:TP=-1.0:LRA=7'

    cmd += ['-filter_complex', ';'.join(parts), '-map', '[v]', '-map', '0:a?', '-af', af,
            '-c:v', 'h264_videotoolbox', '-b:v', '45M', '-maxrate', '55M', '-bufsize', '90M',
            '-profile:v', 'high', '-level', '5.2', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
            '-movflags', '+faststart', f'{OUTDIR}/{outname}', '-y']
    run(cmd, outname)
    return f'{OUTDIR}/{outname}'


def make_upload_cut(master, outname):
    cmd = [F, '-hide_banner', '-loglevel', 'error', '-i', master,
           '-vf', 'scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int',
           '-c:v', 'h264_videotoolbox', '-b:v', '12M', '-maxrate', '14M', '-bufsize', '24M',
           '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
           '-c:a', 'copy', '-movflags', '+faststart', f'{OUTDIR}/{outname}', '-y']
    run(cmd, outname)
    return f'{OUTDIR}/{outname}'


def concat_parts(parts, outname):
    """Join chunk renders without re-encoding (identical encoder settings)."""
    lst = 'concat_list.txt'
    with open(lst, 'w') as f:
        for p in parts:
            f.write(f"file '{os.path.abspath(p)}'\n")
    cmd = [F, '-hide_banner', '-loglevel', 'error', '-f', 'concat', '-safe', '0',
           '-i', lst, '-c', 'copy', '-movflags', '+faststart',
           f'{OUTDIR}/{outname}', '-y']
    run(cmd, outname)
    return f'{OUTDIR}/{outname}'


def main():
    # Steps are separate so no single run can exceed the background time limit:
    #   python3 assemble.py 4k                -> whole master in one pass
    #   python3 assemble.py chunk <n> <i>     -> chunk i of n
    #   python3 assemble.py concat <n>        -> join the n chunks
    #   python3 assemble.py upload            -> 1080x1920 cut from the master
    args = sys.argv[1:]
    step = args[0] if args else 'all'
    A = json.load(open('alignment.json', encoding='utf-8'))
    man = json.load(open('cues_manifest.json', encoding='utf-8'))
    outputs = []

    for sc in A.keys():
        spec = A[sc]
        t0, t1 = spec['range']
        dur = t1 - t0

        items = []
        for cs, ce in spec['cards']:
            if ce > cs:
                items.append({'png': f'overlays/onscreen_{sc}.png', 'anchor': 'top',
                              'y': CARD_Y, 'start': cs - t0, 'end': ce - t0})
        for i, c in enumerate(man[sc]):
            s, e = spec['cues'][i]
            if e > s:
                items.append({'png': f"cues/{c['name']}.png", 'anchor': 'bottom',
                              'y': 0, 'start': s - t0, 'end': e - t0})

        base = f'Yagna_Meta_Ad_Script{sc}'
        mname = f'{base}_2160x3840_4K.mp4'
        uname = f'{base}_1080x1920_upload.mp4'

        # cache the loudness measurement so steps can run independently
        cache = f'loudnorm_{sc}.json'
        if os.path.exists(cache):
            stats = json.load(open(cache))
            if not stats:
                stats = None
        else:
            stats = loudnorm_pass(t0, dur)
            json.dump(stats or {}, open(cache, 'w'), indent=1)

        if step in ('all', '4k'):
            render(t0, t1, items, mname, stats)
            outputs.append(f'{OUTDIR}/{mname}')
            print('built', mname, flush=True)

        elif step == 'chunk':
            n, i = int(args[1]), int(args[2])
            seg = dur / n
            a0 = t0 + (i - 1) * seg
            a1 = t1 if i == n else t0 + i * seg
            pname = f'{base}_part{i}.mp4'
            render(a0, a1, items, pname, stats, origin=a0 - t0)
            print(f'built {pname} ({a0:.2f}-{a1:.2f}s)', flush=True)

        elif step == 'concat':
            n = int(args[1])
            parts = [f'{OUTDIR}/{base}_part{i}.mp4' for i in range(1, n + 1)]
            missing = [p for p in parts if not os.path.exists(p)]
            if missing:
                print('MISSING CHUNKS:', missing, flush=True)
                sys.exit(1)
            concat_parts(parts, mname)
            print('concatenated ->', mname, flush=True)
            outputs.append(f'{OUTDIR}/{mname}')

        if step in ('all', 'upload'):
            make_upload_cut(f'{OUTDIR}/{mname}', uname)
            outputs.append(f'{OUTDIR}/{uname}')
            print('built', uname, flush=True)

    json.dump(outputs, open('outputs.json', 'w'), indent=1)


if __name__ == '__main__':
    main()
