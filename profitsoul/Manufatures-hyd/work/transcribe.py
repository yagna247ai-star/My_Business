import json, sys, wave
import numpy as np
from faster_whisper import WhisperModel

model_size = sys.argv[1] if len(sys.argv) > 1 else "small"
wav = sys.argv[2]
out = sys.argv[3]

# Load WAV manually to avoid PyAV version incompatibility inside faster-whisper's decode_audio
with wave.open(wav, "rb") as w:
    assert w.getsampwidth() == 2, "expect 16-bit PCM"
    sr = w.getframerate()
    ch = w.getnchannels()
    raw = w.readframes(w.getnframes())

audio = np.frombuffer(raw, dtype=np.int16).astype(np.float32) / 32768.0
if ch > 1:
    audio = audio.reshape(-1, ch).mean(axis=1)
assert sr == 16000, f"expected 16k, got {sr}"

model = WhisperModel(model_size, device="cpu", compute_type="int8")
segments, info = model.transcribe(audio, language="te", beam_size=5,
                                  word_timestamps=True, vad_filter=True,
                                  vad_parameters=dict(min_silence_duration_ms=300))

data = {"language": info.language, "duration": info.duration, "segments": []}
for s in segments:
    seg = {"start": round(s.start, 3), "end": round(s.end, 3), "text": s.text.strip(),
           "words": [{"w": w.word, "s": round(w.start, 3), "e": round(w.end, 3)} for w in (s.words or [])]}
    data["segments"].append(seg)
    print(f"[{s.start:7.2f} -> {s.end:7.2f}] {s.text.strip()}", flush=True)

with open(out, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=1)
print("SAVED", out)
