const { z } = require('zod');

// Zod Schema for Machine registration
const machineSchema = z.object({
    name: z.string({
        required_error: "Machine Name is required",
        invalid_type_error: "Machine Name must be a string"
    }).trim().min(1, "Machine Name cannot be empty"),
    
    model: z.string({
        required_error: "Machine Model is required",
        invalid_type_error: "Machine Model must be a string"
    }).trim().min(1, "Machine Model cannot be empty"),
    
    serialNumber: z.string({
        required_error: "Serial Number is required",
        invalid_type_error: "Serial Number must be a string"
    }).trim().min(1, "Serial Number cannot be empty"),
    
    companyId: z.string().trim().optional(),

    site: z.string().trim().optional().nullable(),
    equipmentType: z.string().trim().optional().nullable(),
    
    costPerHourTarget: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number().optional().nullable()
    ),
    
    costPerTonTarget: z.preprocess(
        (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
        z.number().optional().nullable()
    )
});

// For update (PUT), make all fields optional
const machineUpdateSchema = machineSchema.partial();

const machineValidation = (req, res, next) => {
    // POST requires all fields, PUT allows partial
    const schema = req.method === 'POST' ? machineSchema : machineUpdateSchema;
    
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
        // Extract validation issues
        const errorDetails = {};
        result.error.issues.forEach(issue => {
            const path = issue.path.join('.');
            errorDetails[path] = issue.message;
        });
        
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: errorDetails
        });
    }
    
    // Assign validated/sanitized data back to req.body
    req.body = result.data;
    next();
};

module.exports = machineValidation;
