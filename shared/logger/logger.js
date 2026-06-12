const winston = require('winston');
const path = require('path');
const fs = require('fs');

/**
 * HME Intelligence System - Shared Winston Logger
 * Handles daily log rotation, console output, and consistent formatting.
 */
const createLogger = (serviceName) => {
  const d = new Date();
  const dateStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
  
  // Use environment variable or default to Docker volume mapping path
  const logDir = process.env.LOG_DIR || '/app/logs';

  // Ensure directory exists
  if (!fs.existsSync(logDir)) {
    try {
      fs.mkdirSync(logDir, { recursive: true });
    } catch (err) {
      console.error(`Failed to create log directory: ${logDir}`, err);
    }
  }

  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: serviceName },
    transports: [
      // Write error logs to error-DD-MM-YYYY.log
      new winston.transports.File({ 
        filename: path.join(logDir, `error-${dateStr}.log`), 
        level: 'error' 
      }),
      // Write general logs to log-DD-MM-YYYY.log
      new winston.transports.File({ 
        filename: path.join(logDir, `log-${dateStr}.log`) 
      }),
      // Console logging with colors
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, service }) => {
            return `[${timestamp}] [${service}] [${level}]: ${message}`;
          })
        )
      })
    ]
  });

  logger.on('error', (err) => {
    console.error('Winston Logger Error:', err);
  });

  return logger;
};

module.exports = createLogger;
