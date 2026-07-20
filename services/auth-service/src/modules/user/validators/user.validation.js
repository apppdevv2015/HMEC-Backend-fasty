const userValidation = async (request, reply) => {
    const { email, first_name, last_name, role_name, mobile_number, password } = request.body;

    // --- Create User (POST) specific validations ---
    if (request.method === 'POST') {
        if (!email || !first_name || !role_name) {
            reply.code(400).send({
                success: false,
                message: "Email, first name, and role are required"
            });
            return;
        }
    }

    // --- Common Validations ---
    
    // Email Check (Strict)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
        reply.code(400).send({
            success: false,
            message: "Invalid email format. Please provide a valid email address (e.g., staff@company.com)."
        });
        return;
    }

    // First Name length
    if (first_name && first_name.trim().length < 2) {
        reply.code(400).send({
            success: false,
            message: "First name must be at least 2 characters long"
        });
        return;
    }

    // Last Name length
    if (last_name && last_name.trim().length < 2) {
        reply.code(400).send({
            success: false,
            message: "Last name must be at least 2 characters long"
        });
        return;
    }

    // Mobile Number check
    if (mobile_number) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(mobile_number)) {
            reply.code(400).send({
                success: false,
                message: "Invalid mobile number format"
            });
            return;
        }
    }

    // STRONG Password Check (If provided during Create or Update)
    if (password) {
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            reply.code(400).send({
                success: false,
                message: "Password is too weak. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
            });
            return;
        }
    }
};

const subSuperAdminValidation = async (request, reply) => {
    const { email, first_name, last_name, mobile_number, password } = request.body;

    if (!email || !first_name || !password) {
        reply.code(400).send({
            success: false,
            message: "Email, first name, and password are required"
        });
        return;
    }

    // Email Check (Strict)
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (email && !emailRegex.test(email)) {
        reply.code(400).send({
            success: false,
            message: "Invalid email format. Please provide a valid email address (e.g., example@domain.com)."
        });
        return;
    }

    // First Name length
    if (first_name && first_name.trim().length < 2) {
        reply.code(400).send({
            success: false,
            message: "First name must be at least 2 characters long"
        });
        return;
    }

    // Last Name length
    if (last_name && last_name.trim().length < 2) {
        reply.code(400).send({
            success: false,
            message: "Last name must be at least 2 characters long"
        });
        return;
    }

    // Mobile Number check
    if (mobile_number) {
        const phoneRegex = /^\+?[1-9]\d{1,14}$/;
        if (!phoneRegex.test(mobile_number)) {
            reply.code(400).send({
                success: false,
                message: "Invalid mobile number format"
            });
            return;
        }
    }

    // STRONG Password Check
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
        reply.code(400).send({
            success: false,
            message: "Password is too weak. It must be at least 8 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character."
        });
        return;
    }
};

module.exports = {
    userValidation,
    subSuperAdminValidation,
};
