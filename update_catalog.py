import urllib.request
import urllib.parse
import re
import json
import logging
import sys
import os
import time

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')

URL = "https://raw.githubusercontent.com/robzilla10001/SwitchPorts/main/README.md"
OUTPUT_FILE = "catalog.json"
OVERRIDES_FILE = "overrides.json"

def slugify(text):
    """Normalise une chaîne en slug kebab-case."""
    text = re.sub(r'[^a-zA-Z0-9\s-]', '', str(text)).strip().lower()
    return re.sub(r'[\s-]+', '-', text)

def parse_link(cell_text):
    """Extrait l'auteur et l'URL en nettoyant les balises <br>."""
    cell_text = cell_text.strip()
    if not cell_text:
        return "", ""

    # Nettoyage des balises HTML <br>
    cell_text = re.sub(r'<\s*br\s*/?>', '', cell_text, flags=re.IGNORECASE).strip()

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
    """Détermine la nature de la ressource cible."""
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
    """Nettoie les suffixes homebrew pour optimiser la recherche SteamGridDB."""
    title = re.sub(r'\(.*?\)', '', title)
    title = re.sub(r'\[.*?\]', '', title)
    title = re.sub(r'(?i)\b(port|nx|switch|remastered|hd)\b', '', title)
    title = re.sub(r'\s+', ' ', title)
    return title.strip()

def fetch_sgdb_cover(title, api_key):
    """Interroge l'API SteamGridDB pour trouver l'affiche 600x900."""
    clean_title = clean_title_for_search(title)
    if not clean_title or not api_key:
        return None, None

    headers = {
        'Authorization': f'Bearer {api_key}',
        'User-Agent': 'NSW-Ports-Scraper'
    }

    try:
        search_url = f"https://www.steamgriddb.com/api/v2/search/autocomplete/{urllib.parse.quote(clean_title)}"
        req = urllib.request.Request(search_url, headers=headers)
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            if not data.get('data'):
                return None, None
            game_id = data['data'][0]['id']

        time.sleep(0.25)

        grids_url = f"https://www.steamgriddb.com/api/v2/grids/game/{game_id}?dimensions=600x900"
        req_grid = urllib.request.Request(grids_url, headers=headers)
        with urllib.request.urlopen(req_grid, timeout=10) as resp_grid:
            grid_data = json.loads(resp_grid.read().decode('utf-8'))
            if not grid_data.get('data'):
                return str(game_id), None
            return str(game_id), grid_data['data'][0]['url']
    except Exception as e:
        logging.warning(f"Échec SteamGridDB pour '{title}': {e}")
        return None, None

def load_overrides(filepath=OVERRIDES_FILE):
    """Charge le dictionnaire des remplacements manuels."""
    if os.path.exists(filepath):
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            logging.error(f"Erreur chargement {filepath}: {e}")
    return {}

def load_existing_catalog(filepath=OUTPUT_FILE):
    """Charge et indexe le cache existant par ID et par Titre."""
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

            if img_url and str(img_url).strip() and str(img_url).lower() != "null":
                entry = (str(img_url).strip(), str(sgdb_id) if sgdb_id else None)
                if item.get("id"):
                    cache[item["id"]] = entry
                if item.get("title"):
                    cache[f"title::{slugify(item['title'])}"] = entry
        return cache
    except Exception as e:
        logging.error(f"Erreur chargement {filepath}: {e}")
        return {}

