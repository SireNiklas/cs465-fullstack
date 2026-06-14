#!/usr/bin/env bash
# verify_module6.sh <repo-path>
# Usage: PORT=3000 bash verify_module6.sh ~/projects/cs465-fullstack

REPO="${1:-$HOME/projects/cs465-fullstack}"
PORT="${PORT:-3000}"
PASS=0; FAIL=0; WARN=0

green()  { echo "  ✓ $*"; ((PASS++)); }
red()    { echo "  ✗ $*"; ((FAIL++)); }
yellow() { echo "  ! $*"; ((WARN++)); }
header() { echo ""; echo "$*"; }

cd "$REPO" 2>/dev/null || { echo "FATAL: repo not found at $REPO"; exit 1; }

# ── Git ────────────────────────────────────────────────────────────────────────
header "Git"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
[[ "$BRANCH" == "module6" ]] && green "current branch: module6" || red "not on module6 (on: $BRANCH)"
git show-ref --verify --quiet refs/heads/module6 && green "module6 branch exists" || red "module6 branch missing"
git show-ref --verify --quiet refs/remotes/origin/module6 \
  && green "module6 pushed to origin" \
  || yellow "origin/module6 not seen locally - run: git push -u origin module6"
[[ -z "$(git status --porcelain)" ]] && green "working tree clean" || yellow "uncommitted changes - commit before zipping"

# ── File structure ─────────────────────────────────────────────────────────────
header "File Structure"
check_file() { [[ -f "$REPO/$1" ]] && green "$1" || red "missing: $1"; }
check_dir()  { [[ -d "$REPO/$1" ]] && green "$1/" || red "missing dir: $1/"; }

check_file "app.js"
check_dir  "app_api"
check_file "app_api/models/travlr.js"
check_file "app_api/models/db.js"
check_file "app_api/controllers/trips.js"
check_file "app_api/routes/index.js"
check_dir  "app_admin"
check_file "app_admin/src/app/trip-listing/trip-listing.component.ts"
check_file "app_admin/src/app/trip-card/trip-card.component.ts"
check_file "app_admin/src/app/add-trip/add-trip.component.ts"
check_file "app_admin/src/app/edit-trip/edit-trip.component.ts"
check_file "app_admin/src/app/trip-data.service.ts"
check_file "app_admin/src/app/models/trip.ts"
check_file "app_admin/src/app/app.routes.ts"
check_file "app_admin/src/app/app.config.ts"
check_dir  "app_admin/node_modules"

# ── travel.js fix ─────────────────────────────────────────────────────────────
header "travel.js (static JSON → Mongoose fix)"
TRAVEL="$REPO/app_server/controllers/travel.js"
if grep -q "require.*trips.json" "$TRAVEL" 2>/dev/null; then
  red "travel.js still reads from static JSON — not fixed"
elif grep -q "Trip\|travlr\|mongoose\|find" "$TRAVEL" 2>/dev/null; then
  green "travel.js reads from MongoDB"
else
  yellow "travel.js content unclear - manual check recommended"
fi

# ── Express API: all 4 verbs ───────────────────────────────────────────────────
header "Express API Routes (app_api/routes/index.js)"
ROUTES="$REPO/app_api/routes/index.js"
grep -q "\.get(" "$ROUTES"    && green "GET route defined"    || red "GET route missing"
grep -q "\.post(" "$ROUTES"   && green "POST route defined"   || red "POST route missing"
grep -q "\.put(" "$ROUTES"    && green "PUT route defined"    || red "PUT route missing"
grep -q "\.delete(" "$ROUTES" && green "DELETE route defined" || red "DELETE route missing"

