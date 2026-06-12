const prisma = require('../prismaClient');

class ComponentModel {
  async findById(id) {
    return prisma.component.findUnique({
      where: { id },
      include: { machine: true, componentCosts: true, recommendations: true, failurePredictions: true }
    });
  }

  async findBySerialNumber(serialNumber) {
    return prisma.component.findUnique({
      where: { serialNumber },
      include: { machine: true }
    });
  }

  async create(data) {
    return prisma.component.create({
      data
    });
  }

  async update(id, data) {
    return prisma.component.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.component.delete({
      where: { id }
    });
  }

  async findMany(options = {}) {
    return prisma.component.findMany(options);
  }
}

module.exports = new ComponentModel();
