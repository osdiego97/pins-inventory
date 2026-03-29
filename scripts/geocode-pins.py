"""
geocode-pins.py — Assign lat/lng coordinates to pins using Google Geocoding API.

Rules:
  - Fútbol > Club tag  → search "{club_name} stadium {city}"
  - Hard Rock tag      → search "Hard Rock Cafe/Hotel {city from description}, {country}"
  - Everything else    → try "{description}, {city}, {country}" first; if Google returns only
                         a generic result (city/region level), fall back to "{city}, {country}"

Prerequisites:
  pip install supabase requests

.env vars required:
  EXPO_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_ROLE_KEY
  EXPO_PUBLIC_GOOGLE_MAPS_API_KEY

Usage:
  python scripts/geocode-pins.py --dry-run   # preview queries without API calls
  python scripts/geocode-pins.py             # geocode null coords and update DB
  python scripts/geocode-pins.py --force     # overwrite existing coords too
"""

import argparse
import re
import sys
import time
from pathlib import Path

GEOCODING_URL = "https://maps.googleapis.com/maps/api/geocode/json"
REQUEST_DELAY = 0.05  # 50ms between requests

# Result types considered too generic to use over a city/country fallback
GENERIC_TYPES = {
    "country",
    "administrative_area_level_1",
    "administrative_area_level_2",
    "administrative_area_level_3",
    "administrative_area_level_4",
    "administrative_area_level_5",
    "locality",
    "postal_code",
    "route",
    "political",
}


# Fallback cities for football clubs with null city field
CLUB_CITY_FALLBACK = {
    "athletic club": "Bilbao",
    "sporting portugal": "Lisboa",
    "sporting": "Lisboa",
}


def load_env():
    env_path = Path(__file__).parent.parent / ".env"
    env = {}
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        env[key.strip()] = val.strip().strip('"').strip("'")
    return {
        "url": env.get("EXPO_PUBLIC_SUPABASE_URL"),
        "service_key": env.get("SUPABASE_SERVICE_ROLE_KEY"),
        "maps_key": env.get("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY"),
    }


def build_query(pin, is_football_club, is_hrc, is_disney):
    """
    Returns (primary_query, fallback_query, warning).

    - primary_query:  the first query to try
    - fallback_query: if primary yields a generic result, try this instead (None = no fallback)
    - warning:        string if there's a data inconsistency to flag, else None
    """
    desc = (pin["description"] or "").strip()
    city = (pin["city"] or "").strip()
    country = (pin["country"] or "").strip()
    city_country = f"{city}, {country}" if city else (country or None)

    if is_disney and city.lower() in ("parís", "paris"):
        return "Disneyland Paris, France", None, None

    if is_hrc:
        m = re.search(
            r'(?:Hard Rock (?:Caf[eé]|Hotel)|HRH?otel)\s+'
            r'([A-Za-záéíóúüÁÉÍÓÚÜñÑ\-]+)',
            desc, re.IGNORECASE,
        )
        hrc_city = m.group(1).strip() if m else city
        venue = "Hotel" if "hotel" in desc.lower() else "Cafe"
        warning = f"city field='{city}' but description implies '{hrc_city}'" if hrc_city and hrc_city.lower() != city.lower() else None
        return f"Hard Rock {venue} {hrc_city}, {country}", None, warning

    if is_football_club:
        search_city = city or next(
            (v for k, v in CLUB_CITY_FALLBACK.items() if k in desc.lower()), ""
        )
        return f"{desc} stadium {search_city}".strip(), None, None

    # Default: try description first, fall back to city/country if result is too generic
    if desc and city_country:
        return f"{desc}, {city_country}", city_country, None
    return city_country, None, None


