const authService = require('../services/auth.service');
const logger = require('../utils/logger');

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.registerUser(name, email, password);

    logger.info({ userId: user.id }, 'User registered successfully');

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.warn({ error: errMessage }, 'User registration failed');
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser(email, password);

    res.cookie('jwt', token, getCookieOptions());
    logger.info({ userId: user.id }, 'User logged in successfully');

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    logger.warn({ error: errMessage }, 'User login failed');
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const options = getCookieOptions();
    delete options.maxAge;
    res.clearCookie('jwt', options);

    logger.info({ userId: req.user?.id }, 'User logged out successfully');

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  getCurrentUser,
};
