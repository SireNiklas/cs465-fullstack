// Turns an untrusted req.query into a Mongoose filter. Anything not named here
// never reaches the database. The old code passed nothing through at all, so
// this is the layer that makes filtering possible without opening a hole.
//
// Express parses ?code[$ne]= into an object. That is the NoSQL injection path,
// and rejecting any value that is not a plain string closes it.

const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 20;

const SORTABLE = new Set(['name', 'start', 'code', 'resort']);

// escape anything the regex engine would treat as syntax, including the
// quantifiers that make a catastrophic backtracking pattern possible
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isPlainString(value) {
  return typeof value === 'string';
}

function buildTripQuery(rawQuery = {}) {
  const errors = [];
  const filter = {};
  const options = { limit: DEFAULT_LIMIT, skip: 0 };
  let sort = null;

  const handlers = {
    code(value) {
      filter.code = value;
    },
    resort(value) {
      filter.resort = value;
    },
    name(value) {
      // Anchored prefix against the lowercased copy of the name. No 'i' flag:
      // a case insensitive regex cannot produce index bounds, so it would read
      // every key in the index. Lowercasing the input instead keeps the search
      // case insensitive and keeps the bounds tight.
      filter.nameLower = new RegExp('^' + escapeRegex(value.toLowerCase()));
    },
    startAfter(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        errors.push('startAfter is not a valid date');
        return;
      }
      filter.start = Object.assign({}, filter.start, { $gte: date });
    },
    startBefore(value) {
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) {
        errors.push('startBefore is not a valid date');
        return;
      }
      filter.start = Object.assign({}, filter.start, { $lte: date });
    },
    sort(value) {
      const descending = value.startsWith('-');
      const field = descending ? value.slice(1) : value;
      if (!SORTABLE.has(field)) {
        errors.push(`sort field not allowed: ${field}`);
        return;
      }
      sort = { [field]: descending ? -1 : 1 };
    },
    limit(value) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        errors.push('limit must be a positive integer');
        return;
      }
      options.limit = Math.min(parsed, MAX_LIMIT);
    },
    page(value) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isInteger(parsed) || parsed < 1) {
        errors.push('page must be a positive integer');
        return;
      }
      options.page = parsed;
    },
  };

  for (const key of Object.keys(rawQuery)) {
    const handler = handlers[key];
    if (!handler) {
      errors.push(`unknown query parameter: ${key}`);
      continue;
    }
    const value = rawQuery[key];
    if (!isPlainString(value)) {
      errors.push(`${key} must be a single string value`);
      continue;
    }
    if (value.length === 0) {
      errors.push(`${key} must not be empty`);
      continue;
    }
    handler(value);
  }

  options.skip = ((options.page || 1) - 1) * options.limit;
  if (sort) options.sort = sort;

  return { filter, options, errors };
}

module.exports = { buildTripQuery, escapeRegex, MAX_LIMIT, DEFAULT_LIMIT, SORTABLE };
