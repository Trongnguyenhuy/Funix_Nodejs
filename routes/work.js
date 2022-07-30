const path = require("path");

const express = require("express");

const workControllers = require('../controllers/work');
const checkLogin = require('../middleware/checkLogin');

const router = express.Router();

router.get('/', workControllers.getIndex);

router.get('/start',checkLogin, workControllers.getStart);

router.post('/start',checkLogin, workControllers.postStart);

router.get('/end/:workerId',checkLogin, workControllers.getEnd);

router.post('/end/:workId',checkLogin, workControllers.postEnd);

router.post('/leave/:workerId',checkLogin, workControllers.postLeave);

router.get('/leave',checkLogin, workControllers.getLeave);

module.exports = router;