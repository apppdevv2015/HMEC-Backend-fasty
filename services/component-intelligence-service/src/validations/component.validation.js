const { z } = require('zod');

// Zod Schema for Component creation validation
const componentSchema = z.object({
    machineId: z.string({
        required_error: "Machine ID is required",
        invalid_type_error: "Machine ID must be a string"
    }).trim().min(1, "Machine ID cannot be empty"),
    
    category: z.string({
        required_error: "Category is required",
        invalid_type_error: "Category must be a string"
    }).trim().min(1, "Category cannot be empty"),
    
    description: z.string({
        required_error: "Description is required",
        invalid_type_error: "Description must be a string"
    }).trim().min(1, "Description cannot be empty"),
    
    serialNumber: z.string({
        required_error: "Serial Number is required",
        invalid_type_error: "Serial Number must be a string"
    }).trim().min(1, "Serial Number cannot be empty"),
    
    supplier: z.string().trim().optional().nullable(),
    
    installHours: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
        z.number({ invalid_type_error: "Install Hours must be a number" })
         .min(0, "Install Hours cannot be negative")
         .default(0)
    ),
    
    currentHours: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
        z.number({ invalid_type_error: "Current Hours must be a number" })
         .min(0, "Current Hours cannot be negative")
         .default(0)
    ),
    
    plannedLife: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? 2000 : Number(val)),
        z.number({ invalid_type_error: "Planned Life must be a number" })
         .min(1, "Planned Life must be at least 1 hour")
         .default(2000)
    ),
    
    replacementCost: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? 0 : Number(val)),
        z.number({ invalid_type_error: "Replacement Cost must be a number" })
         .min(0, "Replacement Cost cannot be negative")
         .default(0)
    ),
    
    condition: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? 1 : Number(val)),
        z.number().int().min(1).max(5).default(1)
    )
});

// For update (PUT), we make all fields optional, but validate them if they are present
const componentUpdateSchema = componentSchema.partial();

const componentValidation = async (request, reply) => {
    // Choose schema based on HTTP method (POST requires all, PUT allows partial)
    const schema = request.method === 'POST' ? componentSchema : componentUpdateSchema;
    
    const result = schema.safeParse(request.body);
    
    if (!result.success) {
        // Extract validation error messages in a clean structured format
        const errorDetails = {};
        result.error.issues.forEach(issue => {
            const path = issue.path.join('.');
            errorDetails[path] = issue.message;
        });
        
        reply.code(400).send({
            success: false,
            message: "Validation failed",
            errors: errorDetails
        });
        return;
    }
    
    // Assign validated and sanitized data back to request.body (casting and default-handling complete)
    request.body = result.data;
};

// Zod Schema for engineer inspection updates
const inspectSchema = z.object({
    currentHours: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({
            required_error: "Current Hours is required",
            invalid_type_error: "Current Hours must be a number"
        }).min(0, "Current Hours cannot be negative")
    ),
    
    condition: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number({
            required_error: "Condition rating is required",
            invalid_type_error: "Condition rating must be a number"
        }).int().min(1, "Condition must be between 1 and 5").max(5, "Condition must be between 1 and 5")
    )
});

const inspectValidation = async (request, reply) => {
    const result = inspectSchema.safeParse(request.body);
    
    if (!result.success) {
        const errorDetails = {};
        result.error.issues.forEach(issue => {
            const path = issue.path.join('.');
            errorDetails[path] = issue.message;
        });
        
        reply.code(400).send({
            success: false,
            message: "Validation failed",
            errors: errorDetails
        });
        return;
    }
    
    request.body = result.data;
};

module.exports = {
    componentValidation,
    inspectValidation
};
