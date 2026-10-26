# Writing a room app

This guide is for people who write a room app by hand and publish it with the `workcord` CLI.
A room app (`roomapp/1`) is a small app inside one room: collections of records, JS functions
that change them, and a guide for agents. The room stores the data. Members, agents and the
generic app screen of the client use it.

The examples in `apps/` of this repository follow this guide. Each one passes `workcord app test`.

You must be an admin of the room (its creator or a member with the admin role). The server
refuses `$validateApp`, `$saveApp`, `$appSource`, `$approveApp` and `$rejectApp` with
`FORBIDDEN` for a member who is not an admin. Agents can also save drafts, but only an admin
approves one.

## Quickstart

1. Install the CLI: `npm i -g @fulldivevr/workcord-cli`.
2. Log in: `workcord auth login --email you@company.com --save`.
   For another server, log in once with `workcord --base-url <origin> auth login --email you@company.com --save`.
   The login saves the server too.
3. Find the room id: `workcord rooms list`.
4. Write a new app folder: `workcord app init reading-list`.
5. Test it locally: `workcord app test reading-list`.
6. Check it against the room: `workcord app validate reading-list --room <roomId>`.
7. Save it as the pending draft: `workcord app push reading-list --room <roomId>`.
   The result has the `draftId`.
8. See the drafts: `workcord app drafts --room <roomId>`.
9. Approve it: `workcord app approve <draftId> --room <roomId>`. The app is now installed.
10. Use it:
    - `workcord app call reading-list addEntry --room <roomId> --data '{"title":"Dune"}'`
    - `workcord app call reading-list listEntries --room <roomId>`
    - `workcord app describe reading-list --room <roomId>`

Every command prints JSON on stdout. `test` and `validate` exit with 1 and print `ERROR:` lines
on stderr when the package is not valid. Other errors are one JSON line on stderr
(see "Errors").

## Commands

| Command | Does |
|---|---|
| `app init <id> [dir]` | Writes a new app folder from the template (default `./<id>`). The folder must be empty or missing. |
| `app test [dir]` | Runs the `$validateApp` checks and the package tests locally, in an empty room. No server. |
| `app pack [dir]` | Prints the package object that `validate` and `push` send. |
| `app validate [dir] --room <id>` | `$validateApp` in the room. Adds the checks that need the room: version and existing records. |
| `app push [dir] --room <id>` | `$saveApp`: saves the folder as the room's pending draft of that app. |
| `app drafts --room <id>` | `$appDrafts`: pending drafts. |
| `app approve <draftId> --room <id>` | `$approveApp`: runs the checks again, then installs or upgrades. |
| `app reject <draftId> --room <id> [--reason <text>]` | `$rejectApp`: drops a pending draft. |
| `app list --room <id>` | `$apps`: installed apps. |
| `app describe <app> --room <id> [--function <name>]` | `$describe`: guide, collections, functions and display hints. |
| `app call <app> <function> --room <id> [--data <json>]` | Calls a function, or `$query`, `$get`, `$history`. |
| `app source <appId> --room <id> [--app-version <v>] [--out <dir>]` | `$appSource`: the package of a built-in or room app. `--out` writes it as a folder. |

All remote commands send `POST /api/v1/rooms/<roomId>/apps/call` with `{ app, name, data }` and
print the `result` of the answer.

`app test` runs the server's own validator, scenario runner and QuickJS sandbox. The CLI
bundles them, so a local pass means the same checks pass on the server. The local room is empty, so `test` cannot see
`VERSION_NOT_NEWER` or problems with records that already exist. Run `app validate` before you
push an upgrade.

## Package format

A package is a folder:

```
reading-list/
  manifest.json      id, version, name, summary, icon, collections, functions
  GUIDE.md           for agents: what the app is for, which function to use when, rules
  functions/
    addEntry.js      one file per function in the manifest
  tests/
    entries.json     one scenario or a list of scenarios
```

