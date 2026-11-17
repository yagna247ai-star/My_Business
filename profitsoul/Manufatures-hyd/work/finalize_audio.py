#!/usr/bin/env python3
"""Final corrective audio pass.

Chunked rendering applied the whole-file linear loudnorm gain to each chunk, so the
joined master lands slightly off target (measured -13.8 LUFS / -0.9 dBTP instead of
-14.0 / <= -1.0). This measures the finished file and applies one exact gain, capping
it so true peak never exceeds -1.0 dBTP. Video is stream-copied, never re-encoded.
"""
import re, shutil, subprocess, sys, os

F = '/Users/apple/Library/Accio/external-tools/v7dccae0500c8/python/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-x86_64-v7.1'
TARGET_I = -14.0
MAX_TP = -1.0


def measure(p):
    r = subprocess.run([F, '-hide_banner', '-nostats', '-i', p,
                        '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)
    if not i or not tp:
        raise RuntimeError('could not measure ' + p)
    return float(i[-1]), float(tp[-1])


def fix(p):
    i, tp = measure(p)
    gain = TARGET_I - i
    if tp + gain > MAX_TP:
        gain = MAX_TP - tp
    print(f'{os.path.basename(p)}: in {i} LUFS / {tp} dBTP -> gain {gain:+.2f} dB')
    if abs(gain) < 0.05:
        print('  already on target, no change')
        return
    tmp = p + '.fix.mp4'
    cmd = [F, '-hide_banner', '-loglevel', 'error', '-i', p,
           '-c:v', 'copy', '-af', f'volume={gain:.3f}dB',
           '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-ac', '2',
           '-movflags', '+faststart', tmp, '-y']
    subprocess.run(cmd, check=True)
    shutil.move(tmp, p)
    ni, ntp = measure(p)
    print(f'  now {ni} LUFS / {ntp} dBTP')


if __name__ == '__main__':
    for path in sys.argv[1:]:
        fix(path)
