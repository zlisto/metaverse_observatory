export const GREETING =
  "Ah — a visitor under the dome! I'm **Dr. Nova**, keeper of the Aetheroscope. Peer into that brass eye and you'll see the whole **Metaverse Web** laid out as stars. Pick a world and teleport there."

export const LESSONS = [
  {
    q: 'What is the Aetheroscope?',
    a: "Not quite a telescope — more of a **portal-finder**. It listens for every world's `/.well-known/metaverse.json`, then paints them as planets with glowing roads where portals link. Look in, drag to orbit, click a world.",
  },
  {
    q: 'How do I use it?',
    a: 'Walk up to the Aetheroscope, aim the crosshair, then **click or press E**. Inside the star map: drag to look around, scroll to zoom, click a planet for its card, hit **Teleport** to go. **Esc** brings you back under the dome.',
  },
  {
    q: 'Where does the map come from?',
    a: 'A little crawler walks the public registry, fetches each manifest, and follows portal `href`s. Worlds that link to each other get a glowing edge. Re-run `python crawler/crawl.py` whenever the registry grows.',
  },
  {
    q: 'How do I leave?',
    a: 'The pink portal on the south arch returns you to **Metaverse Square**. Or teleport straight from the star map — the Aetheroscope is a door to everywhere.',
  },
]
