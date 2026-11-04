import urllib.request
import re
import json
import logging
import sys
import os
import time

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

URL = "https://raw.githubusercontent.com/robzilla10001/SwitchPorts/main/README.md"
OUTPUT_FILE = "catalog.json"

def slugify(text):
    text = re.sub(r'[^a-zA-Z0-9\s-]', '', text).strip().lower()
    return re.sub(r'[\s-]+', '-', text)

def parse_link(cell_text):
    """Extrait l'auteur et normalise l'URL (gère Markdown et texte brut user/repo)."""
    cell_text = cell_text.strip()
    if not cell_text:
        return "", ""

    # Cas 1 : Lien Markdown [Texte](URL)
    match = re.search(r'\[(.*?)\]\((.*?)\)', cell_text)
    if match:
        label = match.group(1).strip()
        url = match.group(2).strip()
        author = label.split('/')[0] if '/' in label else ""
        return author, url

    # Cas 2 : Format brut GitHub "user/repo"
    github_slug_match = re.match(r'^([a-zA-Z0-9_-]+)/([a-zA-Z0-9._-]+)$', cell_text)
    if github_slug_match:
        author = github_slug_match.group(1)
        url = f"https://github.com/{cell_text}"
        return author, url

    # Cas 3 : URL HTTP(S) brute
    if cell_text.startswith("http://") or cell_text.startswith("https://"):
        return "", cell_text

    return "", cell_text

def determine_url_source(url):
    """Détecte la nature de la ressource."""
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
    # Remove contents inside brackets/parentheses and some common suffixes
    title = re.sub(r'\(.*?\)', '', title)
    title = re.sub(r'\[.*?\]', '', title)
    title = re.sub(r'(?i)port|nx|switch|remastered|hd', '', title)
    return title.strip()

