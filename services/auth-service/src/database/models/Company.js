const prisma = require('../prisma');

class CompanyModel {
  async findById(id) {
    return prisma.company.findUnique({
      where: { id }
    });
  }

  async findByName(name) {
    return prisma.company.findUnique({
      where: { name }
    });
  }

  async findByCode(companyCode) {
    return prisma.company.findUnique({
      where: { companyCode }
    });
  }

  async create(data) {
    return prisma.company.create({
      data
    });
  }

  async update(id, data) {
    return prisma.company.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.company.delete({
      where: { id }
    });
  }

  async findMany(options = {}) {
    return prisma.company.findMany(options);
  }
}

module.exports = new CompanyModel();
