export default async (event, ctx) => {
  const { status, requesterUserId, limit, cursor } = event.data;
  const where = {};
  if (status) where.status = status;
  if (requesterUserId) where.requesterUserId = requesterUserId;
  return ctx.db.requests.query({ where, limit: limit || 50, cursor });
};
