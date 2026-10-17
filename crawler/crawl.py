#!/usr/bin/env python3
"""Crawl the Metaverse Web registry and build a portal network graph.

Reads worlds.json (local path or live URL), fetches each world's
/.well-known/metaverse.json, and writes network.json with nodes + edges
for portals that point at other registered worlds.

Usage:
  python crawl.py
  python crawl.py --registry ../registry/worlds.json
  python crawl.py --registry https://raw.githubusercontent.com/zlisto/metaverse_registry/main/worlds.json
  python crawl.py --out ../public/network/network.json
"""

from __future__ import annotations

import argparse
import json
import math
import ssl
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from urllib.parse import urlparse, urlunparse

DEFAULT_REGISTRY = (
    "https://raw.githubusercontent.com/zlisto/metaverse_registry/main/worlds.json"
)
HERE = Path(__file__).resolve().parent
DEFAULT_OUT = HERE.parent / "public" / "network" / "network.json"

# GitHub Pages + most hosts send CORS *; no special client needed from Python.
CTX = ssl.create_default_context()
TIMEOUT = 12


def fetch_json(url: str) -> dict:
    req = urllib.request.Request(url, headers={"User-Agent": "metaverse-crawler/0.1"})
    with urllib.request.urlopen(req, timeout=TIMEOUT, context=CTX) as res:
        return json.loads(res.read().decode("utf-8"))


def load_registry(src: str) -> dict:
    if src.startswith("http://") or src.startswith("https://"):
        return fetch_json(src)
    path = Path(src)
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_address(url: str) -> str:
    """Collapse common address variants so portal hrefs match registry entries."""
    try:
        p = urlparse(url.strip())
    except Exception:
        return url.rstrip("/")
    scheme = (p.scheme or "https").lower()
    host = (p.hostname or "").lower()
    if host.startswith("www."):
        host = host[4:]
    path = p.path or "/"
    if not path.endswith("/") and not path.rsplit("/", 1)[-1].count("."):
        # directory-style address without trailing slash
        path = path + "/"
    # strip index.html / trailing index
    if path.endswith("/index.html"):
        path = path[: -len("index.html")]
    # keep a non-directory page (e.g. office.html) as-is
    netloc = host
    if p.port and not ((scheme == "https" and p.port == 443) or (scheme == "http" and p.port == 80)):
        netloc = f"{host}:{p.port}"
    return urlunparse((scheme, netloc, path, "", "", ""))


def manifest_url(address: str) -> str:
    # For page URLs like .../office.html, manifest is still .../.well-known/metaverse.json
    p = urlparse(address)
    path = p.path or "/"
    if path.endswith(".html"):
        base_path = path.rsplit("/", 1)[0] + "/"
    else:
        base_path = path if path.endswith("/") else path + "/"
    base = urlunparse((p.scheme, p.netloc, base_path, "", "", ""))
    return urllib.parse.urljoin(base, ".well-known/metaverse.json")


def resolve_owner(href: str, by_addr: dict[str, dict]) -> str | None:
    norm = normalize_address(href)
    if norm in by_addr:
        return by_addr[norm]["id"]
    # try without trailing slash / with
    alt = norm[:-1] if norm.endswith("/") else norm + "/"
    if alt in by_addr:
        return by_addr[alt]["id"]
    # prefix match: portal to a subpath of a registered world
    for addr, w in by_addr.items():
        if norm.startswith(addr) or addr.startswith(norm):
            return w["id"]
    return None


def layout_positions(ids: list[str]) -> dict[str, list[float]]:
    """Put worlds on a gentle spiral so the hub sits near the center."""
    # Prefer hub near origin when present
    ordered = list(ids)
    if "metaverse_square" in ordered:
        ordered.remove("metaverse_square")
        ordered = ["metaverse_square"] + ordered
    pos: dict[str, list[float]] = {}
    for i, wid in enumerate(ordered):
        if i == 0:
            pos[wid] = [0.0, 0.0, 0.0]
            continue
        # golden-angle spiral on a plane, slight height variety
        a = i * 2.399963229728653  # golden angle
        r = 3.2 * math.sqrt(i)
        pos[wid] = [round(math.cos(a) * r, 3), round(((i % 5) - 2) * 0.35, 3), round(math.sin(a) * r, 3)]
    return pos


def crawl(registry: dict) -> dict:
    worlds = registry.get("worlds") or []
    by_addr: dict[str, dict] = {}
    nodes_meta: dict[str, dict] = {}

    for w in worlds:
        wid = w.get("id")
        addr = w.get("address")
        if not wid or not addr:
            continue
        nodes_meta[wid] = {
            "id": wid,
            "name": w.get("name") or wid,
            "address": addr,
            "owner": w.get("owner") or "",
        }
        by_addr[normalize_address(addr)] = w

    nodes = []
    edges = []
    edge_keys: set[tuple[str, str]] = set()
    errors = []

    for wid, meta in nodes_meta.items():
        murl = manifest_url(meta["address"])
        node = {
            **meta,
            "description": "",
            "spawns": [],
            "online": False,
            "portals": [],
        }
        try:
            m = fetch_json(murl)
            node["online"] = True
            node["description"] = (m.get("description") or "")[:280]
            node["name"] = m.get("name") or node["name"]
            spawns = m.get("spawns") or {}
            node["spawns"] = list(spawns.keys()) if isinstance(spawns, dict) else []
            portals = m.get("portals") or []
            if not isinstance(portals, list):
                portals = []
            for p in portals:
                href = p.get("href")
                if not href:
                    continue
                target = resolve_owner(href, by_addr)
                portal_rec = {
                    "id": p.get("id") or "",
                    "label": p.get("label") or "",
                    "href": href,
                    "spawn": p.get("spawn") or "default",
                    "target": target,
                }
                node["portals"].append(portal_rec)
                if target and target != wid:
                    key = (wid, target)
                    if key not in edge_keys:
                        edge_keys.add(key)
                        edges.append(
                            {
                                "from": wid,
                                "to": target,
                                "label": portal_rec["label"],
                                "spawn": portal_rec["spawn"],
                            }
                        )
            print(f"OK  {wid.ljust(24)} {len(node['portals'])} portal(s) -> {murl}")
        except Exception as e:
            err = f"{type(e).__name__}: {e}"
            errors.append({"id": wid, "url": murl, "error": err})
            print(f"ERR {wid.ljust(24)} {err}")
        nodes.append(node)

    positions = layout_positions([n["id"] for n in nodes])
    for n in nodes:
        n["position"] = positions.get(n["id"], [0, 0, 0])

    return {
        "protocol": "mvw/0.1",
        "kind": "metaverse_network",
        "source": "metaverse_registry",
        "nodes": nodes,
        "edges": edges,
        "errors": errors,
        "stats": {
            "worlds": len(nodes),
            "online": sum(1 for n in nodes if n["online"]),
            "edges": len(edges),
        },
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Crawl Metaverse Web portal links")
    ap.add_argument("--registry", default=DEFAULT_REGISTRY, help="worlds.json path or URL")
    ap.add_argument("--out", default=str(DEFAULT_OUT), help="output network.json path")
    args = ap.parse_args()

    print(f"Registry: {args.registry}")
    try:
        registry = load_registry(args.registry)
    except Exception as e:
        print(f"Failed to load registry: {e}", file=sys.stderr)
        return 1

    graph = crawl(registry)
    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(graph, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    s = graph["stats"]
    print(f"\nWrote {out}")
    print(f"{s['online']}/{s['worlds']} online, {s['edges']} directed portal edges")
    return 0 if s["online"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
