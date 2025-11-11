// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { getAllUsers } = require("../controllers/userController");

// Middleware untuk memeriksa apakah user adalah admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Akses dilarang" });
  }
  next();
};

// Middleware untuk memeriksa apakah user adalah customer
const requireCustomer = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res.status(403).json({ message: "Akses dilarang" });
  }
  next();
};

// Get all users (hanya untuk admin)
router.get("/", requireAdmin, getAllUsers);

// Contoh endpoint hanya untuk customer
router.get("/profile", requireCustomer, (req, res) => {
  res.json({ message: "Profil customer", user: req.user });
});

module.exports = router;
