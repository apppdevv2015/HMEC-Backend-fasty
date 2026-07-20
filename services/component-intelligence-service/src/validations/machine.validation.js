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

const machineValidation = async (request, reply) => {
    // POST requires all fields, PUT allows partial
    const schema = request.method === 'POST' ? machineSchema : machineUpdateSchema;
    
    const result = schema.safeParse(request.body);
    
    if (!result.success) {
        // Extract validation issues
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
    
    // Assign validated/sanitized data back to request.body
    request.body = result.data;
};

module.exports = machineValidation;
