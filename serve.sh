#!/bin/sh
# One server, one build, and proof that the two are the same.
#
# Twice in this session a probe reported a working game as broken because a stale
# `next start` was still holding port 3000 and serving a build from before the fix. The
# chunk hash in the HTML is the only honest witness: if the page asks for a webpack chunk
# that is not on disk, or an old one that is, nothing measured against it means anything.
cd "$(dirname "$0")" || exit 1
fuser -k 3000/tcp >/dev/null 2>&1
sleep 2
rm -f data/serve.log
(npm run start > data/serve.log 2>&1 &)
i=0
while [ $i -lt 20 ]; do
  sleep 2
  [ "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/life)" = "200" ] && break
  i=$((i + 1))
done
want=$(curl -s http://127.0.0.1:3000/life | grep -o 'webpack-[a-f0-9]*\.js' | head -1)
have=$(ls .next/static/chunks/ | grep '^webpack')
echo "server=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/life) wants=$want disk=$have"
[ "$want" = "$have" ] || { echo "STALE SERVER — the page asks for a chunk this build did not produce"; exit 1; }
