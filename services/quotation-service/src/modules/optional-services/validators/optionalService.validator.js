const optionalServiceRepository = require('../repositories/optionalService.repository');

class OptionalServiceValidator {
    async validateCreate(data) {
        if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
            throw new Error('Service name is required');
        }

        const trimmedName = data.name.trim();
        if (trimmedName.length < 2) {
            throw new Error('Service name must be at least 2 characters long');
        }
        if (trimmedName.length > 100) {
            throw new Error('Service name cannot exceed 100 characters');
        }

        const existingByName = await optionalServiceRepository.findByName(trimmedName);
        if (existingByName) {
            throw new Error(`An optional service with name "${trimmedName}" already exists`);
        }

        if (data.description && typeof data.description === 'string' && data.description.length > 500) {
            throw new Error('Description cannot exceed 500 characters');
        }

        let sortOrder = 0;
        if (data.sortOrder !== undefined && data.sortOrder !== null) {
            sortOrder = Number(data.sortOrder);
            if (isNaN(sortOrder) || sortOrder < 0 || !Number.isInteger(sortOrder)) {
                throw new Error('sortOrder must be a non-negative integer (e.g. 0, 1, 2)');
            }
        }

        return {
            name: trimmedName,
            description: data.description ? data.description.trim() : null,
            sortOrder,
            isActive: data.isActive !== undefined ? Boolean(data.isActive) : true
        };
    }

    async validateUpdate(id, data) {
        const validatedPayload = {};

        if (data.name !== undefined) {
            if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
                throw new Error('Service name cannot be empty');
            }
            const trimmedName = data.name.trim();
            if (trimmedName.length < 2 || trimmedName.length > 100) {
                throw new Error('Service name must be between 2 and 100 characters');
            }
            const existingByName = await optionalServiceRepository.findByName(trimmedName);
            if (existingByName && existingByName.id !== id) {
                throw new Error(`An optional service with name "${trimmedName}" already exists`);
            }
            validatedPayload.name = trimmedName;
        }

        if (data.description !== undefined && data.description !== null) {
            if (typeof data.description === 'string' && data.description.length > 500) {
                throw new Error('Description cannot exceed 500 characters');
            }
            validatedPayload.description = data.description.trim();
        }

        if (data.sortOrder !== undefined && data.sortOrder !== null) {
            const sortOrder = Number(data.sortOrder);
            if (isNaN(sortOrder) || sortOrder < 0 || !Number.isInteger(sortOrder)) {
                throw new Error('sortOrder must be a non-negative integer (e.g. 0, 1, 2)');
            }
            validatedPayload.sortOrder = sortOrder;
        }

        if (data.isActive !== undefined) {
            validatedPayload.isActive = Boolean(data.isActive);
        }

        return validatedPayload;
    }
}

module.exports = new OptionalServiceValidator();
