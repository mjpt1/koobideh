"""Koobideh reel: 1080x1920 motion graphics, beat-reactive, lyrics captions.
Usage: python make_reel.py "<mp3>" out.mp4 [seconds_limit]
"""
import sys, math, random, subprocess, re
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

MP3, OUT = sys.argv[1], sys.argv[2]
LIMIT = float(sys.argv[3]) if len(sys.argv) > 3 else None
W, H, FPS = 1080, 1920, 30

# ---------- audio ----------
dur = float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                     "-of", "csv=p=0", MP3]).decode().strip())
tags = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format_tags=lyrics-eng",
                                "-of", "default=nw=1:nk=1", MP3]).decode("utf-8")
SR = 8000
pcm = np.frombuffer(subprocess.check_output(["ffmpeg", "-v", "error", "-i", MP3, "-ac", "1", "-ar", str(SR),
                                             "-f", "s16le", "-"]), np.int16).astype(np.float32)
hop = SR // FPS
nfr = int(dur * FPS)
rms = np.array([np.sqrt(np.mean(pcm[i*hop:(i+1)*hop]**2) + 1e-9) for i in range(nfr)])
env = rms / (np.percentile(rms, 98) + 1e-9)
env = np.clip(env, 0, 1.2)
# beat pulse = positive jump vs short moving average
avg = np.convolve(env, np.ones(8)/8, "same")
pulse = np.clip((env - avg) * 4, 0, 1)
for i in range(1, nfr):  # decay
    pulse[i] = max(pulse[i], pulse[i-1] * 0.82)

# ---------- lyrics timing ----------
sections = []  # (name, [lines])
for ln in tags.splitlines():
    ln = ln.strip()
    if not ln:
        continue
    m = re.match(r"\[(.+?)\]", ln)
    if m:
        sections.append([m.group(1), []])
    elif sections:
        sections[-1][1].append(ln)
# shortcut: vocals spread evenly over 3s..dur-4s weighted by line count (no forced alignment available)
start, end, GAP = 3.0, dur - 4.0, 2.5
total_lines = sum(len(s[1]) for s in sections)
per_line = (end - start - GAP * (len(sections) - 1)) / total_lines
timeline, t = [], start  # (t0, t1, section_idx, line)
sec_spans = []
for si, (name, lines) in enumerate(sections):
    s0 = t
    for l in lines:
        timeline.append((t, t + per_line, si, l))
        t += per_line
    sec_spans.append((s0 - (GAP if si else s0), t))
    t += GAP
sec_spans[0] = (0, sec_spans[0][1])
# real timing from song2mv sync (overrides the estimate above)
import json, os
_mv = os.path.join(os.path.dirname(os.path.abspath(__file__)), "song2mv-work/song2mv-work/koobideh/mv.json")
if os.path.exists(_mv):
    mv = json.load(open(_mv, encoding="utf-8"))
    GAP = 0.0
    sid = {s["id"]: i for i, s in enumerate(mv["sections"])}
    sec_spans = [(s["start"], s["end"]) for s in mv["sections"]]
    timeline = [(l["start"] - 0.15, l["end"] + 0.35, sid[l["section"]], l["text"]) for l in mv["lines"]]

def section_at(tt):
    for i, (a, b) in enumerate(sec_spans):
        if tt < b + GAP:
            return i, (tt - a) / max(b + GAP - a, 1)
    return len(sec_spans) - 1, 1.0

def line_at(tt):
    for a, b, si, l in timeline:
        if a <= tt < b:
            return l, (tt - a) / (b - a)
    return None, 0

# ---------- drawing helpers ----------
def font(size, bold=True):
    for p in (["C:/Windows/Fonts/segoeuib.ttf", "C:/Windows/Fonts/arialbd.ttf"] if bold else
              ["C:/Windows/Fonts/segoeui.ttf", "C:/Windows/Fonts/arial.ttf"]):
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()
F_BIG, F_MID, F_CAP, F_SM = font(150), font(84), font(62), font(40, False)

