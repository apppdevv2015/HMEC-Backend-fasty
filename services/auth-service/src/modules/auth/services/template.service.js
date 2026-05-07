const fs = require('fs').promises;
const path = require('path');

class TemplateService {
    async getTemplate(templateName, data) {
        try {
            const templatePath = path.join(__dirname, '..', 'templates', 'emails', `${templateName}.html`);
            let content = await fs.readFile(templatePath, 'utf8');

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
