export default async (event, ctx) => {
  const { amount, currency, onBehalfOf } = event.data;
  const description = event.data.description.trim();
  const requesterUserId = event.caller.kind === 'user' ? event.caller.id : onBehalfOf;
  if (!requesterUserId) throw new AppError('NOT_A_MEMBER', 'Only members submit requests, so send onBehalfOf with the user id of the member who asked you.');
  if (event.caller.kind === 'agent' && !(await ctx.room.isMember(requesterUserId))) {
    throw new AppError('NOT_A_MEMBER', 'onBehalfOf must be the user id of a room member.');
  }
  if (Math.abs(Math.round(amount * 100) - amount * 100) > 1e-6) {
    throw new AppError('INPUT_INVALID', 'amount has more than two decimals.');
  }
  if (!description) throw new AppError('INPUT_INVALID', 'The description is empty.');
  return ctx.db.requests.insert({ amount, currency, description, status: 'pending', requesterUserId });
};
