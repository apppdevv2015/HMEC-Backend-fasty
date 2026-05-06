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
        console.error('[AUTH-SERVICE] Health check failed:', err);
        res.status(500).json({ status: 'DOWN', error: err.message || 'Database connection failed' });
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
            // Generate a random Company Code (e.g., HME-1234)
            const randomDigits = Math.floor(1000 + Math.random() * 9000);
            const companyCode = `HME-${randomDigits}`;

            const [company] = await trx('companies').insert({ 
                name,
                company_code: companyCode
            }).returning('*');
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
    } catch (err) { 
        console.error('[AUTH-SERVICE] Register error:', err);
        res.status(500).json({ error: err.message || 'Registration failed' }); 
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    console.log(`[AUTH-DEBUG] Login attempt for: ${email}`);
    try {
        const user = await db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .leftJoin('companies', 'users.company_id', 'companies.id')
            .select('users.*', 'roles.name as role_name', 'companies.company_code')
            .where('users.email', email).first();

        if (!user) {
            console.log(`[AUTH-DEBUG] User not found: ${email}`);
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        console.log(`[AUTH-DEBUG] Password match: ${isMatch}`);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role_name, 
                company_id: user.company_id,
                company_code: user.company_code 
            },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ 
            token, 
            user: { 
                id: user.id, 
                email: user.email, 
                role: user.role_name,
                company_code: user.company_code
            } 
        });
    } catch (err) { 
        console.error('[AUTH-SERVICE] Login error:', err);
        res.status(500).json({ error: err.message || 'Login process failed' }); 
    }
});

// --- Role CRUD (Protected) ---

app.get('/roles', authMiddleware, async (req, res) => {
    try {
        const roles = await db('roles').select('*');
        res.json(roles);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Get Roles error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch roles' }); 
    }
});

app.post('/roles', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
    const { name } = req.body;
    try {
        const [role] = await db('roles').insert({ name }).returning('*');
        res.status(201).json(role);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Create Role error:', err);
        res.status(500).json({ error: err.message || 'Failed to create role' }); 
    }
});

app.put('/roles/:id', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
    const { name } = req.body;
    try {
        const [role] = await db('roles').where({ id: req.params.id }).update({ name }).returning('*');
        res.json(role);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Update Role error:', err);
        res.status(500).json({ error: err.message || 'Failed to update role' }); 
    }
});

app.delete('/roles/:id', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
    try {
        await db('roles').where({ id: req.params.id }).del();
        res.json({ message: 'Role deleted' });
    } catch (err) { 
        console.error('[AUTH-SERVICE] Delete Role error:', err);
        res.status(500).json({ error: err.message || 'Failed to delete role' }); 
    }
});

// --- User CRUD (Protected) ---

app.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .join('companies', 'users.company_id', 'companies.id')
            .select('users.id', 'users.first_name', 'users.last_name', 'users.email', 'users.mobile_number', 'roles.name as role', 'companies.name as company')
            .where('users.id', req.user.id)
            .first();
        res.json(user);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Get Me error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch profile' }); 
    }
});

app.post('/users', authMiddleware, roleMiddleware(['admin', 'super_admin']), async (req, res) => {
    const { first_name, last_name, email, password, mobile_number, role_name, company_id } = req.body;
    
    try {
        // 1. Determine Company
        let targetCompanyId = req.user.company_id;
        if (req.user.role === 'super_admin' && company_id) {
            targetCompanyId = company_id;
        }

        // 2. Determine Role
        const role = await db('roles').where({ name: role_name || 'viewer' }).first();
        if (!role) return res.status(400).json({ error: 'Invalid role name' });

        // Security: Admins cannot create Super Admins
        if (req.user.role !== 'super_admin' && role.name === 'super_admin') {
            return res.status(403).json({ error: 'Only Super Admins can create other Super Admins' });
        }

        // 3. Create User
        const hashedPassword = await bcrypt.hash(password, 10);
        const [newUser] = await db('users').insert({
            first_name,
            last_name,
            email,
            password_hash: hashedPassword,
            mobile_number,
            role_id: role.id,
            company_id: targetCompanyId
        }).returning(['id', 'first_name', 'last_name', 'email', 'mobile_number']);

        res.status(201).json(newUser);
    } catch (err) {
        console.error('[AUTH-SERVICE] Create User error:', err);
        res.status(500).json({ error: err.message || 'Failed to create user' });
    }
});

app.get('/users', authMiddleware, async (req, res) => {
    try {
        let query = db('users')
            .join('roles', 'users.role_id', 'roles.id')
            .leftJoin('companies', 'users.company_id', 'companies.id')
            .select(
                'users.id', 
                'users.first_name', 
                'users.last_name', 
                'users.email', 
                'roles.name as role_name',
                'users.company_id',
                'companies.company_code'
            );
        
        // If not super_admin, only show users from the same company
        if (req.user.role !== 'super_admin') {
            query = query.where('users.company_id', req.user.company_id);
        }
        
        const users = await query;
        res.json(users);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Get Users error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch users' }); 
    }
});

