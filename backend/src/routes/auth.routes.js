const express = require('express');
const { register, login, getCurrentUser } = require('../controllers/auth.controller');
const { validateRegister, validateLogin } = require('../validations/auth.validation');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/auth');

const router = express.Router();

router.post('/register', validateRegister, validate, register);
router.post('/login', validateLogin, validate, login);

router.get('/me', authenticate, getCurrentUser);

module.exports = router;
