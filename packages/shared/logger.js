const winston = require('winston');
const path = require('path');

/**
 * HME Intelligence System - Shared Professional Logger (Winston)
 * Handles daily log rotation, console output, and consistent formatting.
 */

const createLogger = (serviceName) => {
    const d = new Date();
    const dateStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    
    // Industrial Standard: Use absolute path for logs to ensure Docker volume mapping works
    const logDir = '/app/logs';

    // Ensure directory exists
    const fs = require('fs');
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
            winston.format.errors({ stack: true }),
            winston.format.splat(),
            winston.format.json()
        ),
        defaultMeta: { service: serviceName },
        transports: [
            // Write all logs with importance level of `error` or less to `error-DD-MM-YYYY.log`
            new winston.transports.File({ 
                filename: path.join(logDir, `error-${dateStr}.log`), 
                level: 'error' 
            }),
            // Write all logs with importance level of `info` or less to `log-DD-MM-YYYY.log`
            new winston.transports.File({ 
                filename: path.join(logDir, `log-${dateStr}.log`) 
            }),
            // Also log to console with pretty formatting
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
