export default async (event, ctx) => {
  const { title, notes } = event.data;
  return ctx.db.entries.insert({ title: title.trim(), notes, status: 'open' });
};
