export default async (event, ctx) => {
  const poll = await ctx.db.polls.get(event.data.id);
  const { creator } = poll.data;
  if (creator.kind !== event.caller.kind || creator.id !== event.caller.id) {
    throw new AppError('NOT_CREATOR', 'Only the creator of the poll can close it, so ask the creator or a room admin.');
  }
  if (poll.data.status !== 'open') throw new AppError('INVALID_TRANSITION', 'The poll is already closed.');
  return ctx.db.polls.update(poll.id, { status: 'closed', closedAt: ctx.now, closedBy: event.caller.id }, { expectedRev: poll.rev });
};
