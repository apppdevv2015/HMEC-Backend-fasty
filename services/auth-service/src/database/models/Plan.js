const prisma = require('../prisma');

class PlanModel {
  async findById(id) {
    return prisma.plan.findUnique({
      where: { id }
    });
  }

  async findByName(name) {
    return prisma.plan.findFirst({
      where: { name }
    });
  }

  async create(data) {
    return prisma.plan.create({
      data
    });
  }

  async update(id, data) {
    return prisma.plan.update({
      where: { id },
      data
    });
  }

  async listAll() {
    return prisma.plan.findMany();
  }
}

module.exports = new PlanModel();