def fetch_sgdb_cover(title, api_key):
    clean_title = clean_title_for_search(title)
    if not clean_title:
        return None, None

    headers = {
        'Authorization': f'Bearer {api_key}',
        'User-Agent': 'PortsDL-NX Scraper'
    }

    # 1. Search for game
    search_url = f"https://www.steamgriddb.com/api/v2/search/autocomplete/{urllib.parse.quote(clean_title)}"
    try:
        req = urllib.request.Request(search_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data.get('data'):
                return None, None
            game_id = data['data'][0]['id']
    except Exception as e:
        logging.warning(f"SGDB Search failed for {title}: {e}")
        return None, None

    time.sleep(0.2) # Rate limit protection

    # 2. Fetch cover
    grids_url = f"https://www.steamgriddb.com/api/v2/grids/game/{game_id}?dimensions=600x900"
    try:
        req = urllib.request.Request(grids_url, headers=headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data.get('data'):
                return game_id, None

            return game_id, data['data'][0]['url']
    except Exception as e:
        logging.warning(f"SGDB Grids failed for {title}: {e}")
        return game_id, None

def load_overrides(filepath="overrides.json"):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                overrides = json.load(f)
                logging.info(f"Overrides loaded from {filepath}")
                return overrides
        except Exception as e:
            logging.error(f"Failed to load overrides from {filepath}: {e}")
    return {}

def load_existing_catalog(filepath="catalog.json"):
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                existing_catalog = json.load(f)
                logging.info(f"Existing catalog loaded from {filepath}")
                return {item["id"]: (item.get("grid_image_url"), item.get("steamgriddb_id")) for item in existing_catalog if item.get("grid_image_url")}
        except Exception as e:
            logging.error(f"Failed to load existing catalog from {filepath}: {e}")
    return {}

def main():
    sgdb_api_key = os.environ.get("SGDB_API_KEY")
    if not sgdb_api_key:
        logging.warning("SGDB_API_KEY not defined. Cover URLs will not be fetched.")

    overrides_data = load_overrides()
    existing_covers = load_existing_catalog()

    logging.info(f"Downloading README from {URL}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        req = urllib.request.Request(URL, headers=headers)
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
    except Exception as e:
        logging.error(f"Failed to fetch README : {e}")
        sys.exit(1)

    catalog = []
    current_platform = "Unknown"
    in_table = False
    col_map = {}

    lines = content.split('\n')
    logging.info(f"Analyzing {len(lines)} lines...")

    for idx, raw_line in enumerate(lines):
        line = raw_line.strip()

        # 1. Détection de la plateforme (Titres Markdown ##, ###, ####)
        header_match = re.match(r'^#{2,4}\s+(.*)', line)
        if header_match:
            title_text = header_match.group(1).strip()
            # On ignore les sections d'en-tête du README et "Emulators"
            if not any(skip in title_text.lower() for skip in ['notice', 'table of contents', 'disclaimer', 'recent changes', 'emulators']):
                current_platform = title_text
            else:
                current_platform = title_text # Set current_platform so it doesn't get misattributed, we will skip entries later
            continue

        # 2. Détection de l'en-tête d'un tableau
        if line.startswith('|') and ('game' in line.lower() or 'title' in line.lower()):
            headers = [c.strip().lower() for c in line.split('|')[1:-1]]
            col_map = {name: i for i, name in enumerate(headers)}
            in_table = True
            continue

        # 3. Ligne de séparation (|---|---|...)
        if in_table and re.match(r'^\|[-:\s]+\|', line):
            continue

        # 4. Parsing des lignes de données
        if in_table and line.startswith('|'):
            columns = [col.strip() for col in line.split('|')[1:-1]]
            
            # Recherche flexible des colonnes selon l'en-tête
            game_idx = col_map.get('game', col_map.get('title', 0))
            version_idx = col_map.get('version', 1)
            link_idx = col_map.get('link', col_map.get('repository', 3))
            gbatemp_idx = col_map.get('gbatemp thread?', col_map.get('gbatemp', 4))
            last_updated_idx = col_map.get('last updated?', col_map.get('date', -1))

            if current_platform.lower() == "emulators":
                continue

            if len(columns) > max(game_idx, link_idx):
                raw_game = columns[game_idx]
                game = re.sub(r'^[🟢🔴🟡🟠\s]+', '', raw_game).strip()

                # Héritage si le nom du jeu est vide (lignes multi-builds)
                if not game and len(catalog) > 0:
                    game = catalog[-1]['title']
                elif not game:
                    continue

                version = columns[version_idx] if len(columns) > version_idx else ""
                
                link_raw = columns[link_idx] if len(columns) > link_idx else ""
                gbatemp_raw = columns[gbatemp_idx] if len(columns) > gbatemp_idx else ""

                author, url = parse_link(link_raw)
                _, gbatemp_url = parse_link(gbatemp_raw)

                last_updated = None
                if last_updated_idx != -1 and len(columns) > last_updated_idx:
                    last_updated = columns[last_updated_idx].strip()
                    if not last_updated or last_updated.lower() == "unknown":
                        last_updated = None

                # Si le lien principal est manquant, repli sur le thread GBAtemp
                if not url and gbatemp_url:
                    url = gbatemp_url

                source_type = determine_url_source(url)
                slug = slugify(f"{game}-{current_platform}")

                asset_type = 'nro' if url.endswith('.nro') else 'zip'

                sgdb_id, grid_url = None, None

                # Apply manual overrides if available
                if slug in overrides_data:
                    logging.info(f"Using override for {slug}")
                    sgdb_id = overrides_data[slug].get("steamgriddb_id")
                    grid_url = overrides_data[slug].get("grid_image_url")
                elif slug in existing_covers:
                    logging.info(f"Using existing cover for {slug}")
                    grid_url, sgdb_id = existing_covers[slug]
                elif sgdb_api_key:
                    sgdb_id, grid_url = fetch_sgdb_cover(game, sgdb_api_key)
                    time.sleep(0.2) # General rate limit protection

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
        logging.info(f"File {OUTPUT_FILE} generated.")
    except Exception as e:
        logging.error(f"Write error : {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
