const registerValidation = (req, res, next) => {
    const { company_name, fname, lname, email, password } = req.body;
    console.log(`[VALIDATION-DEBUG] Validating registration for: ${email}`);

    // 1. Mandatory Fields Check
    const requiredFields = ['company_name', 'fname', 'lname', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field] || req.body[field].trim() === '');

    if (missingFields.length > 0) {
        return res.status(400).json({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
    }

    // 2. Name Length Checks
    if (fname.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "First name must be at least 2 characters long"
        });
    }

    if (lname.trim().length < 2) {
        return res.status(400).json({
            success: false,
            message: "Last name must be at least 2 characters long"
        });
    }

    if (company_name.trim().length < 3) {
        return res.status(400).json({
            success: false,
            message: "Company name must be at least 3 characters long"
        });
    }

    // 3. STRICT Email Format Check
    // Ensures something@domain.extension (where extension is at least 2 chars)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: "Invalid email format. Please provide a valid email address (e.g., example@domain.com)."
        });
    }

    // 4. STRONG Password Check
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, and 1 special character
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            success: false,
            message: "Password is too weak. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        });
    }

    next();
};

module.exports = registerValidation;
