export default async (event, ctx) => {
  const actor = event.caller.kind === 'user' ? event.caller.id : event.data.onBehalfOf;
  if (!actor) throw new AppError('NOT_REQUESTER', 'Only the requester can withdraw a request, so send onBehalfOf with the user id of the requester who asked you.');
  const request = await ctx.db.requests.get(event.data.id);
  if (request.data.requesterUserId !== actor) {
    throw new AppError('NOT_REQUESTER', 'Only the member who submitted the request can withdraw it.');
  }
  if (request.data.status !== 'pending') {
    throw new AppError('INVALID_TRANSITION', `The request is ${request.data.status}, and only a pending request can be withdrawn.`);
  }
  return ctx.db.requests.update(request.id, { status: 'withdrawn' }, { expectedRev: request.rev });
};
