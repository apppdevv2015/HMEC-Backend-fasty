const fs = require('fs').promises;
const path = require('path');

class TemplateService {
    async getTemplate(templateName, data) {
        try {
            // Path corrected to where templates actually are
            const templatePath = path.join(__dirname, '..', '..', '..', 'templates', 'emails', `${templateName}.html`);
            let content = await fs.readFile(templatePath, 'utf8');

            // Embed Logo as Base64
            try {
                const logoPath = path.join(__dirname, '..', '..', '..', 'templates', 'emails', 'logo.png');
                const logoBuffer = await fs.readFile(logoPath);
                const logoBase64 = logoBuffer.toString('base64');
                data.logo = `data:image/png;base64,${logoBase64}`;
            } catch (logoErr) {
                console.warn('[TEMPLATE WARNING] Logo not found, skipping embedding');
                data.logo = ''; 
            }

            // Replace placeholders {{key}} with data[key]
            Object.keys(data).forEach(key => {
                const placeholder = new RegExp(`{{${key}}}`, 'g');
                content = content.replace(placeholder, data[key]);
            });

            return content;
        } catch (error) {
            console.error(`[TEMPLATE ERROR] Could not load template ${templateName}:`, error);
            throw error;
        }
    }
}

module.exports = new TemplateService();
