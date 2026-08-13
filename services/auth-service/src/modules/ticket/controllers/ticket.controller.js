const ticketService = require('../services/ticket.service');
const responseHandler = require('../../../utils/responseHandler');
const { HTTP_STATUS } = responseHandler;

class TicketController {
  async getTickets(req, res) {
    try {
      const user = req.user || {};
      const { status, priority, search, page, limit } = req.query;

      const result = await ticketService.getTickets({
        userId: user.id,
        userRole: user.role,
        companyId: user.companyId || user.company_id,
        status,
        priority,
        search,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 50,
      });

      return responseHandler(res, HTTP_STATUS.OK, 'Tickets fetched successfully', result);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  }

  async getTicket(req, res) {
    try {
      const user = req.user || {};
      const ticket = await ticketService.getTicketById(req.params.id, {
        userId: user.id,
        userRole: user.role,
        companyId: user.companyId || user.company_id,
      });

      if (!ticket) return res.status(404).send({ error: 'Ticket not found' });
      return responseHandler(res, HTTP_STATUS.OK, 'Ticket fetched successfully', ticket);
    } catch (error) {
      return res.status(403).send({ error: error.message });
    }
  }

  async createTicket(req, res) {
    try {
      const user = req.user || {};
      const companyId = req.body.companyId || user.companyId || user.company_id;

      if (!companyId) {
        return res.status(400).send({ error: 'Company ID is required to create a ticket' });
      }

      const ticket = await ticketService.createTicket({
        subject: req.body.subject,
        description: req.body.description,
        category: req.body.category || 'General',
        priority: req.body.priority || 'Medium',
        companyId,
        userId: user.id,
      });

      return responseHandler(res, HTTP_STATUS.CREATED, 'Ticket created successfully', ticket);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  }

  async addMessage(req, res) {
    try {
      const user = req.user || {};
      const message = await ticketService.addMessage(req.params.id, {
        message: req.body.message,
        userId: user.id,
      });

      return responseHandler(res, HTTP_STATUS.CREATED, 'Message added successfully', message);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  }

  async updateStatus(req, res) {
    try {
      const ticket = await ticketService.updateStatus(req.params.id, {
        status: req.body.status,
      });

      return responseHandler(res, HTTP_STATUS.OK, 'Ticket status updated successfully', ticket);
    } catch (error) {
      return res.status(400).send({ error: error.message });
    }
  }

  async assignTicket(req, res) {
    try {
      const user = req.user || {};
      const assignedToId = req.body.assignedToId || user.id;

      const ticket = await ticketService.assignTicket(req.params.id, {
        assignedToId,
      });

      return responseHandler(res, HTTP_STATUS.OK, 'Ticket assigned successfully', ticket);
    } catch (error) {
      return res.status(500).send({ error: error.message });
    }
  }
}

module.exports = new TicketController();
