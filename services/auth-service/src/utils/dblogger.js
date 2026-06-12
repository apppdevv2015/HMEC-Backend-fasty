const prisma = require('../database/prisma');

async function logToDB(level, message, meta = {}) {
  try {
    if (
      meta.url &&
      (
        meta.url.toLowerCase().includes('health') ||
        meta.url.toLowerCase().includes('favicon')
      )
    ) {
      return;
    }

    // Normalize duration to an integer (milliseconds) or null
    let durationValue = null;
    if (meta.duration !== undefined && meta.duration !== null) {
      if (typeof meta.duration === 'number' && Number.isFinite(meta.duration)) {
        durationValue = Math.floor(meta.duration);
      } else if (typeof meta.duration === 'string') {
        const msMatch = meta.duration.match(/^\s*(\d+)\s*ms\s*$/i);
        if (msMatch) {
          durationValue = parseInt(msMatch[1], 10);
        } else {
          const parsed = parseInt(meta.duration, 10);
          if (!Number.isNaN(parsed)) durationValue = parsed;
        }
      }
    }

    await prisma.log.create({
      data: {
        level,
        message,

        service: process.env.SERVICE_NAME || 'education-core-service',
        module: meta.module || null,
        action: meta.action || null,

        error: meta.error
          ? meta.error.toString().substring(0, 2000)
          : null,

        requestId: meta.requestId || null,
        userId: meta.userId || null,

        method: meta.method || null,
        url: meta.url || null,
        status: meta.status || null,

        duration: durationValue,

        metadata: meta.email
          ? { email: meta.email }
          : null
      }
    });

  } catch (error) {
    console.error('DB Log Failed:', {
      message,
      level,
      meta,
      error: error.message
    });
  }
}

module.exports = logToDB;
