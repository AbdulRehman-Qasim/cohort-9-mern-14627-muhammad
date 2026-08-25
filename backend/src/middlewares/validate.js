const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const safeErrors = errors.array().map((err) => ({
      type: err.type,
      msg: err.msg,
      path: err.path,
      location: err.location,
    }));
    logger.warn({ ip: req.ip, path: req.path, errors: safeErrors }, 'Validation failed');
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};
module.exports = validate;