const router = require('express').Router();
const { register, login, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const { registerRules, loginRules } = require('../validators/auth.validator');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', protect, getMe);

module.exports = router;