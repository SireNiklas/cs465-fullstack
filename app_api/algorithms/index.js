const { Trie } = require('./trie');
const { serverFactors } = require('./factors');
const { buildBaseScores, applyFavoriteBoost, paginate } = require('./rank');

// Builds the shared, cacheable half once: the trie and the base scores. Both
// depend only on the item set and the factors, never on who is asking.
function createEngine({ items, factors = serverFactors }) {
  const trie = new Trie();
  const itemsById = new Map();

  for (const item of items) {
    itemsById.set(item.id, item);
    trie.insert(item.name, item.id);
  }

  const baseScores = buildBaseScores(items, factors);

  function query({ prefix = '', favoriteIds = new Set(), boost = 0, page = 1, pageSize = 20 } = {}) {
    const candidateIds = trie.search(prefix);
    const scored = applyFavoriteBoost(candidateIds, itemsById, baseScores, favoriteIds, boost);
    return paginate(scored, page, pageSize);
  }

  return { query, trie, baseScores, itemsById, size: items.length };
}

// Same ranking, no trie. The benchmark compares against this so the only thing
// that differs between the two paths is how candidates are found.
function naiveQuery({ items, baseScores, prefix = '', favoriteIds = new Set(), boost = 0, page = 1, pageSize = 20 }) {
  const needle = String(prefix).toLowerCase();
  const itemsById = new Map();
  const candidateIds = [];

  for (const item of items) {
    itemsById.set(item.id, item);
    if (String(item.name).toLowerCase().startsWith(needle)) candidateIds.push(item.id);
  }

  const scored = applyFavoriteBoost(candidateIds, itemsById, baseScores, favoriteIds, boost);
  return paginate(scored, page, pageSize);
}

module.exports = { createEngine, naiveQuery, serverFactors };
