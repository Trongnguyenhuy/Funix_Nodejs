const path = require("path");

const express = require("express");

const inforControllers = require('../controllers/infor');
const checkLogin = require('../middleware/checkLogin');

const router = express.Router();

router.get('/information',checkLogin, inforControllers.getInformation);

router.get('/information/edit-infor/:workerId',checkLogin, inforControllers.getEditInformation);

router.post('/information/edit-infor/:workerId',checkLogin, inforControllers.postEditInformation);

module.exports = router;