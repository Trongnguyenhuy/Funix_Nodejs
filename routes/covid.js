const path = require("path");

const express = require("express");

const covidControllers = require('../controllers/covid');
const checkLogin = require('../middleware/checkLogin');

const router = express.Router();

router.get('/temperature',checkLogin, covidControllers.getTemperature);

router.post('/temperature',checkLogin, covidControllers.postTemperature);

router.get('/vaccination',checkLogin, covidControllers.getVaccination);

router.post('/vaccination',checkLogin, covidControllers.postVaccination);

router.get('/infection',checkLogin, covidControllers.getInfection);

router.post('/infection',checkLogin, covidControllers.postInfection);

module.exports = router;