PALETTES = {  # bg top, bg bottom, accent
    "Intro": ((40, 8, 8), (150, 40, 10), (255, 190, 60)),
    "Verse 1": ((20, 40, 25), (90, 120, 40), (255, 230, 120)),
    "Pre-Chorus": ((50, 20, 60), (170, 60, 90), (255, 200, 90)),
    "Chorus": ((60, 5, 5), (230, 90, 20), (255, 235, 140)),
    "Verse 2": ((30, 25, 45), (110, 80, 60), (255, 200, 120)),
    "Verse 3": ((10, 10, 15), (120, 30, 10), (255, 120, 40)),
    "Bridge": ((70, 45, 5), (220, 160, 40), (255, 250, 210)),
    "Final Chorus": ((80, 5, 30), (250, 110, 30), (255, 240, 150)),
    "Outro": ((25, 10, 5), (110, 50, 20), (255, 200, 90)),
}
def pal(si):
    name = sections[si][0]
    for k in sorted(PALETTES, key=len, reverse=True):
        if name.startswith(k):
            return k, PALETTES[k]
    return "Intro", PALETTES["Intro"]

grad_cache = {}
def gradient(top, bot):
    key = (top, bot)
    if key not in grad_cache:
        a = np.linspace(0, 1, H)[:, None, None]
        g = (np.array(top) * (1 - a) + np.array(bot) * a).astype(np.uint8)
        grad_cache[key] = np.repeat(g, W, axis=1)
    return grad_cache[key]

def blend_bg(si, prog):
    _, (t1, b1, _) = pal(si)
    img = gradient(t1, b1)
    if prog < 0.06 and si > 0:  # crossfade from previous section
        _, (t0, b0, _) = pal(si - 1)
        k = prog / 0.06
        img = (gradient(t0, b0) * (1 - k) + img * k).astype(np.uint8)
    return Image.fromarray(img).convert("RGBA")

random.seed(7)
EMBERS = [[random.uniform(0, W), random.uniform(0, H), random.uniform(1, 4), random.uniform(3, 9)] for _ in range(70)]
CONFETTI = [[random.uniform(0, W), random.uniform(-H, 0), random.uniform(4, 10),
             random.choice([(255, 60, 60), (255, 210, 40), (60, 200, 90), (255, 255, 255)]),
             random.uniform(0, 6.28)] for _ in range(90)]

def flame(d, cx, cy, w, h, t, amp):
    for k, col in enumerate([(255, 80, 0), (255, 150, 20), (255, 230, 120)]):
        s = 1 - k * 0.3
        pts = []
        for j in range(21):
            a = j / 20 * math.pi
            r = w * s * 0.5
            x = cx + math.cos(a) * r
            yb = cy
            pts.append((x, yb))
        tip = cy - h * s * (0.8 + 0.4 * amp + 0.1 * math.sin(t * 9 + cx))
        sway = math.sin(t * 6 + cx * 0.01) * w * 0.25
        poly = [(cx - w * s * 0.5, cy)] + [
            (cx - w * s * 0.5 + w * s * j / 10 + sway * math.sin(j / 10 * math.pi) * 0.5,
             cy - (h * s * (0.4 + 0.6 * math.sin(j / 10 * math.pi))) * (0.8 + 0.4 * amp)) for j in range(11)
        ] + [(cx, tip + 0), (cx + w * s * 0.5, cy)]
        d.polygon([(cx - w * s * .5, cy), (cx - w * s * .25 + sway * .3, cy - h * s * .5 * (1 + amp * .3)),
                   (cx + sway, tip), (cx + w * s * .25 + sway * .3, cy - h * s * .5 * (1 + amp * .3)),
                   (cx + w * s * .5, cy)], fill=col + (230,))

