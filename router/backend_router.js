const express = require('express');
const equipmentController = require('../controllers/equipment_borrow');

const prodRouter = express.Router();

// Route to submit form and send OTP
prodRouter.post('/insert-details', equipmentController.submitForm);
// Route to verify OTP and submit form data
prodRouter.post('/verify-otp', equipmentController.verifyOTPAndSubmit);
// Route to get all equipment
prodRouter.get('/get-all-equipment', equipmentController.getAllEquipment);

module.exports = prodRouter;