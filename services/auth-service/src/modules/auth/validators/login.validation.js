const loginValidation = async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
        reply.code(400).send({
            success: false,
            message: "Email and password are required"
        });
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        reply.code(400).send({
            success: false,
            message: "Invalid email format"
        });
        return;
    }
};

module.exports = loginValidation;
