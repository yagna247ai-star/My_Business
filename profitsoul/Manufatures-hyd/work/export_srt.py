#!/usr/bin/env python3
"""Export SRT sidecars (Telugu) from the alignment used for burn-in."""
import json, sys


def ts(t):
    if t < 0:
        t = 0
    h = int(t // 3600)
    m = int((t % 3600) // 60)
    s = int(t % 60)
    ms = int(round((t - int(t)) * 1000))
    if ms == 1000:
        ms = 0
        s += 1
    return f'{h:02d}:{m:02d}:{s:02d},{ms:03d}'


def main():
    A = json.load(open('alignment.json', encoding='utf-8'))
    man = json.load(open('cues_manifest.json', encoding='utf-8'))
    out = []
    for sc in A.keys():
        spec = A[sc]
        t0, _t1 = spec['range']
        blocks = []
        for c in man[sc]:
            s, e = spec['cues'][c['idx'] - 1]
            if e <= s:
                continue
            text = '\n'.join(c['lines'])
            blocks.append((s - t0, e - t0, text))
        blocks.sort()
        path = f'../Yagna_Meta_Ad_Script{sc}_Telugu.srt'
        with open(path, 'w', encoding='utf-8') as f:
            for i, (s, e, text) in enumerate(blocks, 1):
                f.write(f'{i}\n{ts(s)} --> {ts(e)}\n{text}\n\n')
        out.append(path)
        print('wrote', path, len(blocks), 'cues')
    return out


if __name__ == '__main__':
    main()
