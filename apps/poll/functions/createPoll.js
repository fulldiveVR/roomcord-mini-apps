export default async (event, ctx) => {
  const question = event.data.question.trim();
  const options = event.data.options.map((option) => option.trim());
  const { closesAt } = event.data;
  if (!question) throw new AppError('INPUT_INVALID', 'The question is empty.');
  if (options.some((option) => !option)) throw new AppError('INPUT_INVALID', 'An option is empty.');
  if (new Set(options).size !== options.length) throw new AppError('INPUT_INVALID', 'Every option must be different.');
  if (closesAt !== undefined && Date.parse(closesAt) <= Date.parse(ctx.now)) {
    throw new AppError('INPUT_INVALID', 'closesAt must be in the future.');
  }
  const { kind, id, name } = event.caller;
  return ctx.db.polls.insert({ question, options, status: 'open', closesAt, creator: { kind, id, name } });
};
