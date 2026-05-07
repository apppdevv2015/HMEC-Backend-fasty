const authService = require('../services/auth.service');

class AuthController {
    async login(req, res) {
        try {
            const result = await authService.login(req.body.email, req.body.password);
            res.json(result);
        } catch (err) {
            res.status(401).json({ error: err.message });
        }
    }

    async register(req, res) {
        try {
            const result = await authService.registerCompany(req.body);
            res.status(201).json(result);
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
