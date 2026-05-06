/**
 * Script to create a Super Admin manually
 * Usage: node services/auth-service/src/scripts/create-super-admin.js <email> <password>
 */
const knex = require('knex');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const knexConfig = require('../../../../knexfile');

const db = knex(knexConfig.development);

async function createSuperAdmin() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log('Usage: node create-super-admin.js <email> <password>');
        process.exit(1);
    }

    const [email, password] = args;

    try {
        console.log(`Checking roles...`);
        const role = await db('roles').where({ name: 'super_admin' }).first();
        if (!role) {
            console.error('super_admin role not found in DB. Run migrations first.');
            process.exit(1);
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Super Admins usually don't belong to a specific company, or belong to a 'System' company
        let company = await db('companies').where({ name: 'HME System' }).first();
        if (!company) {
            [company] = await db('companies').insert({ name: 'HME System' }).returning('*');
        }

        await db('users').insert({
            first_name: 'Super',
            last_name: 'Admin',
            email,
            password_hash: hashedPassword,
            role_id: role.id,
            company_id: company.id
        });

        console.log(`Successfully created Super Admin: ${email}`);
    } catch (err) {
        console.error('Error creating Super Admin:', err.message);
    } finally {
        await db.destroy();
    }
}

createSuperAdmin();
