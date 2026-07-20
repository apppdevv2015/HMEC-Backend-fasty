const { z } = require('zod');

// Query validation schema for Intelligence module
const querySchema = z.object({
    companyId: z.string({
        required_error: "companyId query parameter is required"
    }).trim().uuid("companyId must be a valid UUID")
});

const intelligenceValidation = async (request, reply) => {
    if (!request.query.companyId && request.user && request.user.companyId) {
        request.query.companyId = request.user.companyId;
    }
    
    const result = querySchema.safeParse(request.query);
    
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
    
    // Replace request.query with sanitized/parsed values
    request.query = result.data;
};

module.exports = intelligenceValidation;