# ── Express API: controller methods ───────────────────────────────────────────
header "Express API Controller (app_api/controllers/trips.js)"
CTRL="$REPO/app_api/controllers/trips.js"
grep -q "tripsList"       "$CTRL" && green "tripsList defined"       || red "tripsList missing"
grep -q "tripsFindByCode" "$CTRL" && green "tripsFindByCode defined" || red "tripsFindByCode missing"
grep -q "tripsAddTrip"    "$CTRL" && green "tripsAddTrip defined"    || red "tripsAddTrip missing"
grep -q "tripsUpdateTrip" "$CTRL" && green "tripsUpdateTrip defined" || red "tripsUpdateTrip missing"
grep -q "tripsDeleteTrip" "$CTRL" && green "tripsDeleteTrip defined" || red "tripsDeleteTrip missing"
grep -q "Trip.create\|\.create(" "$CTRL"        && green "POST uses create()"         || red "POST create() missing"
grep -q "findOneAndUpdate"        "$CTRL"        && green "PUT uses findOneAndUpdate()" || red "PUT findOneAndUpdate() missing"
grep -q "findOneAndDelete\|findByIdAndDelete" "$CTRL" && green "DELETE uses findOneAndDelete()" || red "DELETE method missing"
grep -q "status(201)\|201"        "$CTRL"        && green "POST returns 201"           || yellow "POST may not return 201"
grep -q "status(204)\|204\|send()" "$CTRL"       && green "DELETE returns 204"         || yellow "DELETE may not return 204"

# ── app.js wiring ─────────────────────────────────────────────────────────────
header "app.js Wiring"
APP="$REPO/app.js"
grep -q "app_api/routes" "$APP" && green "app.js requires api router" || red "app.js missing api router require"
grep -q "'/api'" "$APP"         && green "api router mounted at /api" || red "api router not mounted at /api"
grep -q "Access-Control-Allow-Origin" "$APP" && green "CORS headers present" || yellow "CORS headers not found - Angular may be blocked"

# ── Angular: standalone components ────────────────────────────────────────────
header "Angular Components (standalone mode)"
for comp in trip-listing trip-card add-trip edit-trip; do
  FILE="$REPO/app_admin/src/app/${comp}/${comp}.component.ts"
  if [[ -f "$FILE" ]]; then
    grep -q "standalone: true" "$FILE" && green "$comp: standalone: true" || yellow "$comp: missing standalone:true"
    grep -q "imports:" "$FILE"         && green "$comp: imports[] present" || yellow "$comp: imports[] missing"
  else
    red "$comp component file missing"
  fi
done

# ── Angular: TripDataService ───────────────────────────────────────────────────
header "Angular TripDataService"
SVC="$REPO/app_admin/src/app/trip-data.service.ts"
grep -q "HttpClient"  "$SVC" && green "HttpClient injected"  || red "HttpClient missing"
grep -q "getTrips"    "$SVC" && green "getTrips() defined"   || red "getTrips() missing"
grep -q "getTrip"     "$SVC" && green "getTrip() defined"    || red "getTrip() missing"
grep -q "addTrip"     "$SVC" && green "addTrip() defined"    || red "addTrip() missing"
grep -q "updateTrip"  "$SVC" && green "updateTrip() defined" || red "updateTrip() missing"
grep -q "deleteTrip"  "$SVC" && green "deleteTrip() defined" || red "deleteTrip() missing"
grep -q "http.post"   "$SVC" && green "POST call present"    || red "POST http call missing"
grep -q "http.put"    "$SVC" && green "PUT call present"     || red "PUT http call missing"
grep -q "http.delete" "$SVC" && green "DELETE call present"  || red "DELETE http call missing"

# ── Angular: app.config.ts ────────────────────────────────────────────────────
header "Angular app.config.ts"
CFG="$REPO/app_admin/src/app/app.config.ts"
grep -q "provideHttpClient" "$CFG" && green "provideHttpClient registered" || red "provideHttpClient missing - HTTP calls will fail"
grep -q "provideRouter"     "$CFG" && green "provideRouter registered"     || red "provideRouter missing"

# ── Angular: routes ───────────────────────────────────────────────────────────
header "Angular Routes (app.routes.ts)"
RTS="$REPO/app_admin/src/app/app.routes.ts"
grep -q "TripListingComponent" "$RTS" && green "/ → TripListingComponent"  || red "TripListingComponent route missing"
grep -q "AddTripComponent"     "$RTS" && green "add-trip route defined"     || red "AddTripComponent route missing"
grep -q "EditTripComponent"    "$RTS" && green "edit-trip route defined"    || red "EditTripComponent route missing"