`push` and `validate` send the folder as one package object:

```json
{ "manifest": {}, "functions": { "addEntry": "export default async (event, ctx) => { }" }, "guide": "# …", "tests": [] }
```

- `functions` has one entry for each file in `functions/`. The name is the file name without
  `.js`. Files that start with `.` are not read.
- `tests` is every `tests/*.json` file in name order. A file with a list adds each scenario.
- Every function in the manifest needs a file, and every file needs a manifest entry.

## Manifest

| Field | Rule |
|---|---|
| `schema` | `"roomapp/1"`. |
| `id` | `^[a-z][a-z0-9-]{1,39}$`. Not a built-in id: `board`, `boss`, `ceo`, `dashboard`, `todo` (`APP_ID_RESERVED`). |
| `version` | `x.y.z`. Greater than every version this room approved before, also after an uninstall (`VERSION_NOT_NEWER`). |
| `name` | Texts by language. `name.en` is required: `{ "en": "Reading list" }`. |
| `summary` | One sentence. `$apps` and the approval sheet show it. |
| `icon` | A name. The client shows `checklist` and `insights`. Other names show a generic app icon. |
| `collections` | 1 to 20 collections (see below). |
| `functions` | At most 50 functions (see below). |

A room app may not set `preinstalled`, `presence`, or a `scope` other than `group`. A collection
may not set `history` or `maxRecordBytes`. These are for built-in apps only.

## Collections

```json
"collections": {
  "entries": {
    "schema": { "type": "object", "additionalProperties": false, "required": ["title", "status"],
      "properties": { "title": { "type": "string", "minLength": 1 }, "status": { "enum": ["open", "done"] } } },
    "read": ["members", "agents"],
    "display": { "titleField": "title", "groupBy": "status" }
  }
}
```

- A name matches `^[a-z][a-zA-Z0-9_]{0,39}$`.
- `schema` is a JSON Schema (draft 2020-12, with formats such as `date`, `date-time`, `email`,
  `uri`) of `type: "object"`. Every write is checked against it (`RECORD_INVALID`).
- `read` lists who may read with `$query`, `$get` and `$history`: `members`, `agents`, or both.
  It does not limit functions. A function reads and writes every collection of its app.
- Fields set to `null` or left `undefined` are removed before the record is stored.
- A record is at most 256 KiB as JSON (`RECORD_TOO_LARGE`).
- Every record has `id`, `installId`, `appId`, `collection`, `data`, `rev`, `createdBy`,
  `updatedBy`, `createdAt` and `updatedAt`. `rev` starts at 1 and goes up on every write.
- Every write keeps a version: `$history` returns `{ rev, op, data, actor, at }`, newest first.
  `op` is `created`, `updated` or `deleted`. A delete is soft: the record is gone from reads and
  keeps its history.

### Reading with $query

`app call <app> '$query' --data '{"collection":"entries","where":{"status":"open"}}'`

- `where`: top-level record fields. A value is a scalar or `null` (equal), `{"$in": [scalars]}`
  (at most 100) or `{"$ne": scalar}`. Other operators and unknown fields give `INPUT_INVALID`.
- `sort`: one field, `{"<field>": 1 | -1}`: `updatedAt`, `createdAt` or a record field.
  The default is `{"updatedAt": -1}`.
- `limit`: 1 to 100, default 50. The answer is `{ data, cursor, hasMore }`. Send `cursor` back
  for the next page, with the same sort.

Quote names that start with `$` in the shell (`'$query'`).

## Functions

```json
"addEntry": {
  "description": "Add an open entry. Returns the new record.",
  "callers": ["members", "agents"],
  "input": { "type": "object", "additionalProperties": false, "required": ["title"],
    "properties": { "title": { "type": "string", "minLength": 1, "maxLength": 200 } } },
  "display": { "label": { "en": "Add entry" } }
}
```

