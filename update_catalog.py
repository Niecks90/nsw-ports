import urllib.request
import re
import json
import logging
import sys

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

URL = "https://raw.githubusercontent.com/robzilla10001/SwitchPorts/main/README.md"
OUTPUT_FILE = "catalog.json"

# Games known to require original assets
ASSET_GAMES = {
    'half-life', 'quake', 'doom', 'gta', 'grand theft auto', 'tomb raider',
    'zelda', 'mario', 'sonic', 'duke nukem', 'shadow warrior', 'blood',
    'max payne', 'bully', 'return to castle wolfenstein', 'jediknight',
    'diablo', 'fallout', 'chrono trigger', 'need for speed', 'halo',
    'burnout', 'mortal kombat', 'super mario'
}

def slugify(text):
    text = re.sub(r'[^a-zA-Z0-9\s-]', '', text).strip().lower()
    return re.sub(r'[\s-]+', '-', text)

def parse_link(link_md):
    """Parses markdown link and extracts author/repo and raw URL"""
    match = re.search(r'\[(.*?)\]\((.*?)\)', link_md)
    if match:
        author_hint = match.group(1)
        url = match.group(2)
    else:
        # Fallback if it's just text or a raw URL
        author_hint = ""
        url = link_md.strip()

    # Try to deduce author from hint
    if '/' in author_hint:
        author = author_hint.split('/')[0]
    else:
        author = author_hint

    return author, url

def determine_url_source(url):
    """Detects whether the URL points to a GitHub Release, GBAtemp thread, or direct archive."""
    if 'github.com' in url:
        if '/releases' in url or '/releases/tag' in url or '/releases/download' in url:
            return 'github_release'
        return 'github_repo'
    elif 'gbatemp.net/threads' in url:
        return 'gbatemp_thread'
    elif url.endswith('.zip') or url.endswith('.rar') or url.endswith('.7z') or url.endswith('.nro'):
        return 'direct_archive'
    else:
        return 'other'

def check_asset_requirements(title, url):
    """Heuristic to detect asset requirements and asset type"""
    title_lower = title.lower()

    asset_type = 'unknown'
    if url.endswith('.nro'):
        asset_type = 'nro'
    elif 'release' in url.lower() or url.endswith('.zip') or url.endswith('.7z') or url.endswith('.rar'):
        asset_type = 'zip'
    elif 'github.com' in url:
        # Often github links point to repos, their releases are zips
        asset_type = 'zip'

    requires_assets = False
    for known in ASSET_GAMES:
        if known in title_lower:
            requires_assets = True
            break

    asset_hint = f"Please provide the original game data/assets for {title}." if requires_assets else None

    return asset_type, requires_assets, asset_hint

def main():
    logging.info(f"Fetching README from {URL}")
    try:
        req = urllib.request.urlopen(URL)
        content = req.read().decode('utf-8')
    except Exception as e:
        logging.error(f"Failed to fetch README: {e}")
        sys.exit(1)

    catalog = []
    current_platform = None
    in_table = False

    lines = content.split('\n')
    logging.info(f"Read {len(lines)} lines")

    for idx, line in enumerate(lines):
        line = line.strip()

        # Track current platform
        if line.startswith('### '):
            current_platform = line[4:].strip()
            continue

        # Detect table start
        if line.startswith('| Game | Version |') or line.startswith('|Game|Version|') or line.startswith('| Game |Version |'):
            in_table = True
            continue

        # Skip separator rows
        if in_table and (line.startswith('|---') or line.startswith('| ---')):
            continue

        if in_table and line.startswith('|'):
            # Parse table row
            columns = [col.strip() for col in line.split('|')[1:-1]]

            # Allow flexible number of columns, but typically 6
            if len(columns) >= 4:
                game = columns[0].replace('🟢 ', '').replace('🔴 ', '').replace('🟡 ', '').strip()

                if not game and len(catalog) > 0:
                    game = catalog[-1]['title']
                elif not game:
                    logging.warning(f"Row {idx}: Empty game title and no previous row to inherit from. Skipping.")
                    continue

                version = columns[1] if len(columns) > 1 else ""

                # Extract link and gbatemp link
                link_md = columns[3] if len(columns) > 3 else ""
                gbatemp_md = columns[4] if len(columns) > 4 else ""

                author, url = parse_link(link_md)

                _, gbatemp_url = parse_link(gbatemp_md)

                if not url and gbatemp_url:
                    url = gbatemp_url

                source_type = determine_url_source(url)

                platform_to_use = current_platform or "Unknown"
                slug = slugify(f"{game} {platform_to_use}")

                asset_type, req_assets, asset_hint = check_asset_requirements(game, url)

                catalog.append({
                    "id": slug,
                    "title": game,
                    "author": author,
                    "version": version,
                    "original_platform": platform_to_use,
                    "url": url,
                    "source_type": source_type,
                    "asset_type": asset_type,
                    "requires_original_assets": req_assets,
                    "expected_asset_hint": asset_hint,
                    "steamgriddb_id": None,
                    "grid_image_url": None
                })
            else:
                logging.warning(f"Row {idx}: Malformed row, insufficient columns: {line}")
        elif in_table and not line:
            # End of table is usually marked by an empty line in this markdown
            in_table = False

    logging.info(f"Successfully parsed {len(catalog)} entries")

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2)
        logging.info(f"Saved catalog to {OUTPUT_FILE}")
    except Exception as e:
        logging.error(f"Failed to save catalog: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
