const winston = require('winston');
const logToDB = require('./dblogger');

const baseLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console()
  ]
});

const dbLoggingEnabled = String(process.env.ENABLE_DB_LOGGING || 'false').toLowerCase() === 'true';

function writeDbLog(level, message, meta) {
  if (!dbLoggingEnabled) {
    return;
  }

  setImmediate(() => {
    logToDB(level, message, meta).catch((error) => {
      baseLogger.warn('DB log skipped', { error: error.message });
    });
  });
}

const logger = {
  info: (message, meta = {}) => {
    baseLogger.info(message, meta);
    writeDbLog('info', message, meta);
  },

  error: (message, meta = {}) => {
    baseLogger.error(message, meta);
    writeDbLog('error', message, meta);
  },

  warn: (message, meta = {}) => {
    baseLogger.warn(message, meta);
    writeDbLog('warn', message, meta);
  }
};

module.exports = logger;
