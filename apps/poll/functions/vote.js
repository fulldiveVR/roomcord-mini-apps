export default async (event, ctx) => {
  const { id, option, onBehalfOf } = event.data;
  const userId = event.caller.kind === 'user' ? event.caller.id : onBehalfOf;
  if (!userId) throw new AppError('NOT_A_MEMBER', 'Only members vote, so send onBehalfOf with the user id of the member who asked you.');
  if (event.caller.kind === 'agent' && !(await ctx.room.isMember(userId))) {
    throw new AppError('NOT_A_MEMBER', 'onBehalfOf must be the user id of a room member.');
  }
  const poll = await ctx.db.polls.get(id);
  if (poll.data.status !== 'open') throw new AppError('POLL_CLOSED', 'The poll is closed.');
  if (poll.data.closesAt && Date.parse(poll.data.closesAt) <= Date.parse(ctx.now)) {
    throw new AppError('POLL_CLOSED', 'The poll closed at its close time.');
  }
  if (!poll.data.options.includes(option)) {
    throw new AppError('INPUT_INVALID', `option must be one of: ${poll.data.options.join(', ')}.`);
  }
  const existing = await ctx.db.votes.query({ where: { pollId: id, userId }, limit: 1 });
  if (existing.data.length) {
    const previous = existing.data[0];
    if (previous.data.option === option) return previous;
    return ctx.db.votes.update(previous.id, { option }, { expectedRev: previous.rev });
  }
  return ctx.db.votes.insert({ pollId: id, userId, option });
};
