const { registerSchema, loginSchema } = require('../validators/userValidator');
const userService = require('../services/userService');

async function register(req, res, next) {
  try {
    const data = registerSchema.parse(req.body);
    const user = await userService.registerUser(data);
    res.status(201).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const data = loginSchema.parse(req.body);
    const result = await userService.loginUser(data);
    res.status(200).json({ status: 'success', data: result });
  } catch (err) {
    next(err);
  }
}

async function getProfile(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    res.status(200).json({ status: 'success', data: user });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getProfile };