# ── Angular: Trip model ───────────────────────────────────────────────────────
header "Angular Trip Interface"
MODEL="$REPO/app_admin/src/app/models/trip.ts"
for field in code name length start resort perPerson image description; do
  grep -q "$field" "$MODEL" && green "Trip.$field defined" || red "Trip.$field missing"
done

# ── Live endpoint tests ────────────────────────────────────────────────────────
header "Live Endpoint Tests (Express on :$PORT)"
if curl -s "http://localhost:$PORT/api/trips" > /dev/null 2>&1; then
  # GET all
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/trips")
  [[ "$STATUS" == "200" || "$STATUS" == "304" ]] && green "GET /api/trips → $STATUS" || red "GET /api/trips → $STATUS (expected 200)"

  # POST
  POST_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '{"code":"VRFY999999","name":"Verify Test","length":"1 night","start":"2026-01-01","resort":"Test Resort","perPerson":"99","image":"images/reef1.jpg","description":"Verification trip"}' \
    "http://localhost:$PORT/api/trips")
  [[ "$POST_STATUS" == "201" ]] && green "POST /api/trips → 201" || red "POST /api/trips → $POST_STATUS (expected 201)"

  # GET single
  GET1_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/trips/VRFY999999")
  [[ "$GET1_STATUS" == "200" ]] && green "GET /api/trips/VRFY999999 → 200" || red "GET /api/trips/VRFY999999 → $GET1_STATUS (expected 200)"

  # PUT
  PUT_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X PUT \
    -H "Content-Type: application/json" \
    -d '{"code":"VRFY999999","name":"Verify Test Updated","length":"2 nights","start":"2026-01-01","resort":"Test Resort","perPerson":"199","image":"images/reef1.jpg","description":"Updated"}' \
    "http://localhost:$PORT/api/trips/VRFY999999")
  [[ "$PUT_STATUS" == "200" ]] && green "PUT /api/trips/VRFY999999 → 200" || red "PUT /api/trips/VRFY999999 → $PUT_STATUS (expected 200)"

  # DELETE
  DEL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "http://localhost:$PORT/api/trips/VRFY999999")
  [[ "$DEL_STATUS" == "204" || "$DEL_STATUS" == "200" ]] && green "DELETE /api/trips/VRFY999999 → $DEL_STATUS" || red "DELETE /api/trips/VRFY999999 → $DEL_STATUS (expected 204)"

  # 404
  NF_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:$PORT/api/trips/ZZZNOPE")
  [[ "$NF_STATUS" == "404" ]] && green "GET /api/trips/ZZZNOPE → 404 (error handled)" || yellow "GET /api/trips/ZZZNOPE → $NF_STATUS (expected 404)"
else
  yellow "Express server not running on :$PORT — skipping live tests"
  yellow "Start server with: npm start, then re-run this script"
fi

# ── Zip readiness ──────────────────────────────────────────────────────────────
header "Zip Readiness"
[[ -d "$REPO/node_modules" ]]              && green "node_modules present (will exclude from zip)" || yellow "no root node_modules"
[[ -d "$REPO/app_admin/node_modules" ]]    && green "app_admin/node_modules present (will exclude)" || yellow "app_admin/node_modules missing - run: cd app_admin && npm install"
[[ ! -f "$REPO/travlr.zip" ]]              && yellow "travlr.zip not yet created" || green "travlr.zip exists"

# ── Rubric summary ─────────────────────────────────────────────────────────────
header "Rubric Summary"
echo "  Angular structure (30 pts)    → components + service + routes"
echo "  API requests (30 pts)         → TripDataService GET/POST/PUT/DELETE"
echo "  REST methods (20 pts)         → Express controller all 4 verbs"
echo "  Functional testing (10 pts)   → live endpoint results above"
echo "  End user testing (10 pts)     → screenshots: card listing, edit, update"
echo ""
echo "  passed: $PASS   failed: $FAIL   warnings: $WARN"
[[ $FAIL -eq 0 ]] && echo "  ✓ Ready to submit" || echo "  ✗ $FAIL check(s) need attention"
