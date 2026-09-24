#!/usr/bin/env bash
# בדיקת המסד על Postgres מקומי — לא צעד של מאור, זה הכלי של מי שכותב מיגרציה.
#
# מקים מסד ריק עם auth ו-storage מדומים ועם הטבלאות של DUBID לצידו (supabase/tests/00),
# מריץ את כל supabase/migrations פעמיים ברצף, ואז את בדיקות התקיפה והזרימה (10, 20).
# נכשל על כל שגיאה ועל כל שורת FAIL.
#
#   PGHOST=/tmp PGPORT=5499 PGUSER=postgres scripts/db/verify.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
DB=${WORKER_TEST_DB:-worker_verify}
psql -qc "drop database if exists $DB" -c "create database $DB" >/dev/null
psql -d "$DB" -v ON_ERROR_STOP=1 -q -f supabase/tests/00-supabase-stub.sql >/dev/null 2>&1
for round in 1 2; do
  for file in supabase/migrations/*.sql; do
    psql -d "$DB" -v ON_ERROR_STOP=1 -qAt -f "$file" >/dev/null 2>/tmp/verify-err.txt || { cat /tmp/verify-err.txt; exit 1; }
  done
done
psql -d "$DB" -v ON_ERROR_STOP=1 -q -f supabase/tests/10-portal.sql >/dev/null 2>/tmp/verify-err.txt || { cat /tmp/verify-err.txt; exit 1; }
out=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f supabase/tests/20-collector.sql 2>&1) || { echo "$out" | grep -E "FAIL|ERROR"; exit 1; }
echo "$out" | grep -c PASS | xargs -I{} echo "db verify: migrations twice, portal smoke, {} collector assertions — clean"
bc=$(psql -d "$DB" -v ON_ERROR_STOP=1 -f supabase/tests/30-blind-cow.sql 2>&1) || { echo "$bc" | grep -E "FAIL|ERROR"; exit 1; }
echo "$bc" | grep -c PASS | xargs -I{} echo "db verify: {} blind-cow (gate 10 duel) assertions — clean"
