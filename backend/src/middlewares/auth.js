const { verifyToken } = require('../utils/jwt');
const authenticate = (req, res, next) => {
  const token = req.cookies ? req.cookies.jwt : null;
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
};
module.exports = authenticate;