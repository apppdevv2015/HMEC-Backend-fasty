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
            // Get all company codes starting with 'HME-' to determine the next numeric code
            const companies = await tx.company.findMany({
                where: {
                    companyCode: {
                        startsWith: 'HME-'
                    }
                },
                select: {
                    companyCode: true
                }
            });

            let maxNumber = 0;
            for (const c of companies) {
                if (c.companyCode) {
                    const suffix = c.companyCode.substring(4); // Remove 'HME-'
                    const num = parseInt(suffix, 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }

            const nextNumber = maxNumber + 1;
            const companyCode = `HME-${nextNumber.toString().padStart(6, '0')}`;

            const company = await tx.company.create({
                data: {
                    name: data.company_name,
                    companyCode: companyCode,
                    subscriptionStatus: 'pending'
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
                    companyId: company.id,
                    isActive: false,
                    mobileNumber: data.mobile_number || data.mobileNumber
                },
                include: {
                    role: true
                }
            });

            // Exclude sensitive data and format role before returning
            const { password, roleId, role: roleObj, ...restOfUser } = user;
            return { 
                company, 
                user: {
                    ...restOfUser,
                    role: roleObj ? roleObj.name : null
                }
            };
        });
    }

    async updateUserLastLogin(userId) {
        try {
            return await prisma.user.update({
                where: { id: userId },
                data: { updatedAt: new Date() }
            });
        } catch (e) {
            console.error("Failed to update user last login time:", e);
        }
    }

    async updateUserPassword(userId, hashedPassword) {
        return await prisma.user.update({
            where: { id: userId },
            data: { 
                password: hashedPassword,
                updatedAt: new Date()
            }
        });
    }
}

module.exports = new AuthRepository();