def main():
    sgdb_api_key = os.environ.get("SGDB_API_KEY")
    overrides_data = load_overrides()
    existing_covers = load_existing_catalog()

    logging.info(f"Téléchargement du README depuis {URL}...")
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    try:
        req = urllib.request.Request(URL, headers=headers)
        with urllib.request.urlopen(req, timeout=15) as resp:
            content = resp.read().decode('utf-8')
    except Exception as e:
        logging.error(f"Échec de récupération du README: {e}")
        sys.exit(1)

    catalog = []
    current_platform = "Unknown"
    in_table = False
    col_map = {}

    lines = content.split('\n')
    logging.info(f"Analyse de {len(lines)} lignes...")

    for raw_line in lines:
        line = raw_line.strip()

        # 1. Détection des sections de plateformes (## ou ###)
        header_match = re.match(r'^#{2,4}\s+(.*)', line)
        if header_match:
            title_text = header_match.group(1).strip()
            clean_title = re.sub(r'<.*?>', '', title_text).strip()
            lower_title = clean_title.lower()

            # Exclusion stricte des sections informatives et des ÉMULATEURS
            if any(skip in lower_title for skip in ['notice', 'table of contents', 'disclaimer', 'recent changes', 'special thanks']):
                current_platform = "Ignored"
                in_table = False
            elif 'emulator' in lower_title:
                current_platform = "Emulators"
                in_table = False
            else:
                current_platform = clean_title
                in_table = False
            continue

        if current_platform in ["Ignored", "Emulators"]:
            continue

        # 2. Détection d'en-tête de tableau
        clean_header = line.strip('|').strip().lower()
        if ('game' in clean_header or 'title' in clean_header) and 'version' in clean_header:
            headers = [c.strip().lower() for c in line.split('|') if c.strip()]
            col_map = {name: i for i, name in enumerate(headers)}
            in_table = True
            continue

        # 3. Ligne de séparation (|---|---|...)
        if in_table and re.match(r'^[\|\s\-:]+$', line):
            continue

        # 4. Lignes de données
        if in_table and '|' in line:
            try:
                raw_cols = line.split('|')
                if raw_cols and raw_cols[0].strip() == '':
                    raw_cols.pop(0)
                if raw_cols and raw_cols[-1].strip() == '':
                    raw_cols.pop()
                columns = [c.strip() for c in raw_cols]

                if not columns:
                    continue

                game_idx = col_map.get('game', col_map.get('title', 0))
                version_idx = col_map.get('version', 1)
                link_idx = col_map.get('link', col_map.get('repository', 3))
                gbatemp_idx = col_map.get('gbatemp thread?', col_map.get('gbatemp', 4))

                last_updated_idx = -1
                for key, idx in col_map.items():
                    if 'updated' in key or 'date' in key:
                        last_updated_idx = idx
                        break

                raw_game = columns[game_idx] if len(columns) > game_idx else ""
                game = re.sub(r'^[🟢🔴🟡🟠🟧✳️🚫♻️\s]+', '', raw_game).strip()

                version = columns[version_idx] if len(columns) > version_idx else ""
                link_raw = columns[link_idx] if len(columns) > link_idx else ""
                gbatemp_raw = columns[gbatemp_idx] if len(columns) > gbatemp_idx else ""

                author, url = parse_link(link_raw)
                _, gbatemp_url = parse_link(gbatemp_raw)
                if not url and gbatemp_url:
                    url = gbatemp_url

                # Gestion des portages secondaires ou lignes vides
                if not game:
                    if catalog and catalog[-1]['original_platform'] == current_platform:
                        # Rétablissement automatique pour Zelda ALTTP sur SNES
                        if url and "zelda" in url.lower() and "zelda" not in catalog[-1]['title'].lower():
                            repo_name = url.rstrip('/').split('/')[-1]
                            game = repo_name.replace('-', ' ').replace('_', ' ').title()
                        else:
                            game = catalog[-1]['title']
                    else:
                        continue

                last_updated = None
                if last_updated_idx != -1 and len(columns) > last_updated_idx:
                    raw_date = columns[last_updated_idx].strip()
                    if raw_date and raw_date.lower() != "unknown":
                        last_updated = raw_date

                # ID unique et dédoublonnage par auteur
                base_slug = slugify(f"{game}-{current_platform}")
                slug = base_slug
                if any(item["id"] == slug for item in catalog):
                    author_suffix = slugify(author) if author else f"alt-{len(catalog)}"
                    slug = f"{base_slug}-{author_suffix}"

                title_key = f"title::{slugify(game)}"
                source_type = determine_url_source(url)
                asset_type = 'nro' if url.endswith('.nro') else 'zip'

                grid_url = None
                sgdb_id = None

                # Priorité 1 : Overrides
                if slug in overrides_data:
                    val = overrides_data[slug]
                    grid_url = val if isinstance(val, str) else val.get("grid_image_url")
                    sgdb_id = None if isinstance(val, str) else val.get("steamgriddb_id")
                elif slugify(game) in overrides_data:
                    val = overrides_data[slugify(game)]
                    grid_url = val if isinstance(val, str) else val.get("grid_image_url")
                    sgdb_id = None if isinstance(val, str) else val.get("steamgriddb_id")

                # Priorité 2 : Cache existant (par ID ou par Titre)
                elif slug in existing_covers:
                    grid_url, sgdb_id = existing_covers[slug]
                elif title_key in existing_covers:
                    grid_url, sgdb_id = existing_covers[title_key]

                # Priorité 3 : Recherche SteamGridDB (isolée des crashs)
                elif sgdb_api_key:
                    logging.info(f"Recherche SteamGridDB pour: {game}")
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

            except Exception as row_err:
                logging.warning(f"Ligne ignorée suite à une erreur : {row_err}")
                continue

        elif in_table and (not line or not line.startswith('|')):
            in_table = False
            col_map = {}

    logging.info(f"{len(catalog)} jeux extraits avec succès.")

    try:
        with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
            json.dump(catalog, f, indent=2, ensure_ascii=False)
        logging.info(f"Fichier {OUTPUT_FILE} mis à jour avec succès.")
    except Exception as e:
        logging.error(f"Erreur d'écriture : {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