def skewer(d, x0, y, length, t, cooked, ridges=True, angle_wobble=0.0):
    y = y + angle_wobble
    d.rectangle([x0 - 60, y - 6, x0 + length + 60, y + 6], fill=(200, 200, 210))
    d.ellipse([x0 - 90, y - 18, x0 - 54, y + 18], fill=(170, 120, 60))
    raw, done = np.array([200, 90, 90]), np.array([120, 60, 25])
    col = tuple(int(c) for c in raw * (1 - cooked) + done * cooked)
    d.rounded_rectangle([x0, y - 42, x0 + length, y + 42], radius=40, fill=col)
    if ridges:
        dark = tuple(max(0, c - 45) for c in col)
        for k in range(1, 9):
            x = x0 + length * k / 9
            d.line([x, y - 38, x, y + 38], fill=dark, width=7)

def onion(d, cx, cy, r):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(235, 220, 240))
    for k in range(1, 4):
        rr = r * (1 - k * 0.22)
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr], outline=(190, 150, 200), width=5)
    d.polygon([(cx - 12, cy - r + 4), (cx, cy - r - 40), (cx + 12, cy - r + 4)], fill=(120, 170, 70))

def tomato(d, cx, cy, r, charred=True):
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(220, 50, 40))
    if charred:
        for a in (0.4, 2.1, 4.0):
            d.ellipse([cx + math.cos(a) * r * .5 - 14, cy + math.sin(a) * r * .5 - 10,
                       cx + math.cos(a) * r * .5 + 14, cy + math.sin(a) * r * .5 + 10], fill=(70, 20, 15))
    d.polygon([(cx - 20, cy - r + 6), (cx, cy - r - 14), (cx + 20, cy - r + 6)], fill=(60, 140, 60))

def rice_plate(d, cx, cy, s, t):
    d.ellipse([cx - 360 * s, cy - 90 * s, cx + 360 * s, cy + 110 * s], fill=(245, 245, 240))
    d.ellipse([cx - 320 * s, cy - 70 * s, cx + 320 * s, cy + 80 * s], fill=(225, 225, 220))
    d.pieslice([cx - 230 * s, cy - 260 * s, cx + 230 * s, cy + 160 * s], 180, 360, fill=(255, 250, 235))
    d.pieslice([cx - 230 * s, cy - 260 * s, cx + 230 * s, cy + 160 * s], 230, 310, fill=(255, 190, 40))  # saffron
    by = cy - 220 * s + 6 * math.sin(t * 3)
    d.rounded_rectangle([cx - 40 * s, by, cx + 40 * s, by + 40 * s], radius=8, fill=(255, 230, 120))

def text_center(d, y, txt, f, fill, stroke=(0, 0, 0), sw=6, maxw=W - 120):
    words, lines, cur = txt.split(), [], ""
    for w_ in words:
        tryl = (cur + " " + w_).strip()
        if d.textlength(tryl, font=f) > maxw and cur:
            lines.append(cur); cur = w_
        else:
            cur = tryl
    lines.append(cur)
    lh = f.size * 1.18
    y0 = y - lh * len(lines) / 2
    for i, l in enumerate(lines):
        d.text((W / 2, y0 + i * lh + lh / 2), l, font=f, fill=fill, anchor="mm", stroke_width=sw, stroke_fill=stroke)

