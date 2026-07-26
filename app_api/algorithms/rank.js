// Scoring, comparison, and the per-user favorite boost.
//
// The design decision this file exists to protect: the base score is global, so
// it can be computed once and shared across every user. The favorite boost is
// per user, so it gets applied on top of the cached base at request time. If you
// bake favorites into the base you cannot cache anything, because every user has
// a different ranking of the same items.

// Two floats that came out of different arithmetic are almost never exactly
// equal even when they should be. Anything closer together than this counts as
// a tie.
const EPSILON = 1e-9;

// items: array of plain objects, each with at least { id, name }
// factors: array from factors.js
// returns: Map of id -> base score
function buildBaseScores(items, factors) {
  const totalWeight = factors.reduce((s, f) => s + f.weight, 0) || 1;
  const scores = new Map();
  for (const item of items) {
    let weighted = 0;
    for (const f of factors) weighted += f.weight * f.score(item);
    scores.set(item.id, weighted / totalWeight);
  }
  return scores;
}

// a, b: { name, score }
// Higher score first. Scores within EPSILON of each other are a tie and fall
// back to name ascending, so the order is identical on every run.
// Returns a negative number, 0, or a positive number, like any sort comparator.
function compareScored(a, b) {
  if (Math.abs(a.score - b.score) < EPSILON) {
    if (a.name < b.name) return -1;
    if (a.name > b.name) return 1;
    return 0;
  }
  return b.score - a.score;
}

// baseScores: the cached Map from buildBaseScores
// favoriteIds: Set of ids this one user has favorited
// boost: number added to the base score for a favorited item
// returns: array of { id, name, score } for the ids given, boost applied
function applyFavoriteBoost(ids, itemsById, baseScores, favoriteIds, boost) {
  const out = [];
  for (const id of ids) {
    const item = itemsById.get(id);
    if (!item) continue;
    const base = baseScores.get(id) ?? 0;
    const bonus = favoriteIds.has(id) ? boost : 0;
    out.push({ id, name: item.name, score: base + bonus });
  }
  return out;
}

// Sort with compareScored, then slice. page is 1-based.
function paginate(scored, page, pageSize) {
  const sorted = [...scored].sort(compareScored);
  const start = Math.max(0, (page - 1) * pageSize);
  return { results: sorted.slice(start, start + pageSize), total: sorted.length };
}

module.exports = { EPSILON, buildBaseScores, compareScored, applyFavoriteBoost, paginate };
