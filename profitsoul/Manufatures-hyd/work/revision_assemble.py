#!/usr/bin/env python3
"""Revision assembly for Enterprise Brief: 30s master, 40s balanced, 15s cutdown.
Uses same grading, palette, and loudnorm as assemble.py.
Produces 2160x3840 master + 1080x1920 upload + clean + SRT.
"""
import json, os, subprocess, sys, math

F = '/Users/apple/Library/Accio/external-tools/v7dccae0500c8/python/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
SRC = '../hyd manufacturers .mp4'
OUTDIR = '..'
W, H = 2160, 3840
CARD_Y = int(0.150 * H)
CAP_BOTTOM = int(0.700 * H)
GRADE = ('hqdn3d=2.2:1.8:6:6,'
         'eq=contrast=1.05:brightness=0.012:saturation=1.05:gamma=0.98,'
         'unsharp=5:5:0.9:5:5:0.0,'
         f'scale={W}:{H}:flags=lanczos+accurate_rnd+full_chroma_int')

# specs: segments as (start,end) in source; cues as list of (name, src_start, src_end)
# Cue src times from alignment.json
CUE_TIMES = {
    'A01': (1.58, 4.98),
    'A02': (4.98, 11.84),
    'A03': (11.84, 15.62),
    'A04': (15.62, 19.82),
    'A05': (19.82, 26.18),
    'A06': (26.18, 30.80),
    'A07': (30.80, 34.60),
    'A08': (34.60, 39.30),
    'A09': (39.30, 41.85),
    'A10': (41.85, 45.81),
    'A11': (45.81, 51.98),
    'A12': (51.98, 63.10),
    'A13': (63.13, 67.50),
    'A14': (67.50, 70.71),
    'A15': (70.71, 74.43),
}

VERSIONS = {
    '30s': {
        'desc': 'Aggressive 30s master — hook + enquiry + automation + offer + CTA',
        'segments': [(1.58, 11.84), (30.80, 34.60), (51.98, 63.10), (70.71, 74.43)],
        'cues': ['A01','A02','A07','A12','A15'],
        'card_src': (51.98, 63.10),
        'target_dur': 28.9,
    },
    '40s': {
        'desc': 'Balanced 40s — retains pain beat, recommended primary',
        'segments': [(1.58, 11.84), (19.82, 26.18), (30.80, 39.30), (51.98, 63.10), (70.71, 74.43)],
        'cues': ['A01','A02','A05','A07','A08','A12','A15'],
        'card_src': (51.98, 63.10),
        'target_dur': 39.96,
    },
    '15s': {
        'desc': '15s cutdown — hook, benefit, offer, CTA',
        'segments': [(1.58, 4.98), (34.60, 39.30), (51.98, 56.50), (70.71, 73.00)],
        'cues': ['A01','A08','A12','A15'],
        'card_src': (51.98, 56.50),
        'target_dur': 14.91,
    },
}

def run(cmd, label=''):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f'FAILED {label}:', ' '.join(cmd)[:500], file=sys.stderr)
        print(r.stderr[-4000:], file=sys.stderr)
        raise SystemExit(1)
    return r

def build_timeline(segments):
    """return cum_offsets: list of (src_start, src_end, out_start, out_end)"""
    out = []
    t=0
    for s,e in segments:
        dur=e-s
        out.append((s,e,t,t+dur))
        t+=dur
    return out, t

def cue_to_output(cue_src, timeline):
    cs, ce = cue_src
    for s,e, os_, oe in timeline:
        # check overlap
        if ce <= s or cs >= e:
            continue
        # cue fully inside this segment (for our versions it is)
        if cs >= s and ce <= e:
            ns = cs - s + os_
            ne = ce - s + os_
            return (ns, ne)
        # partial overlap (truncate)
        # for 15s case A12 truncated
        if cs < e and ce > e:
            # cue extends beyond segment end — truncate to segment end
            ns = max(cs, s) - s + os_
            ne = e - s + os_
            return (ns, ne)
        if cs < s and ce > s:
            ns = os_
            ne = min(ce, e) - s + os_
            return (ns, ne)
    return None

