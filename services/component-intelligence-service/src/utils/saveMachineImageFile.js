const fs = require('fs');
const path = require('path');

function saveMachineImageFile(rawImageInput) {
  if (!rawImageInput || typeof rawImageInput !== 'string') {
    return null;
  }

  // If it's already an HTTP URL or local static path, return as is
  if (rawImageInput.startsWith('http://') || rawImageInput.startsWith('https://') || rawImageInput.startsWith('/uploads/')) {
    return rawImageInput;
  }

  // Check if it's a Base64 data URL
  if (rawImageInput.startsWith('data:image/')) {
    try {
      const matches = rawImageInput.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return rawImageInput;
      }

      let ext = matches[1].toLowerCase();
      if (ext === 'jpeg') ext = 'jpg';
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      const filename = `machine_${Date.now()}_${Math.floor(Math.random() * 10000)}.${ext}`;

      // 1. Save to Backend public uploads folder
      const backendUploadDir = path.join(__dirname, '../../public/uploads/machine_images');
      if (!fs.existsSync(backendUploadDir)) {
        fs.mkdirSync(backendUploadDir, { recursive: true });
      }
      const backendFilePath = path.join(backendUploadDir, filename);
      fs.writeFileSync(backendFilePath, buffer);
      console.log(`[FILE-SAVER] Saved machine photo to backend disk: ${backendFilePath}`);

      // 2. Save copy to Frontend public uploads folder
      const frontendUploadDir = path.join(__dirname, '../../../../../HMEC frontend/public/uploads/machine_images');
      try {
        if (!fs.existsSync(frontendUploadDir)) {
          fs.mkdirSync(frontendUploadDir, { recursive: true });
        }
        const frontendFilePath = path.join(frontendUploadDir, filename);
        fs.writeFileSync(frontendFilePath, buffer);
        console.log(`[FILE-SAVER] Saved machine photo to frontend disk: ${frontendFilePath}`);
      } catch (err) {
        console.warn(`[FILE-SAVER] Frontend path sync warning:`, err.message);
      }

      // Return relative static path for database storage
      return `/uploads/machine_images/${filename}`;
    } catch (err) {
      console.error('[FILE-SAVER] Error saving image file to disk:', err);
      return rawImageInput;
    }
  }

  return rawImageInput;
}

module.exports = saveMachineImageFile;
