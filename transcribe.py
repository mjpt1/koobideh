import json, sys
from faster_whisper import WhisperModel
m = WhisperModel("small.en", device="cpu", compute_type="int8")
import subprocess, numpy as np
aud = np.frombuffer(subprocess.check_output(["ffmpeg","-v","error","-i",sys.argv[1],"-ac","1","-ar","16000","-f","s16le","-"]), np.int16).astype(np.float32)/32768
segs, _ = m.transcribe(aud, word_timestamps=True, vad_filter=False, language="en")
words = [{"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)} for s in segs for w in s.words]
json.dump(words, open("words.json", "w"), indent=0)
print(len(words), words[:5], words[-3:])
