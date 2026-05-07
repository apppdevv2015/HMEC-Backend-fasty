const db = require('../../../database');

class AuthRepository {
    async findUserByEmail(email) {
        return db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .leftJoin('companies', 'users.company_id', 'companies.id')
            .select('users.*', 'roles.name as role_name', 'companies.company_code')
            .where('users.email', email)
            .first();
    }

    async createCompany(companyData) {
        return db('companies').insert(companyData).returning('*');
    }

    async createUser(userData) {
        return db('users').insert(userData).returning('*');
    }

    async findRoleByName(roleName) {
        return db('roles').where({ name: roleName }).first();
    }

    async getDashboardStats(companyId, isSuperAdmin) {
        const stats = {};
        
        let userQuery = db('users').count('id as count');
        let machineQuery = db('machines').count('id as count');

        if (!isSuperAdmin) {
            userQuery = userQuery.where('company_id', companyId);
            machineQuery = machineQuery.where('company_id', companyId);
        }

        const [userCount] = await userQuery;
        const [machineCount] = await machineQuery;

        stats.total_users = parseInt(userCount.count);
        stats.total_machines = parseInt(machineCount.count);
        
        return stats;
    }
}

module.exports = new AuthRepository();
