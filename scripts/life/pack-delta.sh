#!/bin/sh
# Build the two delta ZIPs from `git status` — everything changed or new since origin/main,
# code in one archive and `public/life/art` in the other. Build output, caches, logs and
# regenerable boards stay out.
#
#   sh scripts/life/pack-delta.sh 16        → /tmp/the-worker-delta-16-code.zip, -art.zip
set -e
N="${1:?delta number}"
cd "$(dirname "$0")/../.." || exit 1
OUT=/tmp
rm -f "$OUT/the-worker-delta-$N-code.zip" "$OUT/the-worker-delta-$N-art.zip"
git status --short --untracked-files=all \
  | awk '{print $2}' \
  | grep -v -E '^(\.next/|node_modules/|data/|docs/life-shots/|.*\.tsbuildinfo$|.*__pycache__.*|scripts/life/\.scene-dump\.ts$|tsconfig\.all\.tsbuildinfo$)' \
  > /tmp/delta-files.txt
grep -v '^public/life/art/' /tmp/delta-files.txt > /tmp/delta-code.txt
grep '^public/life/art/' /tmp/delta-files.txt > /tmp/delta-art.txt || true
# only files that exist (deletions cannot travel through the web uploader anyway)
while read -r f; do [ -f "$f" ] && echo "$f"; done < /tmp/delta-code.txt > /tmp/delta-code-ok.txt
while read -r f; do [ -f "$f" ] && echo "$f"; done < /tmp/delta-art.txt > /tmp/delta-art-ok.txt
# GitHub's web uploader takes at most 100 files per drop, so every archive is split into
# parts of 100 — code-1, code-2, art-1, art-2 … — and Maor uploads them one after another.
rm -f "$OUT"/the-worker-delta-"$N"-*.zip
pack() {
  kind="$1"; list="$2"; n=0; part=1
  [ -s "$list" ] || return 0
  split -l 100 -d -a 1 "$list" /tmp/delta-part-
  for chunk in /tmp/delta-part-*; do
    zip -q "$OUT/the-worker-delta-$N-$kind-$part.zip" -@ < "$chunk"
    echo "$kind-$part: $(wc -l < "$chunk") files, $(du -h "$OUT/the-worker-delta-$N-$kind-$part.zip" | cut -f1)"
    part=$((part + 1)); rm -f "$chunk"
  done
}
pack code /tmp/delta-code-ok.txt
pack art /tmp/delta-art-ok.txt
# dotfiles never survive the GitHub web uploader — say so if any are in the list
grep -E '(^|/)\.[^/]+$' /tmp/delta-code-ok.txt && echo "WARNING: dotfiles above will be dropped by the web uploader" || true
