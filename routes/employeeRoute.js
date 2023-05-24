const express = require("express");


const { body, check, validationResult } = require("express-validator");
const { createTable, updateTable, deleteTable, getDataFromTables, getDataById } = require("../controller/employeeController");
var router = express.Router();

// Define validation rules
const validationRules = [
  body('email').isEmail().withMessage('Invalid email'),
  body('phoneNumber').isLength({ min: 10 }).withMessage('Phone Number should be 10 digit long'),
  body('primaryEmergencyPhoneNumber').isLength({ max: 10 }).withMessage('primary Emergency Phone Number should be 10 digit long'),
  body('secondaryEmergencyPhoneNumber').isLength({ max: 10 }).withMessage('secondary Emergency PhoneNumber should be 10 digit long'),
  // Add more validation rules for other fields
];


router.post("/employee/create", validationRules, createTable);

router.put('/employee/update/:employeeId', updateTable);

router.delete('/employee/delete/:id', deleteTable)

router.get('/employee/getAll', getDataFromTables)

router.get('/employee/getById/:id', getDataById)

module.exports = router;
   