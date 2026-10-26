# Approvals

Expense and approval requests of this room. A member submits a request. A room admin approves or rejects it.

## Requests

Collection `requests`. Each request has `amount` (at most two decimals), `currency` (ISO 4217, such as `EUR`),
`description`, `requesterUserId` and `status`:

- `pending`: waiting for an admin. Only a pending request changes.
- `approved` or `rejected`: an admin decided. `decidedBy`, `decidedAt` and `reason` say who, when and why.
- `withdrawn`: the requester took it back.

## Which function to use

- A member asks for money or approval: `submitRequest` with `amount`, `currency` and a short `description`.
  You are an agent, so send `onBehalfOf` with the user id of that member.
- The requester changed their mind: `withdrawRequest`. Send `onBehalfOf` with the requester's user id.
  Do it only when the requester asked you.
- Pending requests, or the requests of one member: `listRequests` with `status` or `requesterUserId`.
  When `hasMore` is true, send `cursor` back for the next page.
- Who changed a request and when: `$history {"collection": "requests", "id": "<request id>"}`.

## Admins only

`approveRequest` and `rejectRequest` are for room admins. Agents cannot call them, and you must not
try to decide for an admin. Tell the admins that a request waits, with its amount, currency and description.
A rejection always has a reason. An admin cannot approve their own request. Another admin does that.

## Rules

- Read the pending requests of the member before you submit. Do not submit the same request twice.
- Write the amount as a number and the currency as a code: "120 euros" is `{"amount": 120, "currency": "EUR"}`.
- Never submit or withdraw for a member who did not ask you to.

## Errors

`NOT_A_MEMBER` (no `onBehalfOf`, or not a room member), `NOT_REQUESTER`, `SELF_APPROVAL`,
`INVALID_TRANSITION` (the request is not pending), and the engine codes such as `INPUT_INVALID`,
`RECORD_NOT_FOUND` and `CALLER_NOT_ALLOWED`.
