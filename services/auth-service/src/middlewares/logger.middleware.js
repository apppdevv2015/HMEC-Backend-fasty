const logger = require('../utils/logger');

function loggerMiddleware(req, res, next) {
  const url = req.originalUrl || req.url || req.raw?.url || '';

  if (url.toLowerCase().includes('health')) {
    return next();
  }

  const startTime = Date.now();

  logger.info('Incoming Request', {
    requestId: req.requestId || req.id || req.raw?.id || null,
    method: req.method || req.raw?.method,
    url: url,
    action: 'incoming_request' 
  });

  const resObj = res.raw || res;
  if (typeof resObj.on === 'function') {
    resObj.on('finish', () => {
      const duration = Date.now() - startTime;

      logger.info('Response Sent', {
        requestId: req.requestId || req.id || req.raw?.id || null,
        method: req.method || req.raw?.method,
        url: url,
        status: res.statusCode || resObj.statusCode,
        duration, 
        userId: req.user?.id || null,
        action: 'response_sent'
      });
    });
  }

  next();
}

module.exports = loggerMiddleware;
