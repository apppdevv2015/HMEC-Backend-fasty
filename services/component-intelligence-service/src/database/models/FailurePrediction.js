const prisma = require('../prismaClient');

class FailurePredictionModel {
  async findById(id) {
    return prisma.failurePrediction.findUnique({
      where: { id },
      include: { component: true }
    });
  }

  async create(data) {
    return prisma.failurePrediction.create({
      data
    });
  }

  async update(id, data) {
    return prisma.failurePrediction.update({
      where: { id },
      data
    });
  }

  async delete(id) {
    return prisma.failurePrediction.delete({
      where: { id }
    });
  }

  async findMany(options = {}) {
    return prisma.failurePrediction.findMany(options);
  }
}

module.exports = new FailurePredictionModel();
