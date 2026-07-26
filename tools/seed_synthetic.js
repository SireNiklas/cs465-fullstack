// Generates synthetic server records for the benchmark. No database involved.
// Seeded so every run produces the same set and two benchmark runs are
// comparable.
//
//   node tools/seed_synthetic.js 75000 tools/synthetic.json

const fs = require('fs');
const path = require('path');

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ADJECTIVES = ['Alpine', 'Arid', 'Amber', 'Blackwater', 'Bravo', 'Crimson', 'Dusty', 'Eastern',
  'Frozen', 'Golden', 'Granite', 'Hollow', 'Iron', 'Jade', 'Killzone', 'Lonely', 'Midnight', 'Northern',
  'Obsidian', 'Pale', 'Quiet', 'Red', 'Silent', 'Storm', 'Tundra', 'Umbra', 'Verdant', 'Western', 'Xeno', 'Zero'];

const NOUNS = ['Base', 'Basin', 'Bunker', 'Camp', 'Canyon', 'Crossing', 'Depot', 'Outpost', 'Ridge',
  'Sector', 'Station', 'Valley', 'Works', 'Yard'];

const REGIONS = ['na-east', 'na-west', 'eu-central', 'eu-north', 'ap-south', 'sa-east'];

function generate(count, seed = 1) {
  const rnd = mulberry32(seed);
  const items = new Array(count);

  for (let i = 0; i < count; i++) {
    const adj = ADJECTIVES[Math.floor(rnd() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(rnd() * NOUNS.length)];
    const maxPlayers = [16, 32, 48, 64, 100][Math.floor(rnd() * 5)];

    items[i] = {
      id: `srv-${i}`,
      name: `${adj} ${noun} ${Math.floor(rnd() * 900) + 100}`,
      region: REGIONS[Math.floor(rnd() * REGIONS.length)],
      playerCount: Math.floor(rnd() * (maxPlayers + 1)),
      maxPlayers,
      ping: Math.floor(rnd() * 280) + 8,
      uptime: Math.round(rnd() * 10000) / 10000,
    };
  }

  return items;
}

module.exports = { generate };

if (require.main === module) {
  const count = Number(process.argv[2] || 75000);
  const out = process.argv[3] || path.join(__dirname, 'synthetic.json');
  const started = Date.now();
  const items = generate(count);
  fs.writeFileSync(out, JSON.stringify(items));
  const mb = (fs.statSync(out).size / 1048576).toFixed(1);
  console.log(`wrote ${items.length} records to ${out} (${mb} MB) in ${Date.now() - started} ms`);
}
