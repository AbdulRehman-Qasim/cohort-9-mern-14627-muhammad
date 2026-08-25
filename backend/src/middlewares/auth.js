const { verifyToken } = require('../utils/jwt');
const logger = require('../utils/logger');

const authenticate = (req, res, next) => {
  const token = req.cookies ? req.cookies.jwt : null;

  if (!token) {
    logger.warn({ ip: req.ip }, 'Unauthorized access attempt - No token');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ ip: req.ip, error: error.message }, 'Unauthorized access attempt - Invalid token');
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};

module.exports = authenticate;
