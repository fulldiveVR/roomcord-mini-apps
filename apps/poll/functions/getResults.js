export default async (event, ctx) => {
  const poll = await ctx.db.polls.get(event.data.id);
  const counts = Object.fromEntries(poll.data.options.map((option) => [option, 0]));
  let myVote = null;
  let cursor;
  do {
    const page = await ctx.db.votes.query({ where: { pollId: poll.id }, sort: { createdAt: 1 }, limit: 100, cursor });
    for (const vote of page.data) {
      if (vote.data.option in counts) counts[vote.data.option] += 1;
      if (event.caller.kind === 'user' && vote.data.userId === event.caller.id) myVote = vote.data.option;
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  const expired = Boolean(poll.data.closesAt) && Date.parse(poll.data.closesAt) <= Date.parse(ctx.now);
  return {
    id: poll.id,
    question: poll.data.question,
    closed: poll.data.status === 'closed' || expired,
    closesAt: poll.data.closesAt ?? null,
    results: poll.data.options.map((option) => ({ option, votes: counts[option] })),
    totalVotes: Object.values(counts).reduce((sum, n) => sum + n, 0),
    myVote,
  };
};
