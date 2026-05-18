const userValidation = (req, res, next) => {
    const { email, first_name, last_name, role_name, mobile_number, password } = req.body;

    // --- Create User (POST) specific validations ---
    if (req.method === 'POST') {
        if (!email || !first_name || !role_name) {
            return res.status(400).json({
                success: false,
                message: "Email, first name, and role are required"
            });
        }
    }

    // --- Common Validations ---
    
    // Email Check (Strict)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format. Please provide a valid email address (e.g., staff@company.com)."
        });
    }

    // First Name length
    if (first_name && first_name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "First name must be at least 2 characters long"
        });
    }

    // Last Name length
    if (last_name && last_name.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "Last name must be at least 2 characters long"
        });
    }

    // Mobile Number check
    if (mobile_number) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(mobile_number)) {
            return res.status(400).json({
                success: false,
                message: "Invalid mobile number format"
            });
        }
    }

    // STRONG Password Check (If provided during Create or Update)
    if (password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Password is too weak. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
            });
        }
    }

    next();
};

module.exports = userValidation;
