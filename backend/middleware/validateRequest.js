import { ZodError } from "zod";

function formatZodIssues(issues) {
  return issues.map((issue) => ({
    path: issue.path && issue.path.length ? issue.path.join(".") : "request",
    message: issue.message,
    code: issue.code
  }));
}

export function validateRequest(schemas = {}) {
  return (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }

      if (schemas.query) {
        const parsedQuery = schemas.query.parse(req.query);

        // Keep compatibility with Express query object
        Object.keys(req.query || {}).forEach((key) => {
          delete req.query[key];
        });

        Object.assign(req.query, parsedQuery);
      }

      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      return next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details: formatZodIssues(err.issues)
        });
      }

      return next(err);
    }
  };
}
