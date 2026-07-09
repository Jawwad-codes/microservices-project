function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`);

  if (err.name === 'ZodError') {
    return res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      errors: err.errors.map(e => ({ field: e.path.join('.'), message: e.message }))
    });
  }

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({ status: 'error', message: err.message || 'Internal Server Error' });
}

module.exports = errorHandler;