- A name matches `^[a-zA-Z][a-zA-Z0-9_]{0,39}$`. Names that start with `$` are built-ins.
- `description` is required. Agents choose functions by it.
- `input` is a JSON Schema of `type: "object"`. The engine checks the input before the function
  runs (`INPUT_INVALID`, with the schema in `details.input`).
- `callers` (see "Callers").

A function file has exactly one `export default` and no other `import` or `export`:

```js
export default async (event, ctx) => {
  const { title, notes } = event.data;
  return ctx.db.entries.insert({ title, notes, status: 'open' });
};
```

| Name | Value |
|---|---|
| `event.data` | The input, after the schema check. |
| `event.caller` | `{ kind: 'user' \| 'agent', id, name }`. The engine sets it. App code never authenticates. |
| `ctx.db.<collection>.get(id)` | The record, or the error `RECORD_NOT_FOUND`. |
| `ctx.db.<collection>.query(spec)` | `{ data, cursor, hasMore }`. `spec` is the `$query` input without `collection`. |
| `ctx.db.<collection>.insert(data)` | The new record. |
| `ctx.db.<collection>.update(id, patch, { expectedRev }?)` | Merges `patch` into `data`. `null` clears a field. With `expectedRev`, a newer record gives `RECORD_REV_CONFLICT`. |
| `ctx.db.<collection>.delete(id)` | `{ id, deleted: true }`. |
| `ctx.room.id` | The room id. |
| `ctx.room.isMember(userId)` | `true` when the user is a member of the room. |
| `ctx.now` | The time of the call, ISO 8601. |
| `AppError(code, message)` | `throw new AppError('INVALID_TRANSITION', 'Already done')`. The caller gets that code and message. |

Every `ctx.db` and `ctx.room.isMember` call returns a promise. Use `await`.
The result is the return value of the function (`undefined` becomes `null`).
Any other thrown error becomes `FUNCTION_FAILED` with its message.

### Sandbox limits

Functions run in a QuickJS WebAssembly sandbox:

- 1 s wall time per call (`FUNCTION_TIMEOUT`), 32 MB memory, 512 KB stack.
- A result of at most 256 KB as JSON.
- No `require`, no `import`, no file system, no network, no timers. `fetch`, `setTimeout` and
  `console` do not exist.
- No calls to other apps and no reads from other rooms. Agents do that work.

## Callers

`callers` lists who may call a function:

| Value | Who |
|---|---|
| `members` | Every member of the room, admins too. |
| `admins` | Room admins only. |
| `agents` | Agents installed in the room. |

Other callers get `CALLER_NOT_ALLOWED`. The function cannot see whether a user is an admin, so
put an admin-only action in its own function with `"callers": ["admins"]`. A user who is not a
member of the room, or an agent that is not installed in it, cannot call any app.

## How agents use an app

Agents in the room call apps with one tool, `call_function`, and the same payload as the CLI:
`{ app, name, data }`. An agent learns an app in three calls:

1. `$apps`: the installed apps, with name, summary and version. Called without `app`.
2. `$describe`: the guide, the collections and every function with its input schema.
   With `{ "function": "<name>" }`, that function only.
3. The function itself.

When an agent names a function that does not exist, the error `FUNCTION_NOT_FOUND` lists in
`details.available` the functions that this caller may call. So write `GUIDE.md` and every
`description` for an agent: what the function is for, when to use it, and what it refuses.

### Acting for a person

A function can only see who called it, not who asked. When an agent acts for a member (votes,
withdraws, accepts), the usual pattern is an `onBehalfOf` input with the member's user id:

```js
const actor = event.caller.kind === 'user' ? event.caller.id : event.data.onBehalfOf;
if (!actor) throw new AppError('NOT_A_MEMBER', 'Send onBehalfOf with the user id of the member who asked you.');
if (event.caller.kind === 'agent' && !(await ctx.room.isMember(actor))) {
  throw new AppError('NOT_A_MEMBER', 'onBehalfOf must be the user id of a room member.');
}
```

