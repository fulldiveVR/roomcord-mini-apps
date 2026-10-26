export default async (event, ctx) => {
  const request = await ctx.db.requests.get(event.data.id);
  if (request.data.status !== 'pending') {
    throw new AppError('INVALID_TRANSITION', `The request is ${request.data.status}, and only a pending request can be approved.`);
  }
  if (request.data.requesterUserId === event.caller.id) {
    throw new AppError('SELF_APPROVAL', 'You cannot approve your own request, so ask another room admin.');
  }
  return ctx.db.requests.update(
    request.id,
    { status: 'approved', decidedBy: event.caller.id, decidedAt: ctx.now, reason: event.data.reason },
    { expectedRev: request.rev },
  );
};
