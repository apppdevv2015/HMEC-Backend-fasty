const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const backupDir = path.join(__dirname, 'backups');
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

const now = new Date();
const timestamp = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0') + '_' +
    String(now.getHours()).padStart(2, '0') +
    String(now.getMinutes()).padStart(2, '0') +
    String(now.getSeconds()).padStart(2, '0');

const backupFile = path.join(backupDir, `hme_intelligence_backup_${timestamp}.sql`);
const pgDumpPath = '"C:\\Program Files\\PostgreSQL\\17\\bin\\pg_dump.exe"';

const cmd = `${pgDumpPath} -h 127.0.0.1 -p 5432 -U postgres -d hme_intelligence -F p -b -f "${backupFile}"`;

console.log('🔄 Taking PostgreSQL database backup for hme_intelligence...');

try {
    execSync(cmd, {
        env: {
            ...process.env,
            PGPASSWORD: 'admin'
        },
        stdio: 'inherit'
    });

    if (fs.existsSync(backupFile)) {
        const stats = fs.statSync(backupFile);
        const sizeInKb = (stats.size / 1024).toFixed(2);
        console.log('✅ [DATABASE_BACKUP_SUCCESSFUL]');
        console.log(`📁 File: ${backupFile}`);
        console.log(`📊 Size: ${sizeInKb} KB`);
    } else {
        console.error('❌ Backup file was not generated.');
    }
} catch (error) {
    console.error('❌ Database backup failed:', error.message);
}