app.get('/users/:id', authMiddleware, async (req, res) => {
    try {
        const user = await db('users').where({ id: req.params.id }).first();
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        // Access control: Non-super_admins can only see users from their own company
        if (req.user.role !== 'super_admin' && user.company_id !== req.user.company_id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        
        res.json(user);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Get User error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch user' }); 
    }
});

app.put('/users/:id', authMiddleware, async (req, res) => {
    const { first_name, last_name, mobile_number } = req.body;
    try {
        const user = await db('users').where({ id: req.params.id }).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (req.user.role !== 'super_admin' && user.company_id !== req.user.company_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const [updatedUser] = await db('users')
            .where({ id: req.params.id })
            .update({ first_name, last_name, mobile_number })
            .returning('*');
        res.json(updatedUser);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Update User error:', err);
        res.status(500).json({ error: err.message || 'Failed to update user' }); 
    }
});

app.delete('/users/:id', authMiddleware, roleMiddleware(['admin', 'super_admin']), async (req, res) => {
    try {
        const user = await db('users').where({ id: req.params.id }).first();
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (req.user.role !== 'super_admin' && user.company_id !== req.user.company_id) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await db('users').where({ id: req.params.id }).del();
        res.json({ message: 'User deleted' });
    } catch (err) { 
        console.error('[AUTH-SERVICE] Delete User error:', err);
        res.status(500).json({ error: err.message || 'Failed to delete user' }); 
    }
});

// --- Company CRUD (Protected) ---

app.get('/companies', authMiddleware, roleMiddleware(['admin', 'super_admin']), async (req, res) => {
    try {
        let query = db('companies').select('*');
        
        // If not super_admin, only show the user's own company
        if (req.user.role !== 'super_admin') {
            query = query.where('id', req.user.company_id);
        }
        
        const companies = await query;
        res.json(companies);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Get Companies error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch companies' }); 
    }
});

app.get('/companies/:id', authMiddleware, async (req, res) => {
    try {
        // Access control: Non-super_admins can only see their own company
        if (req.user.role !== 'super_admin' && req.user.company_id !== req.params.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const company = await db('companies').where({ id: req.params.id }).first();
        if (!company) return res.status(404).json({ error: 'Company not found' });
        res.json(company);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Get Company error:', err);
        res.status(500).json({ error: err.message || 'Failed to fetch company' }); 
    }
});

app.put('/companies/:id', authMiddleware, roleMiddleware(['admin', 'super_admin']), async (req, res) => {
    const { name } = req.body;
    try {
        // Access control: Non-super_admins can only update their own company
        if (req.user.role !== 'super_admin' && req.user.company_id !== req.params.id) {
            return res.status(403).json({ error: 'Access denied' });
        }
        const [company] = await db('companies').where({ id: req.params.id }).update({ name }).returning('*');
        res.json(company);
    } catch (err) { 
        console.error('[AUTH-SERVICE] Update Company error:', err);
        res.status(500).json({ error: err.message || 'Failed to update company' }); 
    }
});

app.delete('/companies/:id', authMiddleware, roleMiddleware(['super_admin']), async (req, res) => {
    try {
        await db('companies').where({ id: req.params.id }).del();
        res.json({ message: 'Company deleted' });
    } catch (err) { 
        console.error('[AUTH-SERVICE] Delete Company error:', err);
        res.status(500).json({ error: err.message || 'Failed to delete company' }); 
    }
});

// --- Admin Dashboard API (Secure & Isolated) ---

/**
 * GET /company/dashboard
 * Provides a summary of the admin's own company data.
 * Ensures strict data isolation - Admins only see their own data.
 */
app.get('/company/dashboard', authMiddleware, async (req, res) => {
    const { company_id, role } = req.user;

    // Security Check: Only Admin and Super Admin can see this
    if (role !== 'admin' && role !== 'super_admin') {
        return res.status(403).json({ error: 'Access denied: Requires Admin privileges' });
    }

    try {
        const dashboardData = await db.transaction(async (trx) => {
            // 1. Fetch Company & Subscription Info
            const company = await trx('companies')
                .leftJoin('subscriptions', 'companies.id', 'subscriptions.company_id')
                .leftJoin('subscription_plans', 'subscriptions.plan_id', 'subscription_plans.id')
                .select(
                    'companies.name as company_name',
                    'subscription_plans.name as plan_name',
                    'subscription_plans.machine_limit',
                    'subscriptions.status as subscription_status',
                    'subscriptions.end_date'
                )
                .where('companies.id', company_id)
                .first();

            // 2. Count Users in this company
            const userCount = await trx('users')
                .where({ company_id })
                .count('id as total')
                .first();

            // 3. Count Machines in this company
            const machineCount = await trx('machines')
                .where({ company_id })
                .count('id as total')
                .first();

            // 4. Recent Alerts (Top 5)
            const recentAlerts = await trx('alerts')
                .where({ company_id })
                .orderBy('created_at', 'desc')
                .limit(5);

            return {
                company: company || { name: 'Unknown', plan: 'No Active Plan' },
                stats: {
                    total_users: parseInt(userCount.total),
                    total_machines: parseInt(machineCount.total),
                    machine_limit: company ? company.machine_limit : 0
                },
                recent_alerts: recentAlerts
            };
        });

        res.json(dashboardData);
    } catch (err) {
        console.error('[AUTH-SERVICE] Dashboard Error:', err);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = app;

