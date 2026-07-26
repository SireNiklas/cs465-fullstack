// Score factors. The engine takes an array of these, so the mod browser can run
// the same ranking code with a different array and nothing else changes.
//
// CONTRACT:
//   Every factor is { key, weight, score(item) }.
//   score(item) returns a number in [0, 1]. Higher is better.
//   Weights do not have to sum to 1. buildBaseScores normalizes by total weight.
//   A missing or zero denominator must not produce NaN or Infinity. Guard it.
//   A missing field returns 0, it does not throw.

const serverFactors = [
  {
    key: 'fullness',
    weight: 0.5,
    // playerCount / maxPlayers, guarded. A server at capacity is not more
    // attractive than one with room, so decide what you want at the top end
    // and be ready to say why.
    score(item) {
      // Peak at busy-but-joinable (0.85) and taper down to 0.5 at capacity,
      // because a full server is a dead end even if the raw ratio looks great.
      const p = Number(item.playerCount);
      const m = Number(item.maxPlayers);
      if (!Number.isFinite(p) || !Number.isFinite(m) || m <= 0) return 0;
      const ratio = Math.max(0, Math.min(1, p / m));
      const peak = 0.85;
      const floorAtFull = 0.5;
      if (ratio <= peak) return ratio / peak;
      return floorAtFull + (1 - floorAtFull) * (1 - ratio) / (1 - peak);
    },
  },
  {
    key: 'ping',
    weight: 0.3,
    // Lower ping is better, so this one inverts. Pick a ceiling past which
    // everything scores 0.
    score(item) {
      const p = Number(item.ping);
      if (!Number.isFinite(p)) return 0;
      const CEIL = 300;
      return Math.max(0, Math.min(1, 1 - p / CEIL));
    },
  },
  {
    key: 'uptime',
    weight: 0.2,
    // uptime arrives as a fraction from 0 to 1 in the synthetic data.
    score(item) {
      const u = Number(item.uptime);
      if (!Number.isFinite(u)) return 0;
      return Math.max(0, Math.min(1, u));
    },
  },
];

module.exports = { serverFactors };
