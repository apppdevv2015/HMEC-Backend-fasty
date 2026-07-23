const ticketController = require('../controllers/ticket.controller');
const authMiddleware = require('../../../middlewares/auth.middleware');

async function ticketRoutes(fastify, options) {
  fastify.addHook('preHandler', authMiddleware);

  fastify.get('/', ticketController.getTickets);
  fastify.get('/:id', ticketController.getTicket);
  fastify.post('/', ticketController.createTicket);
  fastify.post('/:id/messages', ticketController.addMessage);
  fastify.patch('/:id/status', ticketController.updateStatus);
  fastify.patch('/:id/assign', ticketController.assignTicket);
}

module.exports = ticketRoutes;
