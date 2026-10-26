# Roomcord mini-apps

Example mini-apps ("room apps") for Roomcord, and the guide to write your own.

A mini-app lives inside one room:

- The room is the data store. An app defines collections of records, and the room keeps them,
  with a version history of every change.
- Functions are small JavaScript files. They run in a sandbox on the server, with no network
  and no file system. A function is the only way to change data.
- Members and agents of the room call the functions. The server decides who the caller is and
  checks the `callers` rule of each function before the code runs.
- `GUIDE.md` tells the agents of the room what the app is for and which function to use when.

An app is a folder of JSON and JS files. There is no build step.

## Install the CLI

```sh
npm i -g @fulldivevr/workcord-cli
workcord auth login --email you@company.com --save
```

For another server, log in once with `workcord --base-url <origin> auth login --email you@company.com --save`.

Find the id of your room with `workcord rooms list`.

## Quickstart

You must be an admin of the room (its creator or a member with the admin role) to push and approve an app.

```sh
workcord app init reading-list                       # write a new app folder from the template
workcord app test reading-list                       # run the checks and the tests locally, no server
workcord app push reading-list --room <roomId>       # save it as the pending draft; prints the draftId
workcord app approve <draftId> --room <roomId>       # install it in the room
workcord app call reading-list addEntry --room <roomId> --data '{"title":"Dune"}'
workcord app call reading-list listEntries --room <roomId>
```

`workcord app validate <dir> --room <roomId>` adds the checks that need the room, such as the
version and the existing records. Run it before you push an upgrade.

## Examples

| Folder | Shows |
|---|---|
| [`apps/starter`](apps/starter) | The output of `workcord app init starter`: one collection, member and agent functions, an admin-only delete. |
| [`apps/poll`](apps/poll) | Two collections, one vote per member that a member can change, an optional close time, close by the creator or an admin, results. Agents vote for a member with `onBehalfOf`. |
| [`apps/approvals`](apps/approvals) | Expense requests: members submit and withdraw their own, admins approve or reject with a reason, list by status. Admin-only functions and a no-self-approval rule. |

Each app has `manifest.json`, `GUIDE.md`, one file per function in `functions/`, and test
scenarios in `tests/`.

Run the tests of every app:

```sh
scripts/test-all.sh
```

## Guide

The full author guide is [`docs/guide.md`](docs/guide.md): the package format, the manifest,
collections and `$query`, the function runtime and its limits, callers, display hints, test
scenarios, upgrades, approval and error codes.

## License

MIT. See [`LICENSE`](LICENSE).
