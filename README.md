# Metaverse Observatory

A planetarium on the [Metaverse Web](https://github.com/zlisto/metaverse_web) (`mvw/0.1`). Walk under the dome, talk to **Dr. Nova**, then peer into the **Aetheroscope** to see every registered world as a star — with glowing roads where portals link them — and teleport there.

**Live:** https://zlisto.github.io/metaverse_observatory/

## Play locally

```bash
npm install
npm run crawl   # refresh public/network/network.json from the registry
npm run dev     # http://localhost:5179/
```

## Crawler

`crawler/crawl.py` fetches the registry and each world's `/.well-known/metaverse.json`, then writes the portal graph the stellar map reads.

```bash
python crawler/crawl.py
python crawler/crawl.py --registry ../registry/worlds.json
```

## Protocol

- Manifest: `public/.well-known/metaverse.json`
- Client: `src/mvw.js`
- Portal back to Metaverse Square on the south arch
- Spawns: `default`, `from_square`
