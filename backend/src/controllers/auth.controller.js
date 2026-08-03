const authService = require('../services/auth.service');

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const user = await authService.registerUser(name, email, password);

    res.status(201).json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      token,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = (req, res) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};

module.exports = {
  register,
  login,
  getCurrentUser,
};
