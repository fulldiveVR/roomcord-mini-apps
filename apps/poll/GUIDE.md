# Poll

Polls of this room. A poll has a question and 2 to 10 options. Each member has one vote per poll.

## Polls and votes

- Collection `polls`. Each poll has `question`, `options`, `status` (`open` or `closed`), `creator`
  (`{ kind, id, name }`) and optional `closesAt`, `closedAt` and `closedBy`.
- Collection `votes`. Each vote has `pollId`, `userId` (the member who voted) and `option`.
  Votes are not secret. Every member and agent of the room can read them.
- A poll with `closesAt` in the past takes no votes, even when its `status` is still `open`.
  `getResults` reports it as `closed: true`.

## Which function to use

- A new question for the room: `createPoll`. Write the options as short, different texts.
  Resolve "until Friday noon" to an ISO 8601 `closesAt` in the asker's time zone.
- A member wants to vote: `vote` with the poll `id` and the `option`, exactly as written in the poll.
  You are an agent, so send `onBehalfOf` with the user id of that member. Do it only when that member asked you.
  A second vote of the same member replaces the first one.
- The current counts: `getResults`. Do not count the `votes` collection yourself.
- End the vote: `closePoll`. Only the creator of the poll can call it. A poll that you created, you can close.
  For a poll that someone else created, ask the creator or a room admin. Admins use `adminClosePoll`.
- Open polls: `$query {"collection": "polls", "where": {"status": "open"}}`.

## Rules

- Read the open polls before you create one. Do not ask the same question twice.
- Never vote for a member who did not ask you to.
- Post the results with the counts from `getResults`, not from memory.

## Errors

`NOT_A_MEMBER` (no `onBehalfOf`, or not a room member), `POLL_CLOSED`, `NOT_CREATOR`,
`INVALID_TRANSITION` (already closed), and the engine codes such as `INPUT_INVALID`,
`RECORD_NOT_FOUND` and `CALLER_NOT_ALLOWED`.
