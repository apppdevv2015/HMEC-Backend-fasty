const componentValidation = (req, res, next) => {
    const { machineId, category, description, serialNumber, plannedLife, replacementCost } = req.body;

    if (req.method === 'POST') {
        if (!machineId) {
            return res.status(400).json({ success: false, message: "Machine ID is required" });
        }
        if (!category) {
            return res.status(400).json({ success: false, message: "Category is required" });
        }
        if (!description) {
            return res.status(400).json({ success: false, message: "Description is required" });
        }
        if (!serialNumber) {
            return res.status(400).json({ success: false, message: "Serial Number is required" });
        }
    }

    // Common validations
    if (plannedLife && (isNaN(plannedLife) || plannedLife < 0)) {
        return res.status(400).json({ success: false, message: "Planned Life must be a positive number" });
    }

    if (replacementCost && (isNaN(replacementCost) || replacementCost < 0)) {
        return res.status(400).json({ success: false, message: "Replacement Cost must be a positive number" });
    }

    next();
};

module.exports = componentValidation;
