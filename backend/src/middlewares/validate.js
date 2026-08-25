const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn({ ip: req.ip, path: req.path, errors: errors.array() }, 'Validation failed');
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};
module.exports = validate;