# ---------- scenes ----------
def scene(d, key, t, prog, a, p, acc):
    cx = W / 2
    if key == "Intro":
        for k in range(5):
            flame(d, 160 + k * 190, 1500, 170, 330, t + k, a)
        d.rectangle([0, 1500, W, H], fill=(40, 15, 5))
        s = 1 + p * 0.15
        text_center(d, 560, "PERSIAN", font(int(110 * s)), acc)
        text_center(d, 720, "KOOBIDEH", font(int(150 * s)), (255, 255, 255))
    elif key == "Verse 1":
        bob = math.sin(t * 4) * 15
        d.rounded_rectangle([200, 820 + bob, 640, 1120 + bob], radius=60, fill=(200, 70, 80))
        for k in range(6):
            d.ellipse([230 + k * 65, 860 + bob + (k % 2) * 140, 280 + k * 65, 900 + bob + (k % 2) * 140], fill=(245, 200, 200))
        onion(d, 820, 960 - bob, 120 * (1 + p * .12))
        onion(d, 760, 1240 + bob, 90)
        onion(d, 900, 1250 - bob, 80)
        for k, (nm, col) in enumerate([("SALT", (250, 250, 250)), ("PEPPER", (60, 60, 60)), ("TURMERIC", (240, 180, 20))]):
            x = 230 + k * 280
            y = 1360 + math.sin(t * 5 + k) * 10
            d.rounded_rectangle([x, y, x + 180, y + 220], radius=30, fill=col, outline=(0, 0, 0), width=5)
            d.text((x + 90, y + 260), nm, font=F_SM, fill=(255, 255, 255), anchor="mm")
    elif key == "Pre-Chorus":
        d.ellipse([190, 900, 890, 1360], fill=(230, 230, 235))
        d.ellipse([230, 920, 850, 1150], fill=(160, 60, 70))
        for k in range(8):  # swirl marks
            ang = t * 4 + k * math.pi / 4
            x, y = cx + math.cos(ang) * 210, 1035 + math.sin(ang) * 70
            d.ellipse([x - 26, y - 18, x + 26, y + 18], fill=(210, 110, 110))
        hx = cx + math.cos(t * 4) * 120
        d.ellipse([hx - 90, 760 - p * 40, hx + 90, 930 - p * 40], fill=(240, 190, 150))
    elif key in ("Chorus", "Final Chorus"):
        d.rectangle([60, 1230, W - 60, 1290], fill=(60, 60, 70))
        for k in range(14):
            cxx = 100 + k * 68
            d.ellipse([cxx - 30, 1260, cxx + 30, 1320], fill=(255, int(60 + 120 * a), 0))
        for k in range(4):
            flame(d, 170 + k * 250, 1240, 160, 200, t + k, a)
        for k in range(3):
            y = 1060 + k * 70 + math.sin(t * 8 + k) * 6 * (1 + p)
            skewer(d, 170, y, 740, t, 0.5 + 0.5 * math.sin(t + k) ** 2)
        ws = ["KOO", "BI", "DEH!"]
        beat = int(t * 2.2) % 3
        for k, w_ in enumerate(ws):
            sz = 170 if k == beat else 130
            d.text((W / 2 + (k - 1) * 330, 520 + (k == beat) * -20 * (1 + p)), w_, font=font(int(sz * (1 + p * .1))),
                   fill=acc if k == beat else (255, 255, 255), anchor="mm", stroke_width=8, stroke_fill=(0, 0, 0))
        if key == "Final Chorus":
            for c in CONFETTI:
                c[1] += c[2] * (1 + a); c[4] += 0.1
                if c[1] > H: c[1] -= H + 50
                x = c[0] + math.sin(c[4]) * 30
                d.rectangle([x, c[1], x + 16, c[1] + 26], fill=c[3])
    elif key == "Verse 2":
        hand_x = 170 + (t * 160) % 740
        skewer(d, 170, 1050, 740, t, 0.0, ridges=True)
        d.ellipse([hand_x - 70, 930, hand_x + 70, 1060], fill=(240, 190, 150))
        for k in range(5):
            r = 30 + 12 * math.sin(t * 6 + k)
            d.ellipse([200 + k * 170 - r, 1400 - r, 200 + k * 170 + r, 1400 + r], fill=(120, 190, 255, 160))
    elif key == "Verse 3":
        d.rounded_rectangle([90, 1150, W - 90, 1450], radius=20, fill=(50, 50, 55))
        for k in range(30):
            x = 130 + (k % 10) * 88; y = 1200 + (k // 10) * 70
            g = int(80 + 170 * a * (0.5 + 0.5 * math.sin(t * 5 + k)))
            d.ellipse([x, y, x + 70, y + 55], fill=(g, int(g * .25), 0))
        for k in range(4):
            skewer(d, 170, 950 + k * 50, 740, t, min(1, prog * 1.3), angle_wobble=math.sin(t * 10 + k) * 4 * (1 + p))
        for e in EMBERS:
            e[1] -= e[3] * (1 + a); e[0] += math.sin(t * 3 + e[2]) * 1.5
            if e[1] < 0: e[1] = H
            d.ellipse([e[0] - e[2], e[1] - e[2], e[0] + e[2], e[1] + e[2]], fill=(255, 160, 40, 220))
    elif key == "Bridge":
        rice_plate(d, cx, 1080, 1 + p * 0.05, t)
        skewer(d, 230, 1180, 620, t, 1.0)
        tomato(d, 200, 900, 70); tomato(d, 880, 900, 70)
        d.ellipse([820, 1250, 940, 1340], fill=(170, 220, 60))  # lime
        for k in range(12):  # sumac sprinkle
            x = cx - 200 + (k * 37 % 400); y = 760 + ((t * 300 + k * 90) % 400)
            d.ellipse([x, y, x + 12, y + 12], fill=(150, 20, 40))
        for k in range(6):  # herbs
            x = 140 + k * 160; y = 1550 + math.sin(t * 3 + k) * 12
            d.ellipse([x, y, x + 90, y + 50], fill=(60, 150 + k * 10, 60))
    else:  # Outro
        rice_plate(d, cx, 1150, 1, t)
        skewer(d, 230, 1250, 620, t, 1.0)
        text_center(d, 560, "NOOSH-E JAAN!", font(int(110 * (1 + p * .1))), acc)

def captions(d, t, acc):
    line, lp = line_at(t)
    if not line:
        return
    alpha = min(1, lp * 8, (1 - lp) * 8)
    col = tuple(int(255 * alpha + 30 * (1 - alpha)) for _ in range(3))
    y = 1720 - (1 - min(1, lp * 6)) * 40
    text_center(d, y, line, F_CAP, col + (int(255 * alpha),), sw=5)

def frame(i):
    t = i / FPS
    si, prog = section_at(t)
    key, (_, _, acc) = pal(si)
    a, p = float(env[min(i, nfr - 1)]), float(pulse[min(i, nfr - 1)])
    img = blend_bg(si, prog)
    # beat glow
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    r = 380 + 260 * p
    gd.ellipse([W / 2 - r, 1050 - r, W / 2 + r, 1050 + r], fill=acc + (int(40 + 70 * p),))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(80)))
    d = ImageDraw.Draw(img, "RGBA")
    scene(d, key, t, prog, a, p, acc)
    # top label + progress bar
    d.text((W / 2, 150), sections[si][0].split("–")[0].strip().upper(), font=F_SM, fill=(255, 255, 255, 200), anchor="mm")
    d.rectangle([80, 200, 80 + (W - 160) * t / dur, 208], fill=acc)
    # spectrum-ish bars at bottom edge
    for k in range(24):
        v = env[max(0, i - k)] * (0.6 + 0.4 * math.sin(k * 1.7 + t * 4))
        h = 20 + 90 * v
        d.rectangle([60 + k * 40, H - 40 - h, 88 + k * 40, H - 40], fill=acc + (170,))
    captions(d, t, acc)
    return img.convert("RGB")

if __name__ == "__main__":
    n = int((LIMIT or dur) * FPS)
    ff = subprocess.Popen(["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
                           "-r", str(FPS), "-i", "-", "-i", MP3, "-t", str(n / FPS), "-c:v", "libx264", "-preset", "medium",
                           "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-shortest",
                           "-movflags", "+faststart", OUT], stdin=subprocess.PIPE)
    for i in range(n):
        ff.stdin.write(frame(i).tobytes())
        if i % 300 == 0:
            print(f"{i}/{n}", flush=True)
    ff.stdin.close()
    assert ff.wait() == 0, "ffmpeg failed"
    print("done", OUT)
