const db = require('../../../database');

class RoleRepository {
    async getAllRoles(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const roles = await db('roles')
            .select('id', 'name', 'created_at', 'updated_at')
            .orderBy('id', 'asc')
            .limit(limit)
            .offset(offset);
        const [{ count }] = await db('roles').count('id as count');

        return {
            roles,
            pagination: {
                total: parseInt(count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        };
    }

    async getRoleById(id) {
        return db('roles').where({ id }).first();
    }

    async createRole(roleData) {
        return db('roles').insert(roleData).returning('*');
    }

    async updateRole(id, roleData) {
        return db('roles').where({ id }).update(roleData).returning('*');
    }

    async deleteRole(id) {
        return db('roles').where({ id }).del();
    }

    async findByName(name) {
        return db('roles').where({ name }).first();
    }
}

module.exports = new RoleRepository();
