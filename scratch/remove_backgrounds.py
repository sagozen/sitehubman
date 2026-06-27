import os
from PIL import Image

image_paths = [
    r"c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\assets\images\3d_create_card_v2.png",
    r"c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\assets\images\3d_share_card_v2.png",
    r"c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\assets\images\3d_scan_card_v2.png",
    r"c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\assets\images\3d_track_card_v2.png",
    r"c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\assets\images\3d_analytics_v2.png",
    r"c:\Users\DELL\Downloads\sitehubman-main (2)\sitehubman-main\assets\images\3d_signals_v2.png"
]

def make_transparent(img_path):
    if not os.path.exists(img_path):
        print(f"Skipping: {img_path} (does not exist)")
        return
        
    print(f"Processing: {img_path}")
    img = Image.open(img_path).convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        r, g, b, a = item
        # If pixel is very close to white or light gray (which includes the vignette/shadows/checkerboard bg)
        # We will make it transparent.
        # Let's check if it matches the background profile.
        # Most of our white background images have pure white or very light gray/off-white backgrounds.
        # If R, G, B are all > 235, it's background.
        # If it's the checkerboard (gray/white grid) from the first generation, the gray is around 204,204,204 or 190,190,190.
        # Let's check for both.
        is_bg = False
        
        # Pure white/light gray background
        if r > 230 and g > 230 and b > 230:
            is_bg = True
        # Checkerboard gray squares (usually near-symmetric gray values like 204, 204, 204)
        elif abs(r - g) < 5 and abs(g - b) < 5 and abs(r - b) < 5 and r > 180 and r < 215:
            is_bg = True
            
        if is_bg:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save(img_path, "PNG")
    print(f"Saved: {img_path}")

for path in image_paths:
    make_transparent(path)
print("Finished background removal!")
