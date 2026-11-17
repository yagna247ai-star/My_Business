import json, wave
import numpy as np
from faster_whisper import WhisperModel

with wave.open('audio16k.wav', 'rb') as w:
    assert w.getsampwidth() == 2
    sr, ch = w.getframerate(), w.getnchannels()
    raw = w.readframes(w.getnframes())

a = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
if ch > 1:
    a = a.reshape(-1, ch).mean(axis=1)

m = WhisperModel('small', device='cpu', compute_type='int8', cpu_threads=2)
segs, info = m.transcribe(a, language='te', beam_size=1, best_of=1,
                          word_timestamps=False, vad_filter=False,
                          condition_on_previous_text=False,
                          temperature=0.0, log_progress=True)

out = []
for s in segs:
    print(f'[{s.start:7.2f} -> {s.end:7.2f}] {s.text.strip()}', flush=True)
    out.append({'start': round(s.start, 3), 'end': round(s.end, 3), 'text': s.text.strip()})

json.dump(out, open('asr_segments.json', 'w'), ensure_ascii=False, indent=1)
print('SAVED asr_segments.json')
