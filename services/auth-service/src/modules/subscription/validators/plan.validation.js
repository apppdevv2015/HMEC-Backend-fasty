const planValidation = (req, res, next) => {
    const { plan_name, price, machine_limit, staff_limit, validity_days } = req.body;

    // --- Create Plan (POST) specific mandatory fields ---
    if (req.method === 'POST') {
        const required = ['plan_name', 'price', 'machine_limit', 'staff_limit', 'validity_days'];
        const missing = required.filter(field => req.body[field] === undefined || req.body[field] === null);

        if (missing.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Missing fields: ${missing.join(', ')}`
            });
        }
    }

    // --- Data Integrity Checks ---

    // Plan Name validation
    if (plan_name && plan_name.length < 3) {
        return res.status(400).json({
            success: false,
            message: "Plan name must be at least 3 characters long"
        });
    }

    // Price must be a positive number
    if (price !== undefined) {
        if (isNaN(price) || Number(price) < 0) {
            return res.status(400).json({
                success: false,
                message: "Price must be a valid non-negative number"
            });
        }
    }

    // Machine Limit must be a positive integer
    if (machine_limit !== undefined) {
        if (isNaN(machine_limit) || !Number.isInteger(Number(machine_limit)) || Number(machine_limit) < 0) {
            return res.status(400).json({
                success: false,
                message: "Machine limit must be a valid non-negative integer"
            });
        }
    }

    // Staff Limit must be a positive integer
    if (staff_limit !== undefined) {
        if (isNaN(staff_limit) || !Number.isInteger(Number(staff_limit)) || Number(staff_limit) < 0) {
            return res.status(400).json({
                success: false,
                message: "Staff limit must be a valid non-negative integer"
            });
        }
    }

    // Validity Days must be at least 1
    if (validity_days !== undefined) {
        if (isNaN(validity_days) || !Number.isInteger(Number(validity_days)) || Number(validity_days) < 1) {
            return res.status(400).json({
                success: false,
                message: "Validity days must be a positive integer (at least 1 day)"
            });
        }
    }

    next();
};

module.exports = planValidation;
