const prisma = require('../prisma');

class RoleModel {
  async findById(id) {
    return prisma.role.findUnique({
      where: { id }
    });
  }

  async findByName(name) {
    return prisma.role.findUnique({
      where: { name }
    });
  }

  async create(data) {
    return prisma.role.create({
      data
    });
  }

  async listAll() {
    return prisma.role.findMany();
  }
}

module.exports = new RoleModel();
