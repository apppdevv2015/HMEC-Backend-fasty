const { logToDB } = require('./dbErrorLogger');

/**
 * DB Logger Wrapper
 * Used to log database transaction states or log errors directly to the Log table.
 */
async function dbLog(level, message, meta = {}) {
  try {
    // Current database logging is only configured for error events
    return await logToDB(level, message, meta);
  } catch (err) {
    console.error('DB Logger failed:', err);
  }
}

module.exports = {
  dbLog,
};