A user caller always acts for themself, so the function ignores `onBehalfOf` from users.
The record history still shows the agent as the actor. The `poll` and `approvals` examples use
this pattern.

## Display hints

The client has no native screen for a room app. It shows a generic screen from the schemas.
Hints change the screen, never what the engine accepts. All are optional.

Collection `display`:

| Key | Rule | Default |
|---|---|---|
| `label` | Texts by language. | The collection name. |
| `titleField` | A property of the collection. | The first required string property. |
| `fields` | Properties to show in the list, no duplicates. | All top-level properties in schema order. |
| `groupBy` | An `enum` property. The screen shows one column per value. | None. |
| `kinds` | Property to one of `text`, `longtext`, `number`, `boolean`, `date`, `datetime`, `enum`, `user`, `url`, `json`. | From the schema. |

Function `display`:

| Key | Rule | Default |
|---|---|---|
| `collection` | The collection the function belongs to. | The only collection, else none. |
| `target` | `collection` (a button on the list), `record` (a button on one record) or `hidden`. | `record` when the input requires `id`, else `collection`. |
| `label` | Texts by language. | The function name. |
| `confirm` | `true` asks before the call. | `false`. |

With two or more collections, a function whose target is `record` must name
`display.collection`. The screen fills `id` and `expectedRev` itself and does not show them.
`$describe` returns every hint with the defaults filled in.

## Test scenarios

`tests/` must have at least one scenario. `test`, `validate`, `push` and `approve` run every
scenario on an in-memory store with a fake room. A failure makes the package invalid. All
scenarios together have 10 s.

```json
{
  "name": "an agent adds an entry, a member completes it",
  "room": { "members": ["ann", "bo"], "admins": ["ann"] },
  "steps": [
    { "as": { "kind": "user", "id": "ann" }, "install": "reading-list" },
    { "name": "added", "as": { "kind": "agent", "id": "agent-1", "name": "Helper" },
      "call": { "name": "addEntry", "data": { "title": "Dune" } },
      "expect": { "result": { "rev": 1, "data": { "status": "open" } } } },
    { "as": { "kind": "user", "id": "bo" },
      "call": { "name": "completeEntry", "data": { "id": { "$ref": "added.id" } } },
      "expect": { "result": { "rev": 2, "data": { "status": "done" } } } },
    { "as": { "kind": "user", "id": "bo" }, "call": { "name": "deleteEntry", "data": { "id": { "$ref": "added.id" } } },
      "expect": { "error": "CALLER_NOT_ALLOWED" } }
  ],
  "expectEnd": { "records": { "entries": [{ "data": { "title": "Dune", "status": "done" } }] } }
}
```

- `room`: `members` and `admins` are user ids. Every agent that a step acts as is installed.
- A step is `{ as, call: { app?, name, data? } }`, `{ as, install: "<id>" }` or
  `{ as, uninstall: "<id>" }`, with an optional `name` and `expect`. `call.app` defaults to the
  app under test. Only admins install and uninstall.
- Without an install step the app starts installed. The template starts with an install step,
  which also checks that an admin can install the app.
- `expect`: `result` (partial match), `error` (a code) or `records.<collection>`.
  Objects match by the keys given. Arrays match item by item and must have the same length.
  Records match in any order. `"$any"` is any present value, `"$absent"` a missing value.
- `{ "$ref": "step2.id" }` or `{ "$ref": "<step name>.id" }` is a value from the result of an
  earlier step. Steps count from 1.
- A failure shows the scenario, the step number (`end` for `expectEnd`) and the difference.

## Versions and upgrades

1. Get the live package: `workcord app source reading-list --room <roomId> --out reading-list`.
2. Change it and raise `version` (semver, greater than every approved version in this room).
3. `app validate`, then `app push`, then `app approve`.

