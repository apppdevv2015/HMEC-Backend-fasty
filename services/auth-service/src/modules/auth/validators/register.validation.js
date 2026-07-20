const registerValidation = async (request, reply) => {
    const { company_name, fname, lname, email, password } = request.body;
    console.log(`[VALIDATION-DEBUG] Validating registration for: ${email}`);

    // 1. Mandatory Fields Check
    const requiredFields = ['company_name', 'fname', 'lname', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !request.body[field] || request.body[field].trim() === '');

    if (missingFields.length > 0) {
        reply.code(400).send({
            success: false,
            message: `Missing required fields: ${missingFields.join(', ')}`
        });
        return;
    }

    // 2. Name Length Checks
    if (fname.trim().length < 2) {
        reply.code(400).send({
            success: false,
            message: "First name must be at least 2 characters long"
        });
        return;
    }

    if (lname.trim().length < 2) {
        reply.code(400).send({
            success: false,
            message: "Last name must be at least 2 characters long"
        });
        return;
    }

    if (company_name.trim().length < 3) {
        reply.code(400).send({
            success: false,
            message: "Company name must be at least 3 characters long"
        });
        return;
    }

    // 3. STRICT Email Format Check
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        reply.code(400).send({
            success: false,
            message: "Invalid email format. Please provide a valid email address (e.g., example@domain.com)."
        });
        return;
    }

    // 4. STRONG Password Check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    
    if (!passwordRegex.test(password)) {
        reply.code(400).send({
            success: false,
            message: "Password is too weak. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        });
        return;
    }
};

module.exports = registerValidation;