def geocode(query, api_key, requests_lib):
    """Returns (lat, lng, formatted_address, result_types) or (None, None, status, None)."""
    resp = requests_lib.get(
        GEOCODING_URL,
        params={"address": query, "key": api_key},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    if data["status"] == "OK":
        r = data["results"][0]
        loc = r["geometry"]["location"]
        return loc["lat"], loc["lng"], r["formatted_address"], r.get("types", [])
    return None, None, data["status"], None


def is_specific(result_types):
    """True if the result is more precise than a city/region — worth using over a fallback."""
    return bool(set(result_types) - GENERIC_TYPES)


def main():
    parser = argparse.ArgumentParser(description="Geocode pin locations via Google Maps API")
    parser.add_argument("--dry-run", action="store_true", help="Print planned queries without calling API or writing to DB")
    parser.add_argument("--force", action="store_true", help="Re-geocode pins that already have coordinates")
    args = parser.parse_args()

    env = load_env()
    missing = [k for k, v in env.items() if not v]
    if missing:
        print(f"ERROR: Missing .env vars: {', '.join(missing)}")
        sys.exit(1)

    import requests
    from supabase import create_client

    # Windows terminals default to cp1252 — reconfigure stdout to handle all Unicode
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    client = create_client(env["url"], env["service_key"])

    # --- Resolve tag IDs ---
    tags = client.table("tags").select("id,name,parent_id").execute().data
    football_tag = next((t for t in tags if t["name"] == "Fútbol" and not t["parent_id"]), None)
    club_tag = next(
        (t for t in tags if t["name"] == "Club" and t["parent_id"] == (football_tag or {}).get("id")), None
    )
    hrc_tag = next((t for t in tags if t["name"] == "Hard Rock" and not t["parent_id"]), None)

    disney_tag = next((t for t in tags if t["name"] == "Disney"), None)

    if not club_tag or not hrc_tag or not disney_tag:
        print("ERROR: Required tags not found (Futbol > Club, Hard Rock, Disney)")
        sys.exit(1)

    # --- Fetch categorised pin IDs ---
    football_pin_ids = {
        r["pin_id"]
        for r in client.table("pin_tags").select("pin_id").eq("tag_id", club_tag["id"]).execute().data
    }
    hrc_pin_ids = {
        r["pin_id"]
        for r in client.table("pin_tags").select("pin_id").eq("tag_id", hrc_tag["id"]).execute().data
    }
    disney_pin_ids = {
        r["pin_id"]
        for r in client.table("pin_tags").select("pin_id").eq("tag_id", disney_tag["id"]).execute().data
    }

    # --- Fetch target pins ---
    q = client.table("pins").select(
        "id,collection_number,description,city,country,latitude,longitude"
    )
    if not args.force:
        q = q.is_("latitude", "null")
    pins = q.order("collection_number").execute().data

    if not pins:
        print("Nothing to geocode.")
        return

    print(f"Pins to process: {len(pins)}\n")

    # --- Build plan ---
    plan = []
    for pin in pins:
        is_football = pin["id"] in football_pin_ids
        is_hrc = pin["id"] in hrc_pin_ids
        is_disney = pin["id"] in disney_pin_ids
        primary, fallback, warning = build_query(pin, is_football, is_hrc, is_disney)
        tag_label = "HRC" if is_hrc else ("Club" if is_football else ("Disney" if is_disney else "Lugar"))
        plan.append((pin, primary, fallback, tag_label, warning))

    # --- Dry run ---
    if args.dry_run:
        col_w, type_w, query_w = 5, 8, 55
        header = f"{'#':>{col_w}}  {'Tipo':<{type_w}}  {'Query':<{query_w}}  Fallback / Nota"
        print(header)
        print("-" * (len(header) + 20))
        for pin, primary, fallback, tag_label, warning in plan:
            note = f"WARN: {warning}" if warning else (f"fallback: {fallback}" if fallback else "")
            q_str = primary or "— sin datos de ubicación"
            print(f"{pin['collection_number']:>{col_w}}  {tag_label:<{type_w}}  {q_str:<{query_w}}  {note}")
        unique_queries = {q for _, p, f, _, _ in plan for q in (p, f) if q}
        print(f"\n{len(plan)} pins · hasta {len(unique_queries)} queries únicas")
        return

    # --- Geocode with cache ---
    # cache maps query → (lat, lng, address, types)
    cache: dict[str, tuple] = {}
    updated = skipped = errors = 0

    def cached_geocode(query):
        if query not in cache:
            cache[query] = geocode(query, env["maps_key"], requests)
            time.sleep(REQUEST_DELAY)
        return cache[query]

    print(f"{'#':>4}  {'Tipo':<8}  {'Resultado':<14}  Dirección")
    print("-" * 80)

    for pin, primary, fallback, tag_label, warning in plan:
        num = pin["collection_number"]

        if not primary:
            print(f"{num:>4}  {tag_label:<8}  SKIP            sin datos de ubicación")
            skipped += 1
            continue

        if warning:
            print(f"      WARN #{num}: {warning}")

        lat, lng, address, types = cached_geocode(primary)

        # If primary returned only a generic result, try the fallback
        if lat is not None and fallback and not is_specific(types):
            lat_fb, lng_fb, address_fb, types_fb = cached_geocode(fallback)
            if lat_fb is not None:
                lat, lng, address = lat_fb, lng_fb, address_fb
                result_label = "OK (fallback)"
            else:
                result_label = "OK (generic)"
        elif lat is not None and fallback and is_specific(types):
            result_label = "OK (desc)"
        else:
            result_label = "OK"

        if lat is None:
            print(f"{num:>4}  {tag_label:<8}  ERROR           {primary} → {address}")
            errors += 1
            continue

        client.table("pins").update({"latitude": lat, "longitude": lng}).eq("id", pin["id"]).execute()
        print(f"{num:>4}  {tag_label:<8}  {result_label:<14}  {address}")
        updated += 1

    print(f"\nActualizados: {updated}  |  Saltados: {skipped}  |  Errores: {errors}  |  Llamadas API: {len(cache)}")


if __name__ == "__main__":
    main()
