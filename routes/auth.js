const express = require("express");

const authControllers = require('../controllers/auth');

const router = express.Router();

router.get('/login', authControllers.getLogin);

router.post('/login', authControllers.postLogin);

router.get('/logout', authControllers.getLogout);

// router.get('/signup', authControllers.getsignup);

// router.post('/signup', authControllers.postsignup);

module.exports = router;