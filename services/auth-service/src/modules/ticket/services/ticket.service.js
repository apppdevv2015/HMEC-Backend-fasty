const prisma = require('../../../database/prisma');

class TicketService {
  async getTickets({ userId, userRole, companyId, status, priority, search, page = 1, limit = 50 }) {
    const where = {};

    // Role-based visibility filtering
    // 1. Super Admin & Technical Support -> See ALL tickets across all companies
    if (userRole === 'super_admin' || userRole === 'superadmin' || userRole === 'technical_support') {
      // No companyId or createdById restriction
    }
    // 2. Company Admin -> See ALL tickets belonging to their company
    else if (userRole === 'admin' || userRole === 'company_admin') {
      if (companyId) where.companyId = companyId;
    }
    // 3. Engineer / Supervisor / Artisan / Operator -> See ONLY tickets created by themselves
    else {
      where.createdById = userId;
    }

    // Additional status/search filters
    if (status && status !== 'all') {
      where.status = status;
    }
    if (priority && priority !== 'all') {
      where.priority = priority;
    }
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: 'insensitive' } },
        { subject: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ];
    }

    const total = await prisma.ticket.count({ where });
    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, companyCode: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      tickets,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit) || 1,
      }
    };
  }

  async getTicketById(id, { userId, userRole, companyId }) {
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        company: { select: { id: true, name: true, companyCode: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: { select: { id: true, firstName: true, lastName: true, email: true } }
          }
        }
      }
    });

    if (!ticket) return null;

    // Check visibility permissions
    if (userRole === 'super_admin' || userRole === 'technical_support') {
      return ticket;
    }
    if ((userRole === 'admin' || userRole === 'company_admin') && ticket.companyId === companyId) {
      return ticket;
    }
    if (ticket.createdById === userId) {
      return ticket;
    }

    throw new Error('Access denied to this ticket.');
  }

  async createTicket({ subject, description, category = 'General', priority = 'Medium', companyId, userId }) {
    const ticketCount = await prisma.ticket.count();
    const ticketNumber = `TICK-${1000 + ticketCount + 1}`;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        subject,
        description,
        category,
        priority,
        status: 'Open',
        companyId,
        createdById: userId,
        messages: {
          create: [
            {
              senderId: userId,
              message: description,
            }
          ]
        }
      },
      include: {
        company: true,
        createdBy: true,
        messages: true,
      }
    });

    return ticket;
  }

  async addMessage(ticketId, { message, userId }) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');

    const msg = await prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        message,
      },
      include: {
        sender: { select: { id: true, firstName: true, lastName: true, email: true } }
      }
    });

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    });

    return msg;
  }

  async updateStatus(ticketId, { status }) {
    const validStatuses = ['Open', 'Assigned', 'In Progress', 'Waiting for Customer', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid ticket status: ${status}`);
    }

    return await prisma.ticket.update({
      where: { id: ticketId },
      data: { status, updatedAt: new Date() }
    });
  }

  async assignTicket(ticketId, { assignedToId }) {
    return await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedToId,
        status: 'Assigned',
        updatedAt: new Date(),
      }
    });
  }
}

module.exports = new TicketService();
