# Generates the MiniWorld launcher icon (city skyline + UFO tractor beam) for Android (legacy, round, adaptive) + favicon. Run: python3 scripts/make-icons.py
from PIL import Image, ImageDraw, ImageFilter
import random, math, os
S = 2048
def lerp(a, b, t): return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
def art(transparent_bg=False):
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    if not transparent_bg:
        for y in range(S):
            t = y / S; c = lerp((14, 10, 44), (92, 38, 140), min(1, t * 1.6)) if t < 0.62 else lerp((92, 38, 140), (255, 110, 64), (t - 0.62) / 0.38)
            d.line([(0, y), (S, y)], fill=c + (255,))
        random.seed(7)
        for _ in range(90): x, y, r = random.randint(0, S), random.randint(0, int(S * 0.5)), random.choice([3, 4, 6]); d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, random.randint(120, 255)))
        glow = Image.new('RGBA', (S, S), (0, 0, 0, 0)); g = ImageDraw.Draw(glow); g.ellipse([S * 0.62, S * 0.14, S * 0.9, S * 0.42], fill=(255, 220, 140, 200)); glow = glow.filter(ImageFilter.GaussianBlur(60)); im = Image.alpha_composite(im, glow); d = ImageDraw.Draw(im)
        d.ellipse([S * 0.67, S * 0.19, S * 0.85, S * 0.37], fill=(255, 238, 190, 255))
    # tractor beam
    beam = Image.new('RGBA', (S, S), (0, 0, 0, 0)); b = ImageDraw.Draw(beam); b.polygon([(S * 0.44, S * 0.5), (S * 0.56, S * 0.5), (S * 0.74, S * 0.86), (S * 0.26, S * 0.86)], fill=(110, 255, 170, 120)); beam = beam.filter(ImageFilter.GaussianBlur(14)); im = Image.alpha_composite(im, beam); d = ImageDraw.Draw(im)
    # skyline layers
    random.seed(3)
    def layer(base, hmin, hmax, col, win, wmin=110, wmax=210):
        x = -40
        while x < S:
            w = random.randint(wmin, wmax); h = random.randint(hmin, hmax); top = base - h
            d.rectangle([x, top, x + w, S], fill=col)
            if win:
                for wy in range(top + 40, base - 20, 62):
                    for wx in range(x + 24, x + w - 30, 46):
                        if random.random() < 0.55: d.rectangle([wx, wy, wx + 20, wy + 30], fill=win)
            x += w + random.randint(6, 28)
    layer(int(S * 0.80), 200, 520, (38, 24, 74, 255), (255, 213, 120, 200))
    layer(int(S * 0.90), 140, 420, (20, 12, 44, 255), (255, 235, 160, 235), 130, 250)
    # UFO
    ux, uy = S * 0.5, S * 0.36
    gl = Image.new('RGBA', (S, S), (0, 0, 0, 0)); g = ImageDraw.Draw(gl); g.ellipse([ux - 360, uy - 70, ux + 360, uy + 150], fill=(120, 255, 180, 150)); gl = gl.filter(ImageFilter.GaussianBlur(40)); im = Image.alpha_composite(im, gl); d = ImageDraw.Draw(im)
    d.ellipse([ux - 150, uy - 190, ux + 150, uy + 30], fill=(150, 235, 255, 235), outline=(255, 255, 255, 255), width=6)
    d.ellipse([ux - 330, uy - 40, ux + 330, uy + 120], fill=(176, 186, 198, 255), outline=(235, 240, 245, 255), width=8)
    d.ellipse([ux - 330, uy + 20, ux + 330, uy + 140], fill=(108, 118, 132, 255))
    for i in range(7): a = -2.5 + i * 0.83; x = ux + math.cos(a * 0.55) * 240 * (1 if i % 2 == 0 else 1) * ((i - 3) / 3.2); d.ellipse([ux + (i - 3) * 96 - 20, uy + 58 - 20 + abs(i - 3) * 6, ux + (i - 3) * 96 + 20, uy + 58 + 20 + abs(i - 3) * 6], fill=(90, 255, 160, 255))
    return im
def rounded(im, r):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).rounded_rectangle([0, 0, im.size[0] - 1, im.size[1] - 1], r, fill=255); out = Image.new('RGBA', im.size, (0, 0, 0, 0)); out.paste(im, (0, 0), m); return out
def circle(im):
    m = Image.new('L', im.size, 0); ImageDraw.Draw(m).ellipse([0, 0, im.size[0] - 1, im.size[1] - 1], fill=255); out = Image.new('RGBA', im.size, (0, 0, 0, 0)); out.paste(im, (0, 0), m); return out
full = art(False)
fg = Image.new('RGBA', (S, S), (0, 0, 0, 0)); inner = art(False).resize((int(S * 0.64), int(S * 0.64)), Image.LANCZOS); fg.paste(inner, (int(S * 0.18), int(S * 0.18)), inner)
out = 'resources/android-res'; os.makedirs(out, exist_ok=True)
for den, leg, ad in [('mdpi', 48, 108), ('hdpi', 72, 162), ('xhdpi', 96, 216), ('xxhdpi', 144, 324), ('xxxhdpi', 192, 432)]:
    p = f'{out}/mipmap-{den}'; os.makedirs(p, exist_ok=True)
    sq = full.resize((leg, leg), Image.LANCZOS); rounded(sq, int(leg * 0.2)).save(f'{p}/ic_launcher.png'); circle(sq).save(f'{p}/ic_launcher_round.png'); fg.resize((ad, ad), Image.LANCZOS).save(f'{p}/ic_launcher_foreground.png')
os.makedirs(f'{out}/values', exist_ok=True); open(f'{out}/values/ic_launcher_background.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#2A1458</color>\n</resources>\n')
full.resize((1024, 1024), Image.LANCZOS).save('resources/icon-1024.png'); os.makedirs('public', exist_ok=True); rounded(full.resize((192, 192), Image.LANCZOS), 38).save('public/favicon.png')
print('icons written')
