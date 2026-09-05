import math
from PIL import Image, ImageDraw

SIZE = 1024
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 255))
draw = ImageDraw.Draw(img)

cx, cy = SIZE / 2, SIZE / 2

# Rounded-square dark backdrop (matches the app's near-black canvas look)
pad = 40
draw.rounded_rectangle([pad, pad, SIZE - pad, SIZE - pad], radius=180, fill=(6, 6, 8, 255))

# Spiky radial "warp" ring, echoing the Warp visualization mode, in a
# purple -> teal -> green sweep matching the app's psychedelic palette.
bars = 72
base_r = SIZE * 0.20
spikes = [0.55, 0.9, 0.35, 1.0, 0.5, 0.8, 0.4, 0.95, 0.6, 0.85, 0.3, 0.7]

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

stops = [(180, 90, 255), (90, 200, 255), (110, 230, 150)]

points = []
for i in range(bars):
    t = i / bars
    spike = spikes[i % len(spikes)]
    r = base_r + spike * SIZE * 0.16
    angle = t * 2 * math.pi - math.pi / 2
    x = cx + math.cos(angle) * r
    y = cy + math.sin(angle) * r
    points.append((x, y))

seg = len(stops) - 1
for i in range(bars):
    p1, p2 = points[i], points[(i + 1) % bars]
    t = (i / bars) * seg
    idx = min(int(t), seg - 1)
    local_t = t - idx
    color = lerp_color(stops[idx], stops[idx + 1], local_t)
    draw.line([p1, p2], fill=color + (255,), width=14, joint="curve")

# Soft inner glow dot
glow = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
gdraw = ImageDraw.Draw(glow)
gdraw.ellipse([cx - 70, cy - 70, cx + 70, cy + 70], fill=(150, 120, 255, 120))
glow = glow.filter(__import__("PIL.ImageFilter", fromlist=["GaussianBlur"]).GaussianBlur(40))
img = Image.alpha_composite(img, glow)

img.save("build/icon.png")
print("wrote build/icon.png")
