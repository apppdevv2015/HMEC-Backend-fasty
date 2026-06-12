const prisma = require('../prismaClient');

class MaintenanceLogModel {
  async findById(id) {
    return prisma.maintenanceLog.findUnique({
      where: { id },
      include: { machine: true, component: true }
    });
  }

  async create(data) {
    return prisma.maintenanceLog.create({
      data
    });
  }

  async update(id, data) {
    return prisma.maintenanceLog.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.maintenanceLog.delete({
      where: { id }
    });
  }

  async findMany(options = {}) {
    return prisma.maintenanceLog.findMany(options);
  }
}

module.exports = new MaintenanceLogModel();
