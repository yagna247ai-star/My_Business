#!/usr/bin/env python3
"""Assemble enterprise B-roll + music edition (Script A).

Layout (3840h):
  offer card   y=15% (576) top
  b-roll       y=32% (1228) centered 900x540 - above mouth, never covering face
  Telugu cues  bottom=70% (2688) below chin

B-roll inserts (from PDF concepts, not invented copy):
  A02  4.98-11.84  WhatsApp/IndiaMART/JustDial enquiry stack
  A04 15.62-26.18  Staff on floor / phone ringing / forgotten
  A07 30.80-41.85  Automation pipeline

Audio: voice (SRC) + royalty-free bed broll_music_bed.wav mixed at -22dB,
       faded in/out, then loudnorm to -14 LUFS / -1.0 dBTP.
       Bed is synthesized (Am-F-C-G pad) so 100% copyright-free.
"""
import json, os, subprocess, sys

F = '/Users/apple/Library/Accio/external-tools/v7dccae0500c8/python/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
SRC = '../hyd manufacturers .mp4'
MUSIC = 'broll_music_bed.wav'
OUTDIR = '..'
W, H = 2160, 3840
CARD_Y = int(0.150 * H)
CAP_BOTTOM = int(0.700 * H)
BROLL_Y = 750  # top window area above head, clear of face/mouth/captions

GRADE = ('hqdn3d=2.2:1.8:6:6,'
         'eq=contrast=1.05:brightness=0.012:saturation=1.05:gamma=0.98,'
         'unsharp=5:5:0.9:5:5:0.0,'
         f'scale={W}:{H}:flags=lanczos+accurate_rnd+full_chroma_int')

def run(cmd, label=''):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0:
        print(f'FAILED {label}:', ' '.join(cmd)[:500], file=sys.stderr)
        print(r.stderr[-4000:], file=sys.stderr)
        raise SystemExit(1)
    return r

def render_with_broll_music(t0, t1, items, broll_items, outname, stats=None):
    dur = t1 - t0
    cmd = [F, '-hide_banner', '-loglevel', 'error',
           '-ss', f'{t0:.3f}', '-t', f'{dur:.3f}', '-i', SRC,
           '-ss', f'{t0:.3f}', '-t', f'{dur:.3f}', '-i', MUSIC]
    # overlay inputs
    all_items = items + broll_items
    live = []
    for it in all_items:
        s, e = it['start'], it['end']
        if e <= 0.0 or s >= dur:
            continue
        live.append((it, max(0.0,s), min(dur,e)))
    for it,_,_ in live:
        cmd += ['-i', it['png']]

    # video filter: grade then overlays
    parts = [f'[0:v]{GRADE},format=rgba[bg]']
    prev='[bg]'
    for i,(it,s,e) in enumerate(live, start=1):
        vid_idx = 2 + (i-1)  # 0:src video, 1:music audio, 2+: overlays
        if it.get('kind')=='broll':
            y = str(BROLL_Y)
            tag=f'[v{i}]'
            # scale b-roll to 820 width so it sits on chest without covering face or captions
            parts.append(f"[{vid_idx}:v]scale=820:496:flags=lanczos[ov{i}]")
            parts.append(f"{prev}[ov{i}]overlay=x=(W-w)/2:y={y}:enable='between(t,{s:.3f},{e:.3f})'{tag}")
        else:
            y = f'{CAP_BOTTOM}-h' if it['anchor']=='bottom' else str(it['y'])
            tag=f'[v{i}]'
            parts.append(f"{prev}[{vid_idx}:v]overlay=x=(W-w)/2:y={y}:enable='between(t,{s:.3f},{e:.3f})'{tag}")
        prev=tag
    parts.append(f'{prev}format=yuv420p[v]')

    # audio: mix voice + music (music at -24dB to keep peak headroom)
    audio_filter = (
        "[1:a]volume=0.062,afade=t=in:st=0:d=1.2,afade=t=out:st={:.3f}:d=2.2,apad[mu];"
        "[0:a][mu]amix=inputs=2:duration=first:dropout_transition=0:normalize=0[mix];"
        "[mix]loudnorm=I=-14:TP=-1.2:LRA=7[a]"
    ).format(dur-2.2)

    filter_c = ';'.join(parts) + ';' + audio_filter
    cmd += ['-filter_complex', filter_c,
            '-map', '[v]', '-map', '[a]',
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '18',
            '-profile:v', 'high', '-level', '5.2', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
            '-movflags', '+faststart', f'{OUTDIR}/{outname}', '-y']
    run(cmd, outname)
    return f'{OUTDIR}/{outname}'

def make_upload_cut(master, outname):
    cmd = [F, '-hide_banner', '-loglevel', 'error', '-i', master,
           '-vf', 'scale=1080:1920:flags=lanczos+accurate_rnd+full_chroma_int',
           '-c:v', 'libx264', '-preset', 'medium', '-crf', '19',
           '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '30', '-g', '60',
           '-c:a', 'copy', '-movflags', '+faststart', f'{OUTDIR}/{outname}', '-y']
    run(cmd, outname)
    return f'{OUTDIR}/{outname}'

def main():
    A = json.load(open('alignment.json', encoding='utf-8'))
    man = json.load(open('cues_manifest.json', encoding='utf-8'))
    spec = A['A']
    t0,t1 = spec['range']
    dur = t1-t0

    items=[]
    for cs,ce in spec['cards']:
        items.append({'png': f'overlays/onscreen_A.png','anchor':'top','y':CARD_Y,'start':cs-t0,'end':ce-t0})
    for i,c in enumerate(man['A']):
        s,e = spec['cues'][i]
        items.append({'png': f"cues/{c['name']}.png",'anchor':'bottom','y':0,'start':s-t0,'end':e-t0,'kind':'cue'})

    # B-roll inserts: timing aligned to cues where the concept is spoken
    broll_items=[
        {'png':'broll/A02.png','anchor':'top','y':BROLL_Y,'start':4.98,'end':11.84,'kind':'broll'},
        {'png':'broll/A04.png','anchor':'top','y':BROLL_Y,'start':15.62,'end':26.18,'kind':'broll'},
        {'png':'broll/A07.png','anchor':'top','y':BROLL_Y,'start':30.80,'end':41.85,'kind':'broll'},
    ]

    mname = 'Yagna_Meta_Ad_ScriptA_BROLL_MUSIC_2160x3840_4K.mp4'
    uname = 'Yagna_Meta_Ad_ScriptA_BROLL_MUSIC_1080x1920_upload.mp4'

    print(f"Rendering {mname} with {len(items)} cue/card overlays + {len(broll_items)} b-roll + music bed...")
    render_with_broll_music(t0,t1,items,broll_items,mname)
    print("Built",mname)
    # fix audio to exact -14.0 (same finalize logic)
    import subprocess as sp
    # run finalize pass
    sp.run(['/Users/apple/Library/Accio/external-tools/v7dccae0500c8/python/bin/python3','finalize_audio.py', f'{OUTDIR}/{mname}'], check=False)
    print("Audio finalized")
    make_upload_cut(f'{OUTDIR}/{mname}', uname)
    print("Built",uname)
    json.dump([f'{OUTDIR}/{mname}', f'{OUTDIR}/{uname}'], open('outputs_broll_music.json','w'), indent=1)

if __name__=='__main__':
    main()
