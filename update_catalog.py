import urllib.request
import urllib.parse
import re
import json
import logging
import sys
import os
import time

# Configure logging format
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

# Source README repository URL and output file path
URL = "https://raw.githubusercontent.com/robzilla10001/SwitchPorts/main/README.md"
OUTPUT_FILE = "catalog.json"

def slugify(text):
    """Normalize text into a URL-friendly and unique slug (kebab-case)."""
    text = re.sub(r'[^a-zA-Z0-9\s-]', '', text).strip().lower()
    return re.sub(r'[\s-]+', '-', text)

def parse_link(cell_text):
    """
    Extract author and normalize repository/download URLs.
    Handles Markdown links, raw GitHub user/repo patterns, and plain HTTP(S) links.
    """
    cell_text = cell_text.strip()
    if not cell_text:
        return "", ""

    # Case 1: Markdown formatted link [Label](URL)
    match = re.search(r'\[(.*?)\]\((.*?)\)', cell_text)
    if match:
        label = match.group(1).strip()
        url = match.group(2).strip()
        author = label.split('/')[0] if '/' in label else ""
        return author, url

    # Case 2: Plain GitHub "user/repo" slug
    github_slug_match = re.match(r'^([a-zA-Z0-9_-]+)/([a-zA-Z0-9._-]+)$', cell_text)
    if github_slug_match:
        author = github_slug_match.group(1)
        url = f"https://github.com/{cell_text}"
        return author, url

    # Case 3: Raw HTTP(S) URL
    if cell_text.startswith("http://") or cell_text.startswith("https://"):
        return "", cell_text

    return "", cell_text

def determine_url_source(url):
    """Determine the source type based on target URL structure."""
    if 'github.com' in url:
        if any(x in url for x in ['/releases', '/releases/tag', '/releases/download']):
            return 'github_release'
        return 'github_repo'
    elif 'gbatemp.net' in url:
        return 'gbatemp_thread'
    elif any(url.endswith(ext) for ext in ['.zip', '.rar', '.7z', '.nro']):
        return 'direct_archive'
    return 'other'

def clean_title_for_search(title):
    """
    Clean game titles before querying SteamGridDB autocomplete.
    Uses word boundaries (\\b) to avoid truncating game names like 'Portal' into 'al'.
    """
    # Strip brackets and parenthetical notes
    title = re.sub(r'\(.*?\)', '', title)
    title = re.sub(r'\[.*?\]', '', title)
    
    # Remove common port and version keywords as standalone words
    title = re.sub(r'(?i)\b(port|nx|switch|remastered|hd)\b', '', title)
    title = re.sub(r'\s+', ' ', title)
    return title.strip()

