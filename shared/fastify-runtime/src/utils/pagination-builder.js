function toPositiveInteger(value, fallback = 10) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function buildCursorPagination(input = {}) {
  return {
    type: 'cursor',
    limit: toPositiveInteger(input.limit),
    nextCursor: input.nextCursor ?? input.cursor ?? null,
    hasNextPage: Boolean(input.hasNextPage ?? input.hasMore ?? false),
  };
}

function buildPagePagination(input = {}) {
  const page = toPositiveInteger(input.page, 1);
  const limit = toPositiveInteger(input.limit);
  const total = Number.isFinite(Number(input.total)) ? Number(input.total) : 0;
  const totalPages = Number.isFinite(Number(input.totalPages))
    ? Number(input.totalPages)
    : Math.ceil(total / limit);

  return {
    type: 'page',
    page,
    limit,
    total,
    totalPages,
    hasNextPage: Boolean(input.hasNextPage ?? page < totalPages),
    hasPreviousPage: Boolean(input.hasPreviousPage ?? page > 1),
  };
}

function normalizePagination(input) {
  if (!input || typeof input !== 'object') {
    return undefined;
  }

  if (input.type === 'page' || Object.prototype.hasOwnProperty.call(input, 'page')) {
    return buildPagePagination(input);
  }

  if (
    input.type === 'cursor' ||
    Object.prototype.hasOwnProperty.call(input, 'nextCursor') ||
    Object.prototype.hasOwnProperty.call(input, 'cursor') ||
    Object.prototype.hasOwnProperty.call(input, 'hasMore') ||
    Object.prototype.hasOwnProperty.call(input, 'hasNextPage')
  ) {
    return buildCursorPagination(input);
  }

  return undefined;
}

function extractLegacyPagination(body = {}) {
  if (body.pagination) {
    return normalizePagination(body.pagination);
  }

  if (body.nextCursor || body.cursor || body.hasMore !== undefined || body.hasNextPage !== undefined) {
    return buildCursorPagination({
      limit: body.limit,
      nextCursor: body.nextCursor ?? body.cursor ?? null,
      hasNextPage: body.hasNextPage ?? body.hasMore,
    });
  }

  if (body.page || body.total || body.totalPages) {
    return buildPagePagination(body);
  }

  return undefined;
}

module.exports = {
  buildCursorPagination,
  buildPagePagination,
  extractLegacyPagination,
  normalizePagination,
};
