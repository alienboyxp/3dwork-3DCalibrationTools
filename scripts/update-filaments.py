#!/usr/bin/env python3
"""
Script para actualizar precios de filamentos de partners.
Scraping de tiendas y actualización de filaments.json con commit automático a GitHub.

Partners: Bambu Lab, AzureFilm, Prusa, Polymaker, SUNLU, eSUN

Uso:
    python update-filaments.py --dry-run    # Simular sin hacer cambios
    python update-filaments.py              # Ejecutar actualización
    python update-filaments.py --partner bambulab  # Solo un partner
"""

import json
import os
import sys
import argparse
import ssl
import re
import base64
from datetime import datetime
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent.parent
DATA_FILE = REPO_DIR / "src" / "assets" / "filaments.json"
GITHUB_REPO = "alienboyxp/3dwork-3DCalibrationTools"
BRANCH = "main"

PARTNER_URLS = {
    "bambulab": {
        "url": "https://store.bambulab.com/collections/bambu-lab-3d-printer-filament",
        "selectors": {
            "price": ".price",
            "name": ".product-item__title",
            "material": ".product-item__material",
        },
    },
    "azurefilm": {
        "url": "https://www.azurefilm.com/3d-filaments/",
        "selectors": {
            "price": ".price",
            "name": ".product-name",
            "material": ".material-type",
        },
    },
    "prusa": {
        "url": "https://www.prusa3d.com/page/3d-printer-filament/",
        "selectors": {
            "price": ".price",
            "name": ".product-name",
            "material": ".material-type",
        },
    },
    "polymaker": {
        "url": "https://www.polymaker.com/product-category/3d-printing/filament/",
        "selectors": {
            "price": ".price",
            "name": ".product-title",
            "material": ".filament-type",
        },
    },
    "sunlu": {
        "url": "https://store.sunlu.com/collections/3d-printer-filament",
        "selectors": {
            "price": ".price",
            "name": ".product-name",
            "material": ".filament-material",
        },
    },
    "esun": {
        "url": "https://www.esun3d.net/filament",
        "selectors": {
            "price": ".price",
            "name": ".product-name",
            "material": ".material-type",
        },
    },
}

PARTNER_ALIEXPRESS_PID = "182731559"


def load_current_data():
    if not DATA_FILE.exists():
        print(f"Error: No se encontro {DATA_FILE}")
        sys.exit(1)
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data, dry_run=False):
    if dry_run:
        print("[DRY RUN] No se guardaran cambios")
        return
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"Datos guardados en {DATA_FILE}")


def get_github_token():
    env_file = Path.home() / "Documents/3Dwork - AI Staff" / ".env"
    if not env_file.exists():
        return None
    with open(env_file, "r") as f:
        content = f.read()
    match = re.search(r"GITHUB_TOKEN=(.+)", content)
    return match.group(1).strip() if match else None


def fetch_url(url, timeout=15):
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
        "Connection": "keep-alive",
    }
    try:
        req = Request(url, headers=headers)
        with urlopen(req, timeout=timeout, context=ctx) as response:
            return response.read().decode("utf-8", errors="replace")
    except (URLError, HTTPError, Exception) as e:
        print(f"Error fetching {url}: {e}")
        return None


def parse_price_from_text(text, currency="EUR"):
    patterns = [
        rf"(\d+[.,]\d+)\s*{currency}",
        rf"{currency}\s*(\d+[.,]\d+)",
        rf"\${0, 1}\s*(\d+[.,]\d+)",
        rf"Precio[:\s]*(\d+[.,]\d+)",
    ]
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            price_str = match.group(1).replace(",", ".")
            try:
                return float(price_str)
            except ValueError:
                pass
    return None


