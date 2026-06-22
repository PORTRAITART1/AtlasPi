import { ZodError } from "zod";
import logger from "../utils/logger.js";

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

        // Express 4 exposes a writable req.query; replace its contents in place.
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
        const details = formatZodIssues(err.issues);
        logger.warn("Request validation failed: " + JSON.stringify(details));
        return res.status(400).json({
          ok: false,
          error: "Validation failed",
          details
        });
      }

      return next(err);
    }
  };
}
