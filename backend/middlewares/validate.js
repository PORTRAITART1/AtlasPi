function formatZodError(error) {
    return error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
      code: issue.code
    }));
  }
  
  export function validateBody(schema) {
    return function (req, res, next) {
      const result = schema.safeParse(req.body);
  
      if (!result.success) {
        return res.status(400).json({
          ok: false,
          error: "Invalid request body",
          details: formatZodError(result.error)
        });
      }
  
      req.body = result.data;
      next();
    };
  }
  
  export function validateParams(schema) {
    return function (req, res, next) {
      const result = schema.safeParse(req.params);
  
      if (!result.success) {
        return res.status(400).json({
          ok: false,
          error: "Invalid request parameters",
          details: formatZodError(result.error)
        });
      }
  
      req.params = result.data;
      next();
    };
  }
  
  export function validateQuery(schema) {
    return function (req, res, next) {
      const result = schema.safeParse(req.query);
  
      if (!result.success) {
        return res.status(400).json({
          ok: false,
          error: "Invalid request query",
          details: formatZodError(result.error)
        });
      }
  
      req.query = result.data;
      next();
    };
  }