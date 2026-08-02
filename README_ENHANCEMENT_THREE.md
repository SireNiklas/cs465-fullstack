# Enhancement Three: Databases and Security

Branch: `feat/module-five-databases`, cut from `feat/module-four-algorithms`.

The code review found two things wrong with this application beyond the schema
work: passwords were hashed at 1000 PBKDF2 iterations, and every write route
checked only that a JWT was valid, never who it belonged to. Both are fixed
here, along with the query and index work the browse screen needs.

## What changed

### Query parameter whitelisting
`app_api/query/tripQuery.js` converts `req.query` into a Mongoose filter. Six
parameters are accepted (`code`, `resort`, `name`, `startAfter`, `startBefore`)
plus `sort`, `limit`, and `page`. Anything else is a 400 and never reaches the
database.

Express parses `?code[$ne]=` into an object, which is how NoSQL operator
injection gets in. Any value that is not a plain string is rejected. The `name`
parameter becomes an anchored prefix regex with every metacharacter escaped, so
a caller cannot supply a pattern that backtracks catastrophically.

### Compound indexes
`app_api/models/travlr.js` adds `{ resort: 1, start: 1 }` and
`{ name: 1, start: 1 }`.

The second one started as `{ start: 1, name: 1 }` and the planner refused it.
Running `explain()` showed it walking the single field name index instead. The
reason is that a range scan on `start` returns rows out of name order, so
sorting by name afterward would need a blocking sort. Putting the sort field
first and the range field second lets one index satisfy both stages. The order
is equality, then sort, then range.

The name search had a second problem that only showed up at size. The whitelist
built a case insensitive regex, and a case insensitive pattern cannot produce
index bounds, so a prefix search read every key in the index: 50,000 keys
examined to return 10 documents. The schema now carries `nameLower`, a
lowercased copy kept in step by save, insertMany, and findOneAndUpdate hooks.
The whitelist lowercases the caller's input and matches a case sensitive
anchored pattern against that field, which restores the bounds without changing
what the caller experiences.

`npm run migrate:trips` fills in `nameLower` on existing documents and syncs the
collection indexes to the schema, dropping the ones that are no longer used.

`npm run explain` runs the queries the browse screen sends and prints the
winning plan, the index chosen, and documents examined. Each case runs a second
time forced onto a collection scan with a `$natural` hint, so the indexed and
unindexed numbers sit next to each other. The seed set is only a handful of
trips, so `node tools/explain_indexes.js --scale 50000` builds a throwaway
collection, indexes it the same way, measures against that, and drops it.

### Favorites with owner scoped access
`app_api/models/favorite.js` holds one document per user per trip, with a unique
compound index on `{ user, tripCode }`.

`app_api/repositories/FavoriteRepository.js` has no method that can run without
an owner id. Every method folds the id into the filter before the query is
built and throws if it is missing. The controller reads the owner id off the
verified token, so there is no place for a caller to put someone else's id.

### Role checks off the JWT
`app_api/middleware/authorize.js` adds `requireAuth` and `requireRole`. The user
schema carries a `role` field and `generateJwt` puts it in the token, so
authorization does not cost a database read per request. POST, PUT, and DELETE
on `/api/trips` now need the admin role. A valid token with the user role gets a
403.

### PBKDF2 iteration count
`app_api/security/password.js` writes new hashes at 210,000 iterations using
SHA-512, and compares with `crypto.timingSafeEqual` instead of string equality.

Raising the count would normally lock out every existing account. The iteration
count is stored on each user record and verification uses the stored value, so
old hashes keep working. Login is the only moment the plaintext exists, so the
local strategy rehashes at the current count right after a successful check.

### Error responses that leak nothing
Found by reading the server log during live testing. An unauthenticated request
to any protected API route came back as a 2,938 byte HTML page containing a full
Node stack trace: absolute filesystem paths, project layout, dependency
internals.

The cause was handler order. `app.js` registered a generic renderer that put
`err.stack` into the page whenever `NODE_ENV` was not `production`, and after it
a handler meant to turn JWT failures into JSON. Express runs error handlers in
registration order and the renderer never called `next()`, so the JSON handler
had never executed once.

There is now one error handler. It answers JSON for anything under `/api`,
renders the HTML page for the public site, logs 5xx detail to the server
console, and never puts a stack or an internal message in a response.
`error.hbs` no longer contains a `<pre>` block at all. The same request is now
46 bytes.

### Aggregation pipeline
`GET /api/trips/stats` groups trips by resort and returns count, average, lowest
and highest price, and earliest departure. `perPerson` is stored as a string, so
the pipeline converts it with `$toDouble` before any math.

## Running it

```
npm install
npm run test:all      # 58 tests, no database needed
npm run migrate:trips # backfill nameLower and sync indexes, needs MongoDB
npm run seed:users    # admin, regular, and one deliberately legacy account
npm run explain       # index scan vs collection scan, needs MongoDB running
npm start
```

Seeded accounts:

| Email | Password | Role |
|---|---|---|
| admin@gamebrowse.test | admin-pass-1234 | admin |
| player@gamebrowse.test | player-pass-1234 | user |
| legacy@gamebrowse.test | legacy-pass-1234 | user, hashed at 1000 iterations |

Log in as the legacy account once and the record moves to 210,000 iterations.

## Endpoints added or changed

| Method | Route | Auth |
|---|---|---|
| GET | `/api/trips` | public, query whitelisted |
| GET | `/api/trips/stats` | any authenticated user |
| POST | `/api/trips` | admin only |
| PUT | `/api/trips/:tripCode` | admin only |
| DELETE | `/api/trips/:tripCode` | admin only |
| GET | `/api/favorites` | authenticated, own rows only |
| POST | `/api/favorites` | authenticated, own rows only |
| DELETE | `/api/favorites/:tripCode` | authenticated, own rows only |

Any unmatched path under `/api` answers 404 in JSON instead of falling through
to the HTML 404 page.
