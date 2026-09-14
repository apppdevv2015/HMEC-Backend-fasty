const fs = require('fs');
const path = require('path');
const crypto = require('crypto');


const SIGNATURE_UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'signatures');
const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'application/pdf'];

function ensureUploadDir() {
    if (!fs.existsSync(SIGNATURE_UPLOAD_DIR)) {
        fs.mkdirSync(SIGNATURE_UPLOAD_DIR, { recursive: true });
    }
}
function saveSignatureFile(buffer, originalFilename, mimetype) {
    if (!buffer || buffer.length === 0) {
        throw new Error('Signature file is empty or missing');
    }
    if (!ALLOWED_MIME_TYPES.includes(mimetype)) {
        throw new Error('Signature must be a PNG, JPEG, or WEBP image');
    }

    const maxSizeBytes = 5 * 1024 * 1024; 
    if (buffer.length > maxSizeBytes) {
        throw new Error('Signature file must be under 5MB');
    }

    ensureUploadDir();

    const ext = path.extname(originalFilename || '') || '.png';
    const safeExt = ['.png', '.jpg', '.jpeg', '.webp'].includes(ext.toLowerCase()) ? ext : '.png';
    const fileName = `sig_${Date.now()}_${crypto.randomBytes(6).toString('hex')}${safeExt}`;
    const filePath = path.join(SIGNATURE_UPLOAD_DIR, fileName);

    fs.writeFileSync(filePath, buffer);

    return `/uploads/signatures/${fileName}`;
}

module.exports = { saveSignatureFile };