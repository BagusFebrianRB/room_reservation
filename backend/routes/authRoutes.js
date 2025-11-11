// routes/authRoutes.js
const express = require("express");
const router = express.Router();
const { register, login } = require("../controllers/authController");
const {
  validateUser,
  handleValidationErrors,
  validateLogin,
} = require("../middleware/validation");

// Registrasi user
router.post("/register", validateUser, handleValidationErrors, register);

// Login user
router.post("/login", validateLogin, handleValidationErrors, login);

module.exports = router;
