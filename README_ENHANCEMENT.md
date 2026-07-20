# GameBrowse: Enhancement One (Software Design and Engineering)

The CS-499 software design enhancement of the Travlr Getaways MEAN app, re-themed
as GameBrowse. Two changes carry it. The narrative document explains the reasoning;
this file says what moved and how to run it.

## What changed
Backend, a repository layer. `app_api/repositories/BaseRepository.js` wraps any
Mongoose model. `app_api/repositories/TripRepository.js` extends it with trip
methods. `app_api/controllers/trips.js` now depends on the repository and no
longer imports the Mongoose model, so all database access sits behind one layer.

Frontend, a reusable browse module in `app_admin/src/app/browse/`. A `BrowseItem`
contract, a `BrowseListComponent` with client-side search, and a
`BrowseCardComponent`, packaged as `BrowseModule`. `trip-listing` consumes it and
maps `Trip` onto `BrowseItem`. Trips are the first consumer; game servers and
mods reuse the same module later without changing it.

## Run it
Needs Node and a running MongoDB.

1. Copy `.env.example` to `.env` and fill in the values.
2. From the repo root, start the API:

       npm install
       npm start            # API on http://localhost:3000

3. In a second terminal, start the admin:

       cd app_admin
       npm install
       npm start            # admin on http://localhost:4200

4. Open http://localhost:4200 and go to the trip listing.

If the list is empty, seed it from the repo root with Mongo running:

       node app_api/seed.js

## Run the test
From the repo root:

       npm test

This is the repository seam test. It injects a fake model and drives all five
repository operations with no database, so it passes without Mongo running.
