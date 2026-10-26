#!/bin/sh
# Runs `workcord app test` for every folder in apps/. Prints only failures.
# WORKCORD overrides the command, for example WORKCORD="node path/to/cli.js".
cd "$(dirname "$0")/.." || exit 1
WORKCORD=${WORKCORD:-workcord}
status=0
for dir in apps/*/; do
  dir=${dir%/}
  if ! out=$($WORKCORD app test "$dir" 2>&1); then
    echo "FAIL: $dir"
    echo "$out" | grep '^ERROR:' || echo "$out"
    status=1
  fi
done
exit $status
