const prisma = require('../../../database/prisma');

class AuthRepository {
    async findUserByEmail(email) {
        return await prisma.user.findUnique({
            where: { email },
            include: { role: true, company: true }
        });
    }

    async createCompanyWithAdmin(data) {
        return await prisma.$transaction(async (tx) => {
            // Get the last company to determine the next code
            const lastCompany = await tx.company.findFirst({
                orderBy: { createdAt: 'desc' }
            });

            let nextNumber = 1;
            if (lastCompany && lastCompany.companyCode) {
                const lastNumber = parseInt(lastCompany.companyCode.replace('HME-', ''));
                if (!isNaN(lastNumber)) {
                    nextNumber = lastNumber + 1;
                }
            }

            const companyCode = `HME-${nextNumber.toString().padStart(6, '0')}`;

            const company = await tx.company.create({
                data: {
                    name: data.company_name,
                    companyCode: companyCode,
                    subscriptionStatus: 'active'
                }
            });

            const role = await tx.role.upsert({
                where: { name: 'admin' },
                update: {},
                create: { name: 'admin' }
            });

            const user = await tx.user.create({
                data: {
                    email: data.email,
                    password: data.password,
                    firstName: data.fname,
                    lastName: data.lname,
                    roleId: role.id,
                    companyId: company.id
                }
            });

            // Exclude sensitive data before returning
            const { password, ...userWithoutPassword } = user;
            return { company, user: userWithoutPassword };
        });
    }
}

module.exports = new AuthRepository();
