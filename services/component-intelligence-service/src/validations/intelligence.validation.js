const { z } = require('zod');

// Query validation schema for Intelligence module
const querySchema = z.object({
    companyId: z.string({
        required_error: "companyId query parameter is required"
    }).trim().uuid("companyId must be a valid UUID")
});

const intelligenceValidation = (req, res, next) => {
    if (!req.query.companyId && req.user && req.user.companyId) {
        req.query.companyId = req.user.companyId;
    }
    
    const result = querySchema.safeParse(req.query);
    
    if (!result.success) {
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
    
    // Replace req.query with sanitized/parsed values
    req.query = result.data;
    next();
};

module.exports = intelligenceValidation;
