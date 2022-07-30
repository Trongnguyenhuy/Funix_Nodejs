const path = require("path");

const express = require("express");

const progressControllers = require('../controllers/progress');
const checkLogin = require('../middleware/checkLogin');



const router = express.Router();

router.get('/progress',checkLogin, progressControllers.getProgress);

router.get('/salary/:workerId',checkLogin, progressControllers.getSalary);

router.post('/salary/:workerId',checkLogin, progressControllers.postSalary);

router.post('/search/:workerId',checkLogin, progressControllers.postSearch);

router.get('/search/:workerId',checkLogin, progressControllers.getSearch);

router.post('/sort/:workerId',checkLogin, progressControllers.postSort);

router.get('/sort/:workerId',checkLogin, progressControllers.getSort);


module.exports = router;