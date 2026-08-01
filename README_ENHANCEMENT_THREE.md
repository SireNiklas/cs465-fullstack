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
`{ start: 1, name: 1 }`. Equality field first, then the range or sort field, so
one index serves both stages of the query.

`npm run explain` runs the queries the browse screen sends and prints the
winning plan, documents examined, and whether the result came from an index
scan or a collection scan.

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

### Aggregation pipeline
`GET /api/trips/stats` groups trips by resort and returns count, average, lowest
and highest price, and earliest departure. `perPerson` is stored as a string, so
the pipeline converts it with `$toDouble` before any math.

## Running it

```
npm install
npm run test:all      # 58 tests, no database needed
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
