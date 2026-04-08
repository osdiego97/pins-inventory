"""
upload-pin-images.py — Detect pins in a photo, crop each one, upload to Supabase.

Two-phase workflow:
  1. Detect: segment pins from cork background, sort left→right top→bottom,
             save crops + numbered preview image for verification.
  2. Upload: push crops to Supabase Storage, update image_url on pins table.

Prerequisites:
  pip install opencv-python pillow supabase python-dotenv

.env vars required (same as seed-pins.js):
  EXPO_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  SUPABASE_SEED_USER_ID

Usage:
  python scripts/upload-pin-images.py --detect source-data/pins_photo1.jpeg
  python scripts/upload-pin-images.py --upload source-data/pins_photo1.jpeg --start 1
"""

import argparse
import os
import sys
import uuid
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

CROPS_DIR = Path("source-data/pin-crops")
PREVIEW_PATH = CROPS_DIR / "preview.jpg"

# HSV thresholds for cork background (warm tan/beige)
CORK_HSV_LOWER = np.array([8, 30, 80])
CORK_HSV_UPPER = np.array([35, 140, 220])

# HSV thresholds for wooden frame (dark brown)
FRAME_HSV_LOWER = np.array([8, 40, 30])
FRAME_HSV_UPPER = np.array([28, 200, 110])

# Contour area as fraction of total image area
MIN_AREA_FRACTION = 0.0008
MAX_AREA_FRACTION = 0.08

# Single-pin size constraints (pixels). Merges and frame bleed produce larger boxes.
MAX_PIN_DIMENSION = 300   # any side > this → likely merged multi-pin blob
MAX_ASPECT_RATIO  = 3.5   # elongated fragments (e.g. a strip of cork, shadow)

# Pixels to add around each detected pin bounding box
CROP_PADDING = 12

# ---------------------------------------------------------------------------
# Detection
# ---------------------------------------------------------------------------

def load_env():
    env_path = Path(__file__).parent.parent / ".env"
    env = {}
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        idx = line.index("=") if "=" in line else -1
        if idx == -1:
            continue
        key = line[:idx].strip()
        val = line[idx + 1:].strip().strip('"').strip("'")
        env[key] = val
    return {
        "url": env.get("EXPO_PUBLIC_SUPABASE_URL"),
        "service_key": env.get("SUPABASE_SERVICE_ROLE_KEY"),
        "user_id": env.get("SUPABASE_SEED_USER_ID"),
    }


def build_pin_mask(img_bgr):
    """Return binary mask of non-background (pin) pixels."""
    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV)

    cork_mask = cv2.inRange(hsv, CORK_HSV_LOWER, CORK_HSV_UPPER)
    frame_mask = cv2.inRange(hsv, FRAME_HSV_LOWER, FRAME_HSV_UPPER)
    background = cv2.bitwise_or(cork_mask, frame_mask)

    pin_mask = cv2.bitwise_not(background)

    # Close small gaps within pins, remove tiny noise
    close_k = np.ones((3, 3), np.uint8)
    open_k = np.ones((3, 3), np.uint8)
    pin_mask = cv2.morphologyEx(pin_mask, cv2.MORPH_CLOSE, close_k)
    pin_mask = cv2.morphologyEx(pin_mask, cv2.MORPH_OPEN, open_k)

    return pin_mask


