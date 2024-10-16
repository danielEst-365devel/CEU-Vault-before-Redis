const database = require('../models/connection_db')
const nodemailer = require('nodemailer');
const session = require('express-session');
const user_model = require('../models/user_mod')
const equipment_model = require('../models/equipment_mod')
const express = require('express')

// Set up Nodemailer with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'ceu.otp@gmail.com',
    pass: 'gewj zaqo ppmf aqfx'
  }
});

// Send email example
const sendEmail = async (recipientEmail, otpCode) => {
  try {
    const info = await transporter.sendMail({
      from: '"CEU VAULT" <ceu.otp@gmail.com>',
      to: recipientEmail,
      subject: 'Your OTP Code',
      text: `Your OTP Code is ${otpCode}`,
      html: `<b>Your OTP Code is ${otpCode}</b>`
    });
    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

// Generate OTP
const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * 10)];
  }
  return otp;
};

// Send OTP and store it in session
const sendOTP = async (email, req) => {
  const generatedOTP = generateOTP();
  await sendEmail(email, generatedOTP);
  req.session.generatedOTP = generatedOTP;
};

const submitForm = async (req, res, next) => {
  let { firstName, lastName, departmentName, email, natureOfService, purpose, venue, equipmentCategories } = req.body;

  // Validate required fields
  if (!firstName || !lastName || !departmentName || !email || !natureOfService || !purpose || !venue || !equipmentCategories || equipmentCategories.length === 0) {
    return res.status(400).json({
      successful: false,
      message: "Missing required fields: First name, Last name, Department name, Email, Nature of service, Purpose, Venue, or Equipment categories."
    });
  }

  // Validate email format
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({
      successful: false,
      message: "Invalid email format."
    });
  }

  // Validate email domain
  if (!/@(mls\.ceu\.edu\.ph|ceu\.edu\.ph)$/.test(email)) {
    return res.status(400).json({
      successful: false,
      message: "Email must end with @mls.ceu.edu.ph or @ceu.edu.ph."
    });
  }

  // Validate dates and times
  for (let item of equipmentCategories) {
    if (!item.category || !item.dateRequested || !/^\d{4}-\d{2}-\d{2}$/.test(item.dateRequested) || !item.timeRequested || !/^\d{2}:\d{2}:\d{2}$/.test(item.timeRequested)) {
      return res.status(400).json({
        successful: false,
        message: "Each equipment category must include a valid date (YYYY-MM-DD) and time (HH:MM:SS)."
      });
    }
  }

  // Store form data in session
  req.session.formData = req.body;

  // Send OTP
  await sendOTP(email, req);

  res.status(200).json({
    successful: true,
    message: "OTP sent to your email. Please verify the OTP to proceed."
  });
};


const verifyOTPAndSubmit = async (req, res, next) => {
  const { otp } = req.body;

  if (otp !== req.session.generatedOTP) {
    return res.status(400).json({
      successful: false,
      message: "Invalid OTP. Please try again."
    });
  }

  // Retrieve form data from session
  const formData = req.session.formData;

  try {
    // Loop through each equipment category and insert a row for each
    for (let item of formData.equipmentCategories) {
      const query = `
        INSERT INTO requests (
          email, first_name, last_name, department, nature_of_service, 
          purpose, venue, equipment_category_id, quantity_requested, requested, time_requested
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const values = [
        formData.email,
        formData.firstName,
        formData.lastName,
        formData.departmentName,
        formData.natureOfService,
        formData.purpose,
        formData.venue,
        item.categoryId, // Assuming you are passing the category ID here
        item.quantity, // Quantity requested for each category
        item.dateRequested, // Requested date for the equipment
        item.timeRequested // Requested time for the equipment
      ];

      await database.db.query(query, values);
    }

    res.status(200).json({
      successful: true,
      message: "Form submitted successfully."
    });
  } catch (err) {
    res.status(500).json({
      successful: false,
      message: "An unexpected error occurred.",
      error: err
    });
  }
};

const getAllEquipment = async (req, res, next) => {
  try {
    // Query to retrieve all equipment details from the equipment table
    const query = `SELECT * FROM equipment`;

    database.db.query(query, (err, rows) => {
      if (err) {
        res.status(500).json({
          successful: false,
          message: "Database error occurred.",
          error: err
        });
      } else {
        res.status(200).json({
          successful: true,
          data: rows
        });
      }
    });
  } catch (err) {
    res.status(500).json({
      successful: false,
      message: "An unexpected error occurred.",
      error: err
    });
  }
};

module.exports = {
  submitForm,
  verifyOTPAndSubmit,
  getAllEquipment
}
