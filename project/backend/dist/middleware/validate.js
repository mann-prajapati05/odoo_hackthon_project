export const validate = (schema, target) => {
    return (req, res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            res.status(422).json({
                error: "Validation failed",
                issues: result.error.flatten().fieldErrors,
            });
            return;
        }
        if (target === "query") {
            res.locals.validatedQuery = result.data;
        }
        else if (target === "params") {
            Object.assign(req.params, result.data);
        }
        else {
            req.body = result.data;
        }
        next();
    };
};
