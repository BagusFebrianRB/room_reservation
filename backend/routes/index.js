// routes/index.js
const express = require("express");
const router = express.Router();

const authRoutes = require("./authRoutes");
const roomRoutes = require("./roomRoutes");
const userRoutes = require("./userRoutes");
const { requireAuth } = require("../middleware/roleMiddleware");

// Gunakan rute autentikasi
router.use("/auth", authRoutes);

// Protected routes: require valid JWT
// Gunakan rute rooms
router.use("/rooms", requireAuth, roomRoutes, (err, req, res) => {
  return res.status(401).json({ message: "Unauthorized" });
});

// Gunakan rute user
router.use("/users", requireAuth, userRoutes, (err, req, res) => {
  return res.status(401).json({ message: "Unauthorized" });
});

module.exports = router;
