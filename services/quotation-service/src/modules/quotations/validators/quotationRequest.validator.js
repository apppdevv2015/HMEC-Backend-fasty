class QuotationRequestValidator {
    validateCreate(data) {
        // 1. Quotation Type Validation
        if (!data.quotationType || typeof data.quotationType !== 'string' || !data.quotationType.trim()) {
            throw new Error('Quotation Type is required');
        }

        // 2. Number of Sites Validation
        let numberOfSites = 1;
        if (data.numberOfSites !== undefined && data.numberOfSites !== null) {
            numberOfSites = Number(data.numberOfSites);
            if (isNaN(numberOfSites) || numberOfSites < 1 || !Number.isInteger(numberOfSites)) {
                throw new Error('Number of sites must be a positive integer (at least 1)');
            }
        }

        // 3. Site Names Validation
        let siteNames = [];
        if (data.siteNames) {
            if (Array.isArray(data.siteNames)) {
                siteNames = data.siteNames.map(s => String(s).trim()).filter(Boolean);
            } else if (typeof data.siteNames === 'string' && data.siteNames.trim()) {
                siteNames = [data.siteNames.trim()];
            }
        }

        // 4. Active Machines Validation
        let activeMachines = 1;
        if (data.activeMachines !== undefined && data.activeMachines !== null) {
            activeMachines = Number(data.activeMachines);
            if (isNaN(activeMachines) || activeMachines < 1 || !Number.isInteger(activeMachines)) {
                throw new Error('Active machines count must be a positive integer (at least 1)');
            }
        }

        // 5. Equipment Types Validation
        let equipmentTypes = [];
        if (data.equipmentTypes) {
            if (Array.isArray(data.equipmentTypes)) {
                equipmentTypes = data.equipmentTypes.map(e => String(e).trim()).filter(Boolean);
            } else if (typeof data.equipmentTypes === 'string' && data.equipmentTypes.trim()) {
                equipmentTypes = [data.equipmentTypes.trim()];
            }
        }

        // 6. Contract Duration Validation
        let contractDuration = null;
        if (data.contractDuration && typeof data.contractDuration === 'string' && data.contractDuration.trim()) {
            contractDuration = data.contractDuration.trim();
        }

        // 7. Optional Services Array Validation
        let optionalServices = [];
        if (data.optionalServices) {
            if (Array.isArray(data.optionalServices)) {
                optionalServices = data.optionalServices.map(s => String(s).trim()).filter(Boolean);
            } else if (typeof data.optionalServices === 'string' && data.optionalServices.trim()) {
                optionalServices = [data.optionalServices.trim()];
            }
        }

        // 8. Email validation (if provided)
        let email = null;
        if (data.email && typeof data.email === 'string' && data.email.trim()) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(data.email.trim())) {
                throw new Error('Please provide a valid email address');
            }
            email = data.email.trim().toLowerCase();
        }

        return {
            quotationType: data.quotationType.trim(),
            numberOfSites,
            siteNames,
            activeMachines,
            equipmentTypes,
            contractDuration,
            optionalServices,
            email,
            companyName: data.companyName ? String(data.companyName).trim() : null,
            contactPerson: data.contactPerson ? String(data.contactPerson).trim() : null,
            phone: data.phone ? String(data.phone).trim() : null,
            siteLocation: data.siteLocation ? String(data.siteLocation).trim() : null,
            implementationRequirements: data.implementationRequirements ? String(data.implementationRequirements).trim() : null,
            additionalRequirements: data.additionalRequirements ? String(data.additionalRequirements).trim() : null,
            attachmentUrl: data.attachmentUrl ? String(data.attachmentUrl).trim() : null,
            attachmentFileName: data.attachmentFileName ? String(data.attachmentFileName).trim() : null,
            attachmentFileType: data.attachmentFileType ? String(data.attachmentFileType).trim() : null,
            attachmentSize: data.attachmentSize ? Number(data.attachmentSize) : null
        };
    }
}

module.exports = new QuotationRequestValidator();
