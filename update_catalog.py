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

# Jeux nécessitant généralement des assets originaux (PC, Android, etc.)
ASSET_GAMES = {
    'half-life', 'quake', 'doom', 'gta', 'grand theft auto', 'tomb raider',
    'zelda', 'mario', 'sonic', 'duke nukem', 'shadow warrior', 'blood',
    'max payne', 'bully', 'return to castle wolfenstein', 'jediknight',
    'diablo', 'fallout', 'chrono trigger', 'need for speed', 'halo',
    'burnout', 'mortal kombat', 'super mario', 'modern combat', 'dead space',
    'rayman', 'plants vs. zombies', 'angry birds', 'spider-man', 'dark knight'
}

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

def check_asset_requirements(title, url):
    """Heuristique sur la nécessité de fournir des fichiers de jeu propriétaires."""
    title_lower = title.lower()

    asset_type = 'zip'
    if url.endswith('.nro'):
        asset_type = 'nro'

    requires_assets = any(known in title_lower for known in ASSET_GAMES)
    asset_hint = (
        f"Ce port nécessite les données originales du jeu ({title}). Déposez les assets requis dans le dossier de staging."
        if requires_assets else None
    )

    return asset_type, requires_assets, asset_hint

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

def main():
    sgdb_api_key = os.environ.get("SGDB_API_KEY")
    if not sgdb_api_key:
        logging.warning("SGDB_API_KEY non défini. Les URL des jaquettes ne seront pas récupérées.")

    overrides_map = {}
    if os.path.exists("title_overrides.json"):
        try:
            with open("title_overrides.json", 'r', encoding='utf-8') as f:
                overrides_map = json.load(f)
            logging.info("Chargement des overrides (title_overrides.json) réussi.")
        except Exception as e:
            logging.warning(f"Impossible de charger title_overrides.json : {e}")

    logging.info(f"Téléchargement du README depuis {URL}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        req = urllib.request.Request(URL, headers=headers)
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode('utf-8')
    except Exception as e:
        logging.error(f"Échec de récupération du README : {e}")
        sys.exit(1)

    catalog = []
    current_platform = "Unknown"
    in_table = False
    col_map = {}

    lines = content.split('\n')
    logging.info(f"Analyse de {len(lines)} lignes...")

    for idx, raw_line in enumerate(lines):
        line = raw_line.strip()

        # 1. Détection de la plateforme (Titres Markdown ##, ###, ####)
        header_match = re.match(r'^#{2,4}\s+(.*)', line)
        if header_match:
            title_text = header_match.group(1).strip()
            # On ignore les sections d'en-tête du README
            if not any(skip in title_text.lower() for skip in ['notice', 'table of contents', 'disclaimer', 'recent changes']):
                current_platform = title_text
            continue

        # 2. Détection de l'en-tête d'un tableau
        if line.startswith('|') and ('game' in line.lower() or 'title' in line.lower()):
            headers = [c.strip().lower() for c in line.split('|')[1:-1]]
            col_map = {}
            for i, name in enumerate(headers):
                col_map[name] = i
                if 'last updated' in name or 'date' in name or 'updated' in name:
                    col_map['last_updated'] = i
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
            last_updated_idx = col_map.get('last_updated', -1)

            if len(columns) > max(game_idx, link_idx):
                if current_platform.lower() == 'emulators':
                    continue

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

                last_updated = None
                if last_updated_idx != -1 and len(columns) > last_updated_idx:
                    val = columns[last_updated_idx].strip()
                    if val:
                        last_updated = val

                author, url = parse_link(link_raw)
                _, gbatemp_url = parse_link(gbatemp_raw)

                # Si le lien principal est manquant, repli sur le thread GBAtemp
                if not url and gbatemp_url:
                    url = gbatemp_url

                source_type = determine_url_source(url)
                slug = slugify(f"{game}-{current_platform}")
                asset_type, req_assets, asset_hint = check_asset_requirements(game, url)

                sgdb_id, grid_url = None, None

                if slug in overrides_map:
                    sgdb_id = overrides_map[slug].get("steamgriddb_id")
                    grid_url = overrides_map[slug].get("grid_image_url")
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
                    "requires_original_assets": req_assets,
                    "expected_asset_hint": asset_hint,
                    "last_updated": last_updated,
                    "steamgriddb_id": str(sgdb_id) if sgdb_id else None,
                    "grid_image_url": grid_url
                })
        elif in_table and (not line or not line.startswith('|')):
            in_table = False
            col_map = {}

    logging.info(f"{len(catalog)} entrées extraites avec succès.")

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        logging.info(f"Fichier {OUTPUT_FILE} généré.")
    except Exception as e:
        logging.error(f"Erreur d'écriture : {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