def find_pin_bboxes(img_bgr):
    """Return list of (x, y, w, h, cx, cy) for each detected pin."""
    h, w = img_bgr.shape[:2]
    total_area = h * w
    border = 8  # ignore detections too close to image edges (frame bleed)

    pin_mask = build_pin_mask(img_bgr)
    contours, _ = cv2.findContours(pin_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    bboxes = []
    for c in contours:
        area = cv2.contourArea(c)
        if not (total_area * MIN_AREA_FRACTION < area < total_area * MAX_AREA_FRACTION):
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        if x < border or y < border or (x + bw) > (w - border) or (y + bh) > (h - border):
            continue
        # Skip merged multi-pin blobs and elongated fragments
        if max(bw, bh) > MAX_PIN_DIMENSION:
            continue
        if max(bw, bh) / max(min(bw, bh), 1) > MAX_ASPECT_RATIO:
            continue
        bboxes.append((x, y, bw, bh, x + bw // 2, y + bh // 2))

    return bboxes


def sort_reading_order(bboxes):
    """Sort bboxes left→right, top→bottom using row clustering."""
    if not bboxes:
        return []

    avg_h = np.mean([bh for _, _, _, bh, _, _ in bboxes])
    threshold = avg_h * 0.55

    # Sort by y_center first
    by_y = sorted(bboxes, key=lambda b: b[5])

    rows = []
    current_row = [by_y[0]]
    for bbox in by_y[1:]:
        row_cy = np.mean([b[5] for b in current_row])
        if abs(bbox[5] - row_cy) <= threshold:
            current_row.append(bbox)
        else:
            rows.append(sorted(current_row, key=lambda b: b[4]))  # sort by cx
            current_row = [bbox]
    rows.append(sorted(current_row, key=lambda b: b[4]))

    return [b for row in rows for b in row]


def crop_pins(img_bgr, sorted_bboxes):
    """Crop each pin with padding, save to CROPS_DIR, return metadata list."""
    h, w = img_bgr.shape[:2]
    CROPS_DIR.mkdir(parents=True, exist_ok=True)

    pil_img = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    results = []

    for i, (x, y, bw, bh, _, _) in enumerate(sorted_bboxes, start=1):
        x1 = max(0, x - CROP_PADDING)
        y1 = max(0, y - CROP_PADDING)
        x2 = min(w, x + bw + CROP_PADDING)
        y2 = min(h, y + bh + CROP_PADDING)

        crop = pil_img.crop((x1, y1, x2, y2))
        crop_path = CROPS_DIR / f"pin_{i:03d}.jpg"
        crop.save(str(crop_path), "JPEG", quality=92)

        results.append({"index": i, "x1": x1, "y1": y1, "x2": x2, "y2": y2, "crop_path": str(crop_path)})

    return results


def generate_preview(img_bgr, results):
    """Save numbered bounding box overlay for human verification."""
    preview = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(preview)

    try:
        font = ImageFont.truetype("arial.ttf", 18)
    except Exception:
        font = ImageFont.load_default()

    for r in results:
        draw.rectangle([r["x1"], r["y1"], r["x2"], r["y2"]], outline="red", width=3)
        draw.rectangle([r["x1"], r["y1"], r["x1"] + 28, r["y1"] + 22], fill="red")
        draw.text((r["x1"] + 3, r["y1"] + 2), str(r["index"]), fill="white", font=font)

    preview.save(str(PREVIEW_PATH), "JPEG", quality=90)


# ---------------------------------------------------------------------------
# Phase 1: Detect
# ---------------------------------------------------------------------------

def run_detect(image_path):
    print(f"Loading: {image_path}")
    img_bgr = cv2.imread(image_path)
    if img_bgr is None:
        print(f"Error: could not load image at {image_path}")
        sys.exit(1)

    print("Detecting pins...")
    bboxes = find_pin_bboxes(img_bgr)

    if not bboxes:
        print("No pins detected. HSV thresholds may need tuning for this photo.")
        sys.exit(1)

    sorted_bboxes = sort_reading_order(bboxes)
    print(f"Detected {len(sorted_bboxes)} pins.")

    results = crop_pins(img_bgr, sorted_bboxes)
    generate_preview(img_bgr, results)

    print(f"\nCrops saved to:  {CROPS_DIR}/")
    print(f"Preview saved:   {PREVIEW_PATH}")
    print(f"\nVerify the preview — confirm pin numbering matches your physical order.")
    print(f"Then run: python scripts/upload-pin-images.py --upload {image_path} --start 1")


# ---------------------------------------------------------------------------
# Phase 2: Upload
# ---------------------------------------------------------------------------

def run_upload(start):
    from supabase import create_client

    crop_files = sorted(CROPS_DIR.glob("pin_*.jpg"))
    if not crop_files:
        print(f"No crops found in {CROPS_DIR}. Run --detect first.")
        sys.exit(1)

    env = load_env()
    if not all(env.values()):
        print("Missing .env vars: EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SEED_USER_ID")
        sys.exit(1)

    client = create_client(env["url"], env["service_key"])
    user_id = env["user_id"]

    print(f"Uploading {len(crop_files)} crops, collection_number {start}–{start + len(crop_files) - 1}...")

    for i, crop_path in enumerate(crop_files):
        collection_num = start + i
        filename = f"{uuid.uuid4()}.jpg"
        storage_path = f"pins/{user_id}/{filename}"

        with open(crop_path, "rb") as f:
            client.storage.from_("pins").upload(
                storage_path,
                f,
                {"content-type": "image/jpeg"},
            )

        image_url = client.storage.from_("pins").get_public_url(storage_path)

        result = (
            client.table("pins")
            .update({"image_url": image_url})
            .eq("collection_number", collection_num)
            .execute()
        )

        updated = len(result.data) if result.data else 0
        status = "OK" if updated else "NO MATCH"
        print(f"  [{collection_num}] {crop_path.name} → {status}")

    print(f"\nDone.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Process pin photos for Supabase upload")
    parser.add_argument("image", nargs="?", help="Path to pin photo (required for --detect)")
    parser.add_argument("--detect", action="store_true", help="Segment pins, save crops + preview")
    parser.add_argument("--upload", action="store_true", help="Upload crops from last --detect run")
    parser.add_argument("--start", type=int, default=1, help="Starting collection_number (default: 1)")
    args = parser.parse_args()

    if args.detect:
        if not args.image:
            print("--detect requires an image path argument.")
            sys.exit(1)
        run_detect(args.image)
    elif args.upload:
        run_upload(args.start)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
