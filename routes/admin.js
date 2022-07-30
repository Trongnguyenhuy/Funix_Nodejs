const express = require("express");

const adminControllers = require('../controllers/admin');

const checkLogin = require('../middleware/checkLogin');
const checkAdmin = require('../middleware/checkAdmin');

const router = express.Router();

router.get('/add-user',checkLogin, checkAdmin, adminControllers.getAddUser);

router.post('/add-user',checkLogin, checkAdmin, adminControllers.postAddUser);

router.get('/confirm/:workerId',checkLogin, checkAdmin, adminControllers.getConfirm);

router.get('/delete/:workerId',checkLogin, checkAdmin, adminControllers.getDelete);

router.post('/admin-month-view/:workerId',checkLogin, checkAdmin, adminControllers.postAdminMonthView);

router.get('/admin-month-view/:workerId',checkLogin, checkAdmin, adminControllers.getAdminMonthView);

router.get('/covid-manager',checkLogin, checkAdmin, adminControllers.getCovidManager);

router.get('/covid-manager/:workerId',checkLogin, checkAdmin, adminControllers.getCovidManagerReport);

router.get('/progress-manager',checkLogin, checkAdmin, adminControllers.getProgressManager);

router.get('/progress-manager/:workerId',checkLogin, checkAdmin, adminControllers.getProgressManagerDetail);

module.exports = router;