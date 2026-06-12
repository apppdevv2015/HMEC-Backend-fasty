const logger = require('../utils/logger');

const queue = [];
let active = 0;

const maxConcurrency = Number(process.env.BACKGROUND_JOB_CONCURRENCY || 5);
const maxQueueSize = Number(process.env.BACKGROUND_JOB_MAX_QUEUE_SIZE || 1000);

function runNext() {
  if (active >= maxConcurrency || queue.length === 0) {
    return;
  }

  const job = queue.shift();
  active += 1;

  setImmediate(async () => {
    try {
      await job.task();
      logger.info('Background job completed', {
        module: 'background_queue',
        action: job.name,
        ...job.meta,
      });
    } catch (error) {
      logger.error('Background job failed', {
        module: 'background_queue',
        action: job.name,
        error: error.message,
        ...job.meta,
      });
    } finally {
      active -= 1;
      runNext();
    }
  });
}

function enqueue(name, task, meta = {}) {
  if (queue.length >= maxQueueSize) {
    logger.warn('Background job queue is full', {
      module: 'background_queue',
      action: name,
      ...meta,
    });
    return false;
  }

  queue.push({ name, task, meta });
  runNext();
  return true;
}

module.exports = {
  enqueue,
};
