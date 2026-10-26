export default async (event, ctx) => {
  const { status, limit } = event.data;
  const page = await ctx.db.entries.query({ where: status ? { status } : {}, limit: limit || 50 });
  return { data: page.data, hasMore: page.hasMore };
};