def render_version(name):
    spec = VERSIONS[name]
    segs = spec['segments']
    cues = spec['cues']
    card_src = spec['card_src']
    timeline, total = build_timeline(segs)
    print(f"\n=== {name} ({spec['desc']}) segments={segs} total={total:.2f}s ===")
    # clean master name
    base = f"Yagna_Revision_{name}_2160x3840_4K"
    clean_name = f"{base}_CLEAN.mp4"
    master_name = f"{base}.mp4"
    upload_name = f"Yagna_Revision_{name}_1080x1920_upload.mp4"
    upload_clean = f"Yagna_Revision_{name}_1080x1920_CLEAN_upload.mp4"

    # Build filter_complex for concat
    # video trims: [0:v]trim=start=X:end=Y,setpts=PTS-STARTPTS[v0]; ...
    # audio trims similarly
    vf_parts = []
    af_parts = []
    for i,(s,e) in enumerate(segs):
        vf_parts.append(f"[0:v]trim=start={s:.3f}:end={e:.3f},setpts=PTS-STARTPTS[v{i}]")
        af_parts.append(f"[0:a]atrim=start={s:.3f}:end={e:.3f},asetpts=PTS-STARTPTS[a{i}]")
    vcat = ''.join([f"[v{i}]" for i in range(len(segs))])
    acat = ''.join([f"[a{i}]" for i in range(len(segs))])
    vf_parts.append(f"{vcat}concat=n={len(segs)}:v=1:a=0[vcat]")
    af_parts.append(f"{acat}concat=n={len(segs)}:v=0:a=1[acat]")
    # grade
    vf_parts.append(f"[vcat]{GRADE},format=rgba[bg]")

    # prepare overlay items with new timing
    items = []
    # card
    card_out = cue_to_output(card_src, timeline)
    if card_out:
        items.append({'png': 'overlays/onscreen_A.png', 'anchor':'top', 'y': CARD_Y, 'start': card_out[0], 'end': card_out[1]})
        print(f" card {card_src} -> {card_out}")
    for cn in cues:
        cs, ce = CUE_TIMES[cn]
        out = cue_to_output((cs,ce), timeline)
        if out:
            # for truncated A12 in 15s case, still use full png but show truncated duration
            items.append({'png': f'cues/{cn}.png', 'anchor':'bottom', 'y': 0, 'start': out[0], 'end': out[1]})
            print(f" {cn} {cs}-{ce} -> {out}")

    # Build final overlay chain
    # filter_complex needs all inputs: 0:v, 0:a, plus each png
    # We'll construct cmd for CLEAN first (no overlays), then for MASTER (with overlays)
    # For CLEAN: just grade + audio

    # loudnorm stats: measure first segment concatenation approx by measuring whole segments duration - reuse single pass loudnorm linear
    # Simple: use single-pass loudnorm=I=-14:TP=-1:LRA=7 for now; two-pass would need stats

    def build_cmd(with_overlays, outname):
        cmd = [F, '-hide_banner', '-loglevel', 'error', '-i', SRC]
        # add overlay inputs
        if with_overlays:
            for it in items:
                cmd += ['-i', it['png']]
        # build filter_complex
        fc = ';'.join(vf_parts + af_parts)
        # add overlay chain if needed
        if with_overlays and items:
            # overlay chain starts from [bg]
            prev = '[bg]'
            for i, it in enumerate(items, start=1):
                y = f'{CAP_BOTTOM}-h' if it['anchor']=='bottom' else str(it['y'])
                tag = f'[v{i+len(segs)*2}]'  # unique
                # need to reference png stream index: 1..len(items)
                fc += f";{prev}[{i}:v]overlay=x=(W-w)/2:y={y}:enable='between(t,{it['start']:.3f},{it['end']:.3f})'{tag}"
                prev = tag
            fc += f";{prev}format=yuv420p[v]"
        else:
            fc += ";[bg]format=yuv420p[v]"
        # audio: loudnorm + afade for segment joints (tiny 0.05s crossfade to avoid clicks)
        # Use loudnorm single pass + small fade at each concat boundary
        # Add 30ms fade in/out at each joint via acrossfade? Simpler: just loudnorm
        fc += ";[acat]loudnorm=I=-14:TP=-1.0:LRA=7[a]"
        cmd += ['-filter_complex', fc, '-map', '[v]', '-map', '[a]',
                '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
                '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
                '-movflags', '+faststart', f'{OUTDIR}/{outname}', '-y']
        return cmd

    # render clean
    print(f" rendering CLEAN {clean_name}")
    cmd = build_cmd(False, clean_name)
    run(cmd, clean_name)
    print(f"  built {clean_name}")

    # render master with overlays
    print(f" rendering MASTER {master_name}")
    cmd = build_cmd(True, master_name)
    run(cmd, master_name)
    print(f"  built {master_name}")

    # upload cuts (downscale)
    def make_upload(src, dst):
        cmd = [F, '-hide_banner', '-loglevel', 'error', '-i', f'{OUTDIR}/{src}',
               '-vf', 'scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int',
               '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
               '-c:a', 'copy', '-movflags', '+faststart', f'{OUTDIR}/{dst}', '-y']
        run(cmd, dst)
        print(f"  built upload {dst}")

    make_upload(clean_name, upload_clean)
    make_upload(master_name, upload_name)

    # SRT generation with new timings
    # use same cue text as build_cues.py but truncated timing
    srt_lines = []
    # Map cue names to text
    cue_texts = {
        'A01': "హైదరాబాద్ మాన్యుఫాక్చరర్స్ —\nఒక ప్రశ్న.",
        'A02': "గత నెలలో మీ WhatsApp, IndiaMART,\nJustDial కి వచ్చిన ఎన్‌క్వైరీలో",
        'A03': "ఎన్నింటికి ఎవరూ రిప్లై ఇవ్వలేదు?",
        'A04': "మీ స్టాఫ్ ఫ్లోర్‌లో ఉంటారు.\nఫోన్ మోగుతుంది.",
        'A05': "మెసేజ్ అలాగే ఉండిపోతుంది.\nసాయంత్రానికి మరిచిపోతారు —",
        'A06': "ఆ బయ్యర్ అప్పటికే వేరే వారి దగ్గర\nఆర్డర్ చేసేశాడు.",
        'A07': "మేము మీ బిజినెస్‌కి పూర్తి\nఆటోమేషన్ ఇన్‌స్టాల్ చేస్తాం.",
        'A08': "ప్రతీ ఎన్‌క్వైరీకి వెంటనే రిప్లై.\nప్రతీ బయ్యర్‌కి ఫాలో-అప్.",
        'A09': "ఏదీ మరిచిపోరు, ఏదీ మిస్ కాదు.",
        'A10': "ఇప్పుడు అసలు విషయం. మేము హైదరాబాద్\nమాన్యుఫాక్చరింగ్ మార్కెట్‌లో కొత్త.",
        'A11': "అందుకే మిమ్మల్ని నమ్మమని అడగట్లేదు —\nటెస్ట్ చేయమని అడుగుతున్నాం.",
        'A12': "ఈ పండుగ సీజన్‌లో, పూర్తి 14 రోజుల\nట్రయల్ కేవలం ₹2,500 కి ఇస్తున్నాం —",
        'A13': "హైదరాబాద్‌లో కేవలం 5\nమాన్యుఫాక్చరర్లకు మాత్రమే.",
        'A14': "ఈ 5 తర్వాత, ధర పెరుగుతుంది.\nఈ ₹2,500 మళ్ళీ రాదు.",
        'A15': "ఆ 5 మందిలో ఒకరు కావాలంటే, ఇప్పుడే\nకింద లింక్కి క్లిక్ చేసి బుక్ చేసుకోండి.",
    }
    def fmt(t):
        ms = int((t - math.floor(t))*1000)
        s = int(t) % 60
        m = int(t)//60 % 60
        h = int(t)//3600
        return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"
    srt_path = f"{OUTDIR}/Yagna_Revision_{name}_Telugu.srt"
    with open(srt_path, 'w', encoding='utf-8') as f:
        idx=1
        for cn in cues:
            out = cue_to_output(CUE_TIMES[cn], timeline)
            if not out: continue
            f.write(f"{idx}\n{fmt(out[0])} --> {fmt(out[1])}\n{cue_texts[cn]}\n\n")
            idx+=1
    print(f"  built SRT {srt_path} with {idx-1} cues")

    return total

if __name__ == '__main__':
    args = sys.argv[1:]
    targets = args if args else list(VERSIONS.keys())
    for t in targets:
        if t not in VERSIONS:
            print(f"unknown version {t}, choose from {list(VERSIONS.keys())}")
            continue
        render_version(t)
