const userService = require('../services/user.service');

class UserController {
    async getUsers(req, res) {
        try {
            const isSuperAdmin = req.user.role === 'super_admin';
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const search = req.query.search || '';
            const filters = {
                role_name: req.query.role,
                is_active: req.query.active !== undefined ? req.query.active === 'true' : undefined
            };
            
            const result = await userService.getUsers(req.user.company_id, isSuperAdmin, page, limit, search, filters);
            res.json({ message: 'Users fetched successfully', ...result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getUser(req, res) {
        try {
            const user = await userService.getUser(req.params.id);
            if (!user) return res.status(404).json({ error: 'User not found' });
            res.json({ message: 'User details fetched successfully', data: user });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async createUser(req, res) {
        try {
            const isSuperAdmin = req.user.role === 'super_admin';
            const user = await userService.createUser(req.body, req.user.company_id, isSuperAdmin);
            res.status(201).json({ message: 'User created successfully', data: user });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    async updateUser(req, res) {
        try {
            const user = await userService.updateUser(req.params.id, req.body);
            res.json({ message: 'User updated successfully', data: user });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    async deleteUser(req, res) {
        try {
            await userService.deleteUser(req.params.id);
            res.json({ message: 'User deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new UserController();
