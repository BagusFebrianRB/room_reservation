// controllers/authController.js
require("dotenv").config();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const SECRET_KEY = process.env.SECRET_KEY;
const User = require("../models").User;
const { logger } = require("../logger");
const { UniqueConstraintError } = require("sequelize");

// Registrasi user
exports.register = async (req, res, next) => {
  const { username, email, password, role } = req.body;

  try {
    // Cek apakah user sudah ada
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Buat user baru
    const newUser = await User.create({
      username,
      email,
      password,
      role: role || "customer",
    });

    return res
      .status(201)
      .json({ message: "Registrasi Berhasil", userId: newUser.id });
  } catch (err) {
    if (err instanceof UniqueConstraintError) {
      // misal model punya unique: true di email atau username
      const field = err.errors[0].path;
      return res.status(400).json({ message: `${field} sudah digunakan` });
    }

    logger.error(err.stack);
    return next(err);
  }
};

// Login user
exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    // Cek apakah user ada
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email  salah" });
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password salah" });
    }

    // Buat token JWT
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    };

    jwt.sign(payload, SECRET_KEY, { expiresIn: "1h" }, (err, token) => {
      if (err) {
        // Log dan teruskan error
        logger.error(err.stack);
        return next(err);
      }
      return res.json({
        success: true,
        token: `Bearer ${token}`,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
      });
    });
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
};
