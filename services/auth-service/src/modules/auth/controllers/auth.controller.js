const authService = require('../services/auth.service');

class AuthController {
    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.login(email, password);
            res.json({ message: 'Login successful', ...result });
        } catch (err) {
            res.status(401).json({ error: err.message });
        }
    }

    async register(req, res) {
        try {
            const { company_name, fname, lname, email, password, mobile } = req.body;
            const result = await authService.registerCompany({ name: company_name, fname, lname, email, password, mobile });
            res.status(201).json({ message: 'Registration successful', data: result });
        } catch (err) {
            res.status(400).json({ error: err.message });
        }
    }

    async logout(req, res) {
        try {
            await authService.logout(req.user.id, req.user.company_id);
            res.json({ message: 'Logged out successfully' });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getActivityLogs(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const result = await authService.getActivityLogs(req.user.company_id, true, page, limit);
            res.json(result);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }

    async getDashboard(req, res) {
        try {
            const stats = await authService.getDashboard(req.user);
            res.json(stats);
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
}

module.exports = new AuthController();
