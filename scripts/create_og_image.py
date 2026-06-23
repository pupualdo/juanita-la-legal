from PIL import Image, ImageDraw, ImageFont
import os

# Load avatar
avatar = Image.open("/root/juanita-la-legal/public/juanita-avatar.jpg").convert("RGB")
print(f"Avatar size: {avatar.size}")

# Create 1200x630 canvas — dark green background
W, H = 1200, 630
bg = Image.new("RGB", (W, H), "#0f1e14")

draw = ImageDraw.Draw(bg)
# Gold accent line at bottom
draw.rectangle([(0, H-6), (W, H)], fill="#c8a040")

# Create circular avatar mask
avatar_size = 340
# Crop avatar to square from top (face area)
aw, ah = avatar.size
crop_size = min(aw, ah)
avatar_cropped = avatar.crop((0, 0, crop_size, crop_size))
avatar_cropped = avatar_cropped.resize((avatar_size, avatar_size), Image.Resampling.LANCZOS)

# Create circular mask
mask = Image.new("L", (avatar_size, avatar_size), 0)
mask_draw = ImageDraw.Draw(mask)
mask_draw.ellipse((0, 0, avatar_size, avatar_size), fill=255)

# Apply mask
avatar_circular = Image.new("RGBA", (avatar_size, avatar_size), (0, 0, 0, 0))
avatar_circular_rgb = avatar_cropped.convert("RGBA")
avatar_circular.paste(avatar_circular_rgb, (0, 0), mask)

# Gold ring around avatar
ring = Image.new("RGBA", (avatar_size + 12, avatar_size + 12), (0, 0, 0, 0))
ring_draw = ImageDraw.Draw(ring)
ring_draw.ellipse((0, 0, avatar_size + 12, avatar_size + 12), outline="#c8a040", width=6)

# Position avatar on left
avatar_x = 70
avatar_y = (H - avatar_size) // 2

# Paste ring then avatar onto bg
bg_rgba = bg.convert("RGBA")
bg_rgba.paste(ring, (avatar_x - 6, avatar_y - 6), ring)
bg_rgba.paste(avatar_circular, (avatar_x, avatar_y), avatar_circular)

# Find fonts
font_dir = "/usr/share/fonts/truetype/dejavu/"
title_font = sub_font = desc_font = url_font = None
if os.path.exists(font_dir + "DejaVuSans-Bold.ttf"):
    title_font = ImageFont.truetype(font_dir + "DejaVuSans-Bold.ttf", 52)
    desc_font = ImageFont.truetype(font_dir + "DejaVuSans-Bold.ttf", 20)
if os.path.exists(font_dir + "DejaVuSans.ttf"):
    sub_font = ImageFont.truetype(font_dir + "DejaVuSans.ttf", 24)
    url_font = ImageFont.truetype(font_dir + "DejaVuSans.ttf", 16)

draw_rgba = ImageDraw.Draw(bg_rgba)

# Text positioning
text_x = avatar_x + avatar_size + 50

# Title
draw_rgba.text((text_x, 160), "Juanita La Legal", fill="#f5f0e8", font=title_font or ImageFont.load_default())

# Subtitle in gold
draw_rgba.text((text_x, 235), "Orientación legal en buen chileno", fill="#c8a040", font=sub_font or ImageFont.load_default())

# Descriptions
if desc_font:
    draw_rgba.text((text_x, 295), "Desde $4.995 CLP — Precio de lanzamiento", fill=(245, 240, 232, 217), font=desc_font)
    draw_rgba.text((text_x, 335), "Derecho laboral • Familia • Arriendo • Herencia y más", fill=(245, 240, 232, 179), font=desc_font)
else:
    draw_rgba.text((text_x, 295), "Desde $4.995 CLP — Precio de lanzamiento", fill="rgba(245,240,232,0.85)")
    draw_rgba.text((text_x, 335), "Derecho laboral • Familia • Arriendo • Herencia y más", fill="rgba(245,240,232,0.7)")

# URL
if url_font:
    draw_rgba.text((text_x, H - 55), "juanitalalegal.cl", fill=(245, 240, 232, 128), font=url_font)
else:
    draw_rgba.text((text_x, H - 55), "juanitalalegal.cl", fill="rgba(245,240,232,0.5)")

# Convert back to RGB for JPEG
bg_final = bg_rgba.convert("RGB")

# Save
out_path = "/root/juanita-la-legal/public/og-image.jpg"
bg_final.save(out_path, "JPEG", quality=90)
print(f"Saved: {out_path}")
print(f"Dimensions: {bg_final.size}")
