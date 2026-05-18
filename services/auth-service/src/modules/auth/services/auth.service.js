const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/auth.repository');
const prisma = require('../../../database/prisma');
const JWT_SECRET = process.env.JWT_SECRET || 'hme-secret-key-2026';

class AuthService {
    async register(data) {
        // Check if user already exists
        const existingUser = await authRepository.findUserByEmail(data.email);
        if (existingUser) throw new Error('User with this email already exists');

        // Check if company name already exists
        const existingCompany = await prisma.company.findUnique({
            where: { name: data.company_name }
        });
        if (existingCompany) throw new Error('Company name already exists. Please choose a different name.');

        const hashedPassword = await bcrypt.hash(data.password, 10);
        return await authRepository.createCompanyWithAdmin({
            ...data,
            password: hashedPassword
        });
    }

    async login(email, password) {
        const user = await authRepository.findUserByEmail(email);
        if (!user) throw new Error('Invalid credentials');

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) throw new Error('Invalid credentials');

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role.name, companyId: user.companyId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        return { token, user: { id: user.id, email: user.email, role: user.role.name } };
    }
}

module.exports = new AuthService();
