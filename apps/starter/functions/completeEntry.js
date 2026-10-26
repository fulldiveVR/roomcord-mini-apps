export default async (event, ctx) => {
  const { id, expectedRev } = event.data;
  const entry = await ctx.db.entries.get(id);
  if (entry.data.status === 'done') throw new AppError('INVALID_TRANSITION', 'The entry is already done');
  return ctx.db.entries.update(id, { status: 'done' }, { expectedRev });
};
