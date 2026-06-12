const roleValidation = (req, res, next) => {
    const { name } = req.body;

    if (req.method === 'POST') {
        if (!name) {
            return res.status(400).json({
                success: false,
                message: "Role name is required"
            });
        }
    }

    if (name && name.length < 2) {
        return res.status(400).json({
            success: false,
            message: "Role name must be at least 2 characters long"
        });
    }

    next();
};

module.exports = roleValidation;
