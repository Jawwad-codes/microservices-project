const express = require('express');
const router = express.Router();
const { register, login, getProfile } = require('../controllers/userController');

router.post('/register', register);
router.post('/login', login);
router.get('/users/:id', getProfile);

module.exports = router;
