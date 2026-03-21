import { ApiError } from './errors.js';

export const validate = (schema, source = 'body') => (req, res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const issues = result.error?.issues || result.error?.errors || [];
    const msg = issues.map(e => `${e.path ? e.path.join('.') : 'field'}: ${e.message}`).join(', ');
    return next(new ApiError(400, msg || 'Validation Error'));
  }
  req[source] = result.data;
  next();
};
