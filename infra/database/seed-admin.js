/**
 * Seed Script: Creates default HME Admin Company & User
 * Run: node infra/database/seed-admin.js
 */
const knex = require('knex');
const bcrypt = require('bcryptjs');
const knexConfig = require('../../knexfile');

const db = knex(knexConfig.development);

async function seedAdmin() {
    try {
        console.log('🔄 Seeding admin user...');

        // 1. Create default company
        const existingCompany = await db('companies').where({ name: 'HME Global' }).first();
        let company;
        if (existingCompany) {
            company = existingCompany;
            console.log('✅ Company "HME Global" already exists.');
        } else {
            [company] = await db('companies').insert({ name: 'HME Global' }).returning('*');
            console.log('✅ Company "HME Global" created.');
        }

        // 2. Get admin role
        const adminRole = await db('roles').where({ name: 'admin' }).first();
        if (!adminRole) {
            console.error('❌ Admin role not found. Run migrations first: npm run migrate');
            process.exit(1);
        }

        // 3. Create admin user
        const existingUser = await db('users').where({ email: 'admin@gmail.com' }).first();
        if (existingUser) {
            // Update existing user's password
            const hashedPassword = await bcrypt.hash('admin', 10);
            await db('users').where({ email: 'admin@gmail.com' }).update({
                password_hash: hashedPassword,
                first_name: 'System',
                last_name: 'Admin',
                role_id: adminRole.id,
                company_id: company.id
            });
            console.log('✅ Admin user updated: admin@gmail.com / admin');
        } else {
            const hashedPassword = await bcrypt.hash('admin', 10);
            await db('users').insert({
                first_name: 'System',
                last_name: 'Admin',
                email: 'admin@gmail.com',
                password_hash: hashedPassword,
                role_id: adminRole.id,
                company_id: company.id
            });
            console.log('✅ Admin user created: admin@gmail.com / admin');
        }

        console.log('\n🎉 Seed complete! You can now login with:');
        console.log('   Email:    admin@gmail.com');
        console.log('   Password: admin');

    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await db.destroy();
    }
}

seedAdmin();
