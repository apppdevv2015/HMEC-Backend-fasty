const prisma = require('../prismaClient');

class RecommendationModel {
  async findById(id) {
    return prisma.recommendation.findUnique({
      where: { id },
      include: { machine: true, component: true }
    });
  }

  async create(data) {
    return prisma.recommendation.create({
      data
    });
  }

  async update(id, data) {
    return prisma.recommendation.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.recommendation.delete({
      where: { id }
    });
  }

  async findMany(options = {}) {
    return prisma.recommendation.findMany(options);
  }
}

module.exports = new RecommendationModel();
