# Metaverse crawler

Walks every world in the [Metaverse Web registry](https://github.com/zlisto/metaverse_registry), fetches each `/.well-known/metaverse.json`, and writes a portal graph for the Observatory's stellar map.

```bash
# live registry (default)
python crawl.py

# local checkout of the registry
python crawl.py --registry ../../registry/worlds.json

# custom output
python crawl.py --out ../public/network/network.json
```

Output: `../public/network/network.json` — `{ nodes, edges, stats }`. Nodes carry registry fields plus manifest description, spawn ids, and portals. Edges are directed portal links that resolve to another registered world.

No third-party packages. Needs Python 3.10+.
