export const sendResponse = (res, data = null, error = false, errorMessage = null, statusCode = 200) => {
  return res.status(statusCode).json({ data, error, error_message: errorMessage });
};
