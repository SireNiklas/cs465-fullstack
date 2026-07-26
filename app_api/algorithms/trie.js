// Prefix trie for search-as-you-type over item names.
//
// CONTRACT (the tests in test/ranking.test.js hold you to this):
//   insert(name, id)   stores id under the lowercased name
//   search(prefix)     returns an array of ids whose name starts with prefix,
//                      lowercased and case-insensitive. Empty or missing prefix
//                      returns every id that was inserted.
//   Cost of search must depend on prefix length plus the number of matches,
//   not on the total number of items inserted. That is the whole point of the
//   structure and it is what benchmark.js measures.
//
// Duplicate names are legal. Two servers can share a name, so a node has to be
// able to hold more than one id.

class Trie {
  constructor() {
    this.root = { children: new Map(), ids: [] };
    this.size = 0;
  }

  insert(name, id) {
    let node = this.root;
    node.ids.push(id);
    for (const ch of String(name).toLowerCase()) {
      let next = node.children.get(ch);
      if (!next) {
        next = { children: new Map(), ids: [] };
        node.children.set(ch, next);
      }
      next.ids.push(id);
      node = next;
    }
    this.size++;
  }

  search(prefix) {
    let node = this.root;
    for (const ch of String(prefix || '').toLowerCase()) {
      node = node.children.get(ch);
      if (!node) return [];
    }
    return node.ids.slice();
  }
}

module.exports = { Trie };
