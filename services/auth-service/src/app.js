const express = require('express');
const knex = require('knex');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const knexConfig = require('../../../knexfile');

const app = express();
app.use(express.json());

const db = knex(knexConfig.development);
const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';

// Health Check
app.get('/health', async (req, res) => {
    console.log('Auth-service health check requested');
    try {
        await db.raw('SELECT 1');
        res.json({ status: 'UP', service: 'auth-service', database: 'CONNECTED' });
    } catch (err) {
        res.status(500).json({ status: 'DOWN', error: err.message });
    }
});

app.use((req, res, next) => {
    console.log(`[AUTH-SERVICE] ${req.method} ${req.path}`);
    next();
});

const { authMiddleware, roleMiddleware } = require('./middlewares/auth');

// --- Authentication Routes ---

app.post('/register', async (req, res) => {
    const { name, fname, lname, email, password, mobile } = req.body;
    try {
        await db.transaction(async (trx) => {
            const [company] = await trx('companies').insert({ name }).returning('*');
            const role = await trx('roles').where({ name: 'admin' }).first();
            const hashedPassword = await bcrypt.hash(password, 10);
            const [user] = await trx('users').insert({
                first_name: fname,
                last_name: lname,
                email,
                password_hash: hashedPassword,
                mobile_number: mobile,
                role_id: role.id,
                company_id: company.id
            }).returning(['id', 'first_name', 'last_name', 'email', 'mobile_number']);
            res.status(201).json({ message: 'Company and Admin registered', company, admin: user });
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .select('users.*', 'roles.name as role_name')
            .where({ email }).first();

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role_name, company_id: user.company_id },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, user: { id: user.id, email: user.email, role: user.role_name } });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Role CRUD (Protected) ---

app.get('/roles', authMiddleware, async (req, res) => {
    try {
        const roles = await db('roles').select('*');
        res.json(roles);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/roles', authMiddleware, roleMiddleware(['admin', 'system_admin']), async (req, res) => {
    const { name } = req.body;
    try {
        const [role] = await db('roles').insert({ name }).returning('*');
        res.status(201).json(role);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/roles/:id', authMiddleware, roleMiddleware(['admin', 'system_admin']), async (req, res) => {
    const { name } = req.body;
    try {
        const [role] = await db('roles').where({ id: req.params.id }).update({ name }).returning('*');
        res.json(role);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/roles/:id', authMiddleware, roleMiddleware(['admin', 'system_admin']), async (req, res) => {
    try {
        await db('roles').where({ id: req.params.id }).del();
        res.json({ message: 'Role deleted' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = app;
