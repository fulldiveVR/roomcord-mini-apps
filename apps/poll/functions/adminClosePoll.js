export default async (event, ctx) => {
  const poll = await ctx.db.polls.get(event.data.id);
  if (poll.data.status !== 'open') throw new AppError('INVALID_TRANSITION', 'The poll is already closed.');
  return ctx.db.polls.update(poll.id, { status: 'closed', closedAt: ctx.now, closedBy: event.caller.id }, { expectedRev: poll.rev });
};
