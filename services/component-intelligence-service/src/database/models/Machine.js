const prisma = require('../prismaClient');

class MachineModel {
  async findById(id) {
    return prisma.machine.findUnique({
      where: { id },
      include: { components: true }
    });
  }

  async findBySerialNumber(serialNumber) {
    return prisma.machine.findUnique({
      where: { serialNumber },
      include: { components: true }
    });
  }

  async create(data) {
    return prisma.machine.create({
      data
    });
  }

  async update(id, data) {
    return prisma.machine.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.machine.delete({
      where: { id }
    });
  }

  async findMany(options = {}) {
    return prisma.machine.findMany(options);
  }
}

module.exports = new MachineModel();
