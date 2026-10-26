export default async (event, ctx) => {
  return ctx.db.entries.delete(event.data.id);
};
