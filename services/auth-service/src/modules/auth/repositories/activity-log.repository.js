const prisma = require('../../../database/prisma');

class ActivityLogRepository {
    async log(data) {
        console.log('[ActivityLog]', data);
        return { id: 'mock-id' };
    }

    async getLogs(companyId, isSuperAdmin, page = 1, limit = 20) {
        return {
            logs: [],
            pagination: {
                total: 0,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: 0
            }
        };
    }
}

module.exports = new ActivityLogRepository();