def fetch_sgdb_cover(title, api_key):
    """Query SteamGridDB API to fetch vertical 600x900 poster art."""
    clean_title = clean_title_for_search(title)
    if not clean_title:
        return None, None

    headers = {
        'Authorization': f'Bearer {api_key}',
        'User-Agent': 'PortsDL-NX Scraper'
    }

    # Step 1: Search for game ID using autocomplete endpoint
    search_url = f"https://www.steamgriddb.com/api/v2/search/autocomplete/{urllib.parse.quote(clean_title)}"
    try:
        req = urllib.request.Request(search_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data.get('data'):
                return None, None
            game_id = data['data'][0]['id']
    except Exception as e:
        logging.warning(f"SGDB search failed for '{title}': {e}")
        return None, None

    time.sleep(0.25)  # Rate limit protection between requests

    # Step 2: Fetch vertical 600x900 cover grid for the matched game
    grids_url = f"https://www.steamgriddb.com/api/v2/grids/game/{game_id}?dimensions=600x900"
    try:
        req = urllib.request.Request(grids_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data.get('data'):
                return game_id, None

            return game_id, data['data'][0]['url']
    except Exception as e:
        logging.warning(f"SGDB grids failed for '{title}': {e}")
        return game_id, None

def load_overrides(filepath="overrides.json"):
    """Load manual overrides dictionary from local file if available."""
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                overrides = json.load(f)
                logging.info(f"Loaded {len(overrides)} overrides from {filepath}")
                return overrides
        except Exception as e:
            logging.error(f"Failed to load overrides from {filepath}: {e}")
    return {}

def load_existing_catalog(filepath="catalog.json"):
    """
    Load existing catalog to preserve existing and manually fixed cover art URLs.
    Indexes entries by both unique slug ID and normalized title.
    """
    if not os.path.exists(filepath):
        return {}

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            existing_catalog = json.load(f)

        cache = {}
        for item in existing_catalog:
            if not isinstance(item, dict):
                continue
            
            img_url = item.get("grid_image_url")
            sgdb_id = item.get("steamgriddb_id")
            
            # Cache only valid image URLs
            if img_url and str(img_url).strip() and str(img_url).lower() != "null":
                entry = (str(img_url).strip(), str(sgdb_id) if sgdb_id else None)
                
                # Index by exact entry ID
                if item.get("id"):
                    cache[item["id"]] = entry
                
                # Index by normalized title to prevent loss if platform name changes
                if item.get("title"):
                    cache[f"title::{slugify(item['title'])}"] = entry

        logging.info(f"Preserved {len(cache)} existing covers from {filepath}")
        return cache
    except Exception as e:
        logging.error(f"Failed to load existing catalog from {filepath}: {e}")
        return {}

def main():
    sgdb_api_key = os.environ.get("SGDB_API_KEY")
    if not sgdb_api_key:
        logging.warning("SGDB_API_KEY not found. Only existing covers and overrides will be used.")

    overrides_data = load_overrides()
    existing_covers = load_existing_catalog()

    logging.info(f"Downloading README from {URL}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        req = urllib.request.Request(URL, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode('utf-8')
    except Exception as e:
        logging.error(f"Failed to fetch README: {e}")
        sys.exit(1)

    catalog = []
    current_platform = "Unknown"
    in_table = False
    col_map = {}

    lines = content.split('\n')
    logging.info(f"Parsing {len(lines)} lines...")

    for raw_line in lines:
        line = raw_line.strip()

        # 1. Platform header detection (Markdown ##, ###, ####)
        header_match = re.match(r'^#{2,4}\s+(.*)', line)
        if header_match:
            title_text = header_match.group(1).strip()
            # Ignore standard introductory and disclaimer headings
            if not any(skip in title_text.lower() for skip in ['notice', 'table of contents', 'disclaimer', 'recent changes']):
                current_platform = title_text
            continue

        # 2. Table header detection (supports both '| Game | ...' and 'Game | ...' without leading pipe)
        clean_header = line.strip('|').strip().lower()
        if ('game' in clean_header or 'title' in clean_header) and '|' in line:
            headers = [c.strip().lower() for c in line.split('|') if c.strip()]
            col_map = {name: i for i, name in enumerate(headers)}
            in_table = True
            continue

        # 3. Separator line (|---|---|...)
        if in_table and re.match(r'^\|[-:\s]+\|', line):
            continue

        # 4. Table data parsing
        if in_table and line.startswith('|'):
            # Strictly ignore any section associated with emulators
            if "emulator" in current_platform.lower():
                continue

            columns = [col.strip() for col in line.split('|')[1:-1]]

            game_idx = col_map.get('game', col_map.get('title', 0))
            version_idx = col_map.get('version', 1)
            link_idx = col_map.get('link', col_map.get('repository', 3))
            gbatemp_idx = col_map.get('gbatemp thread?', col_map.get('gbatemp', 4))

            # Dynamically locate the update date column
            last_updated_idx = -1
            for key, idx in col_map.items():
                if 'updated' in key or 'date' in key:
                    last_updated_idx = idx
                    break

            if len(columns) > max(game_idx, link_idx):
                raw_game = columns[game_idx]
                game = re.sub(r'^[🟢🔴🟡🟠\s]+', '', raw_game).strip()

                # Title inheritance for alternative release rows (| |)
                if not game and len(catalog) > 0:
                    game = catalog[-1]['title']
                elif not game:
                    continue

                version = columns[version_idx] if len(columns) > version_idx else ""
                link_raw = columns[link_idx] if len(columns) > link_idx else ""
                gbatemp_raw = columns[gbatemp_idx] if len(columns) > gbatemp_idx else ""

                author, url = parse_link(link_raw)
                _, gbatemp_url = parse_link(gbatemp_raw)

                # Parse update date if present
                last_updated = None
                if last_updated_idx != -1 and len(columns) > last_updated_idx:
                    raw_date = columns[last_updated_idx].strip()
                    if raw_date and raw_date.lower() != "unknown":
                        last_updated = raw_date

                # Fallback to GBAtemp thread URL if repository link is absent
                if not url and gbatemp_url:
                    url = gbatemp_url

                source_type = determine_url_source(url)

                # Generate unique slug (differentiate multiple builds for the same game)
                slug = slugify(f"{game}-{current_platform}")
                if any(item["id"] == slug for item in catalog):
                    slug = slugify(f"{game}-{author or 'alt'}-{current_platform}")

                title_key = f"title::{slugify(game)}"
                asset_type = 'nro' if url.endswith('.nro') else 'zip'

                sgdb_id = None
                grid_url = None

                # Priority 1: Check manual overrides.json
                if slug in overrides_data:
                    val = overrides_data[slug]
                    grid_url = val if isinstance(val, str) else val.get("grid_image_url")
                    sgdb_id = None if isinstance(val, str) else val.get("steamgriddb_id")
                elif slugify(game) in overrides_data:
                    val = overrides_data[slugify(game)]
                    grid_url = val if isinstance(val, str) else val.get("grid_image_url")
                    sgdb_id = None if isinstance(val, str) else val.get("steamgriddb_id")

                # Priority 2: Retain existing cover from catalog.json
                elif slug in existing_covers:
                    grid_url, sgdb_id = existing_covers[slug]
                elif title_key in existing_covers:
                    grid_url, sgdb_id = existing_covers[title_key]

                # Priority 3: Query SteamGridDB API for new entries
                elif sgdb_api_key:
                    logging.info(f"Fetching cover from SteamGridDB for: {game}")
                    sgdb_id, grid_url = fetch_sgdb_cover(game, sgdb_api_key)

                catalog.append({
                    "id": slug,
                    "title": game,
                    "author": author,
                    "version": version,
                    "original_platform": current_platform,
                    "url": url,
                    "source_type": source_type,
                    "asset_type": asset_type,
                    "steamgriddb_id": str(sgdb_id) if sgdb_id else None,
                    "grid_image_url": grid_url,
                    "last_updated": last_updated
                })
        elif in_table and (not line or not line.startswith('|')):
            in_table = False
            col_map = {}

    logging.info(f"{len(catalog)} entries successfully extracted.")

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        logging.info(f"File {OUTPUT_FILE} successfully generated.")
    except Exception as e:
        logging.error(f"Write error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
