/**
 * Script to create a Super Admin manually
 * Usage: node services/auth-service/src/scripts/create-super-admin.js <email> <password>
 */
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const prisma = require('../database/prisma');

async function createSuperAdmin() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node create-super-admin.js <email> <password>');
        process.exit(1);
    }

    const [email, password] = args;

    try {
        console.log(`Checking roles...`);
        const role = await prisma.role.findUnique({
            where: { name: 'super_admin' }
        });
        
        if (!role) {
            console.error('super_admin role not found in DB. Run seeds first.');
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Super Admins usually belong to a 'HME Systems' company
        let company = await prisma.company.findUnique({
            where: { name: 'HME Systems' }
        });

        if (!company) {
            company = await prisma.company.create({
                data: {
                    name: 'HME Systems',
                    companyCode: 'HME-000001',
                    subscriptionStatus: 'active'
                }
            });
        }

        await prisma.user.create({
            data: {
                firstName: 'Super',
                lastName: 'Admin',
                email,
                password: hashedPassword,
                roleId: role.id,
                companyId: company.id,
                isActive: true
            }
        });

        console.log(`Successfully created Super Admin: ${email}`);
    } catch (err) {
        console.error('Error creating Super Admin:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

createSuperAdmin();
