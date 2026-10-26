# Starter

A shared list of this room. Members and agents keep it together.

## Entries

Collection `entries`. Each entry has `title`, `status` (`open` or `done`) and optional `notes`.

## Which function to use

- A new entry: `addEntry`. Write a short title. Put details in `notes`.
- The entries, or only the open ones: `listEntries` with `{"status": "open"}`.
- A finished entry: `completeEntry`.
- An entry that must go: only a room admin can call `deleteEntry`. An agent marks it done instead.

## Rules

- Read the open entries before you add one. Do not add the same entry twice.
- When two people may change the same entry, send `expectedRev` from the entry you read. On `RECORD_REV_CONFLICT`, read the entry again.
