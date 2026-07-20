const roleValidation = async (request, reply) => {
    const { name } = request.body;

    if (request.method === 'POST') {
        if (!name) {
            reply.code(400).send({
                success: false,
                message: "Role name is required"
            });
            return;
        }
    }

    if (name && name.length < 2) {
        reply.code(400).send({
            success: false,
            message: "Role name must be at least 2 characters long"
        });
        return;
    }
};

module.exports = roleValidation;
