const prisma = require('../prisma');

class UserModel {
  async findById(id) {
    return prisma.user.findUnique({
      where: { id },
      include: { role: true, company: true }
    });
  }

  async findByEmail(email) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true, company: true }
    });
  }

  async create(data) {
    return prisma.user.create({
      data
    });
  }

  async update(id, data) {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.user.delete({
      where: { id }
    });
  }

  async count(where = {}) {
    return prisma.user.count({ where });
  }

  async findMany(options = {}) {
    return prisma.user.findMany(options);
  }
}

module.exports = new UserModel();
