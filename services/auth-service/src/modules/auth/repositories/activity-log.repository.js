const db = require('../../../database');

class ActivityLogRepository {
    async log(data) {
        return db('activity_logs').insert({
            user_id: data.userId,
            company_id: data.companyId,
            action: data.action,
            module: data.module,
            details: data.details ? JSON.stringify(data.details) : null
        });
    }

    async getLogs(companyId, isSuperAdmin, page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        let query = db('activity_logs')
            .leftJoin('users', 'activity_logs.user_id', 'users.id')
            .select(
                'activity_logs.*',
                'users.first_name',
                'users.last_name',
                'users.email as user_email'
            );

        if (!isSuperAdmin) {
            query = query.where('activity_logs.company_id', companyId);
        }

        const logs = await query.orderBy('activity_logs.created_at', 'desc').limit(limit).offset(offset);
        const [{ count }] = await db('activity_logs').where(isSuperAdmin ? {} : { company_id: companyId }).count('id as count');

        return {
            logs,
            pagination: {
                total: parseInt(count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        };
    }
}

module.exports = new ActivityLogRepository();
