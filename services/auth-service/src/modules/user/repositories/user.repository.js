const db = require('../../../database');

class UserRepository {
    async getAllUsers(companyId, isSuperAdmin, page = 1, limit = 10, search = '', filters = {}) {
        const offset = (page - 1) * limit;
        
        let query = db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .leftJoin('companies', 'users.company_id', 'companies.id')
            .select(
                'users.id',
                'users.first_name',
                'users.last_name',
                'users.email',
                'users.mobile_number',
                'users.is_active',
                'users.company_id',
                'companies.name as company_name',
                'companies.company_code',
                'users.created_at',
                'users.updated_at',
                'roles.name as role_name'
            );

        if (!isSuperAdmin) {
            query = query.where('users.company_id', companyId);
        }

        // Dynamic Search (Name or Email)
        if (search) {
            query = query.where(function() {
                this.where('users.first_name', 'ilike', `%${search}%`)
                    .orWhere('users.last_name', 'ilike', `%${search}%`)
                    .orWhere('users.email', 'ilike', `%${search}%`);
            });
        }

        // Dynamic Filters (Role, Status, etc.)
        if (filters.role_name) {
            query = query.where('roles.name', filters.role_name);
        }
        if (filters.is_active !== undefined) {
            query = query.where('users.is_active', filters.is_active);
        }

        const users = await query.orderBy('users.created_at', 'desc').limit(limit).offset(offset);
        
        // Count for pagination with same filters
        let countQuery = db('users').where(isSuperAdmin ? {} : { company_id: companyId });
        if (search) {
            countQuery = countQuery.where(function() {
                this.where('first_name', 'ilike', `%${search}%`).orWhere('email', 'ilike', `%${search}%`);
            });
        }
        const [{ count }] = await countQuery.count('id as count');

        return {
            users,
            pagination: {
                total: parseInt(count),
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(count / limit)
            }
        };
    }

    async getUserById(id) {
        return db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .where('users.id', id)
            .select(
                'users.*',
                'roles.name as role_name'
            )
            .first();
    }

    async createUser(userData) {
        return db('users').insert(userData).returning('*');
    }

    async updateUser(id, userData) {
        return db('users')
            .where({ id })
            .update({ ...userData, updated_at: db.fn.now() })
            .returning('*');
    }

    async deleteUser(id) {
        return db('users').where({ id }).del();
    }
}

module.exports = new UserRepository();