On an upgrade the engine checks every live record against the new collection schemas. A record
that does not match, or a removed collection that still has records, makes the package invalid.
The report lists them in `compatibility`. To change a field, keep the old field valid in the
schema, or first add a function that moves the data. An app with more than 20,000 live records
gets `APP_TOO_LARGE_TO_UPGRADE`.

Records keep their ids, `rev` and history across versions. An uninstall keeps the records.
Approving any version of the same app again shows them again.

You can also start from a built-in app: `app source todo --room <roomId> --out my-todo`.
Change `id`, remove `preinstalled`, `scope` and `presence`, and fix the tests that expect
the built-in behaviour (the To-do tests expect `APP_NOT_FOUND` on install).

## Approval

1. An admin or an agent saves a draft (`$saveApp`). The checks run first. A package that is not
   valid gives `APP_INVALID` with the report in `details`.
2. The room has one pending draft per app. A new save replaces it.
3. An admin approves (`$approveApp`) or rejects (`$rejectApp`, reason up to 500 characters).
   Approval runs the checks again, against the records of that moment.
4. The approved app is installed in this room only, and other rooms do not see it. Every
   approved version is kept.

Clients get `room:apps-changed` with `change` `draft`, `approved` or `rejected`. Admins also see
pending drafts in the add-app sheet and can approve there.

## The validation report

```json
{ "ok": false,
  "errors": [{ "path": "/manifest/version", "message": "…", "code": "VERSION_NOT_NEWER" }],
  "tests": { "passed": 0, "failed": [{ "scenario": "…", "step": 3, "message": "…" }] },
  "compatibility": [{ "collection": "entries", "recordId": "…", "message": "…" }] }
```

`path` is a JSON Pointer into the package object (`/manifest/id`, `/functions/addEntry`,
`/tests/0/steps`, `/` for the size limit). `step` is 1-based, or `null` for `expectEnd` and
the time budget. The package object is at most 512 KB as JSON.

## Errors

An error answer is `{ "error": { "code", "message", "retryable", "details"? } }`. The CLI prints
it as `{"error": "POST … -> <status>", "status": <status>, "body": { "error": { … } }}` on stderr.

| Code | HTTP | Meaning |
|---|---|---|
| `INPUT_INVALID` | 400 | The input does not match the schema, or a bad `$query`. |
| `RECORD_INVALID` | 400 | A write does not match the collection schema. |
| `RECORD_TOO_LARGE` | 413 | A record is larger than 256 KiB. |
| `RECORD_NOT_FOUND` | 404 | No record with that id, or it is deleted. |
| `RECORD_REV_CONFLICT` | 409 | `expectedRev` is old. Read again. Retryable. |
| `FUNCTION_NOT_FOUND` | 404 | No such function. `details.available` lists the ones you may call. |
| `CALLER_NOT_ALLOWED` | 403 | The caller is not in `callers` or `read`. |
| `FUNCTION_FAILED` | 422 | The function threw, ran out of memory, or returned too much. |
| `FUNCTION_TIMEOUT` | 422 | The function ran longer than 1 s. |
| `APP_NOT_INSTALLED` | 404 | The app is not installed in the room. |
| `APP_NOT_FOUND` | 400 | Unknown app, or no such version for `$appSource`. |
| `APP_INVALID` | 400 | `$saveApp` or `$approveApp` on a package that is not valid. `details` is the report. |
| `DRAFT_NOT_FOUND` | 404 | The draft was approved, rejected or replaced. |
| `APP_TOO_LARGE_TO_UPGRADE` | 409 | More than 20,000 live records. |
| `FORBIDDEN` | 403 | Not a room admin. |
| `TEMPORARILY_UNAVAILABLE` | 503 | The room could not answer. Retryable. |

A code that a function throws with `AppError` goes to the caller as it is. A known code keeps
its HTTP status. Any other code (such as `INVALID_TRANSITION`) answers 422.
