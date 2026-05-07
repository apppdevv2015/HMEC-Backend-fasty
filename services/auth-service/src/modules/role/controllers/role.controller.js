const roleService = require('../services/role.service');

class RoleController {
    async getRoles(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await roleService.getAllRoles(page, limit);
            res.json({ message: 'Roles fetched successfully', ...result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getRole(req, res) {
        try {
            const role = await roleService.getRole(req.params.id);
            if (!role) return res.status(404).json({ error: 'Role not found' });
            res.json({ message: 'Role details fetched successfully', data: role });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async createRole(req, res) {
        try {
            const role = await roleService.createRole(req.body);
            res.status(201).json({ message: 'Role created successfully', data: role });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    async updateRole(req, res) {
        try {
            const role = await roleService.updateRole(req.params.id, req.body);
            res.json({ message: 'Role updated successfully', data: role });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    async deleteRole(req, res) {
        try {
            await roleService.deleteRole(req.params.id);
            res.json({ message: 'Role deleted successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new RoleController();
