const validateBody = (requiredFields) => {
    return (req, res, next) => {
        console.log("Middleware Received Body:", req.body); 
        const missingFields = requiredFields.filter((field) => !req.body?.[field]);

        if (missingFields.length > 0) {
            console.log("Middleware Failed. Missing:", missingFields);
            return res.status(400).json({
                error: `Missing required parameter(s): ${missingFields.join(", ")}`,
            });
        }

        next();
    };
};

module.exports = { validateBody };