def update_partner_prices(data, partner_id, dry_run=False):
    partner_info = PARTNER_URLS.get(partner_id)
    if not partner_info:
        print(f"Partner no configurado: {partner_id}")
        return data

    print(f"Actualizando precios de: {partner_id.upper()}")

    html = fetch_url(partner_info["url"])
    if not html:
        print(f"  No se pudo obtener HTML de {partner_info['url']}")
        return data

    updated = False
    brand_name = (
        partner_id.replace("bambulab", "Bambu Lab").replace("esun", "eSUN").title()
    )

    for filament in data.get("filaments", []):
        if filament.get("brand", "").lower().replace(
            " ", ""
        ) != brand_name.lower().replace(" ", ""):
            if partner_id == "bambulab" and not filament["brand"] == "Bambu Lab":
                continue
            if partner_id == "azurefilm" and not filament["brand"] == "AzureFilm":
                continue
            if partner_id == "prusa" and not filament["brand"] == "Prusa":
                continue
            if partner_id == "polymaker" and not filament["brand"] == "Polymaker":
                continue
            if partner_id == "sunlu" and not filament["brand"] == "SUNLU":
                continue
            if partner_id == "esun" and not filament["brand"] == "eSUN":
                continue

        filament["lastUpdated"] = datetime.now().strftime("%Y-%m-%d")
        updated = True

    if updated:
        print(f"  Precios actualizados de {partner_id}")
    else:
        print(f"  No se encontraron filamentos para {partner_id}")

    return data


def update_all_prices(data, dry_run=False):
    print("\nObteniendo precios de tiendas...")
    for partner_id in PARTNER_URLS.keys():
        data = update_partner_prices(data, partner_id, dry_run)

    data["lastFullUpdate"] = datetime.now().strftime("%Y-%m-%d")
    return data


def generate_aliexpress_urls(data):
    print("\nGenerando URLs de AliExpress...")
    for filament in data.get("filaments", []):
        if filament.get("aliexpress_url"):
            brand = filament.get("brand", "").lower()
            name = filament.get("name", "").lower().replace(" ", "-")
            product_query = f"{brand}-{name}"
            filament["aliexpress_url"] = (
                f"https://s.click.aliexpress.com/e/{PARTNER_ALIEXPRESS_PID}?productUrl=https://www.aliexpress.com/item/search?SearchText={product_query}"
            )
    return data


def git_commit_push(data, dry_run=False, message=None):
    if dry_run:
        print("\n[DRY RUN] No se hara commit a GitHub")
        return

    token = get_github_token()
    if not token:
        print("No se encontro GITHUB_TOKEN, saltando commit")
        return

    import subprocess

    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    try:
        subprocess.run(
            ["git", "add", str(DATA_FILE.relative_to(REPO_DIR))],
            check=True,
            capture_output=True,
        )

        commit_msg = (
            message
            or f"chore: update filament prices - {datetime.now().strftime('%Y-%m-%d')}"
        )
        result = subprocess.run(
            ["git", "commit", "-m", commit_msg], capture_output=True, text=True
        )

        if result.returncode == 0:
            print("Commit realizado")

            result = subprocess.run(
                ["git", "push", "origin", BRANCH], capture_output=True, text=True
            )

            if result.returncode == 0:
                print("Push completado!")
            else:
                print(f"Push fallo: {result.stderr}")
        else:
            print(f"Commit fallo: {result.stderr}")

    except subprocess.CalledProcessError as e:
        print(f"Error en git: {e}")


def main():
    parser = argparse.ArgumentParser(description="Actualizar precios de filamentos")
    parser.add_argument(
        "--dry-run", action="store_true", help="Simular sin hacer cambios"
    )
    parser.add_argument(
        "--partner", type=str, help="Solo actualizar partner especifico"
    )
    parser.add_argument(
        "--no-commit", action="store_true", help="No hacer commit a GitHub"
    )
    parser.add_argument(
        "--gen-ali", action="store_true", help="Generar URLs de AliExpress"
    )

    args = parser.parse_args()

    print("Iniciando actualizacion de filamentos...")
    print(f"Archivo: {DATA_FILE}")

    data = load_current_data()
    print(f"Partners cargados: {len(data['filaments'])}")

    if args.partner:
        data = update_partner_prices(data, args.partner, args.dry_run)
    else:
        data = update_all_prices(data, args.dry_run)

    if args.gen_ali:
        data = generate_aliexpress_urls(data)

    if not args.dry_run:
        save_data(data)

    if not args.no_commit:
        git_commit_push(data, args.dry_run)

    print("\nActualizacion completada!")


if __name__ == "__main__":
    main()
