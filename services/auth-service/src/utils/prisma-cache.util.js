function cacheStrategy(strategy) {
  const isAccelerate = process.env.DATABASE_URL?.startsWith("prisma://");

  return isAccelerate
    ? {
        cacheStrategy: strategy,
      }
    : {};
}

module.exports = {
  cacheStrategy,
};
