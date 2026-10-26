export default async (event, ctx) => {
  const reason = event.data.reason.trim();
  if (!reason) throw new AppError('INPUT_INVALID', 'A rejection needs a reason.');
  const request = await ctx.db.requests.get(event.data.id);
  if (request.data.status !== 'pending') {
    throw new AppError('INVALID_TRANSITION', `The request is ${request.data.status}, and only a pending request can be rejected.`);
  }
  return ctx.db.requests.update(
    request.id,
    { status: 'rejected', decidedBy: event.caller.id, decidedAt: ctx.now, reason },
    { expectedRev: request.rev },
  );
};
