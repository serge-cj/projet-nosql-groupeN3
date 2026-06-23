function validateRequest(schema) {
  return (req, res, next) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
      headers: req.headers,
    });

    if (!result.success) {
      const error = new Error('Échec de la validation des données');
      error.statusCode = 400;
      error.details = result.error.format();
      return next(error);
    }

    req.validated = result.data;
    next();
  };
}

module.exports = validateRequest;
