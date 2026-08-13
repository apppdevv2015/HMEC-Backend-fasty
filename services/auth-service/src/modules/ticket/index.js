const ticketRoutes = require('./routes/ticket.routes');
const ticketService = require('./services/ticket.service');
const ticketController = require('./controllers/ticket.controller');

module.exports = {
  ticketRoutes,
  ticketService,
  ticketController,
};
