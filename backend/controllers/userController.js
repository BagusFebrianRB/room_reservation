// controllers/userController.js
const User = require("../models").User;
const { logger } = require("../logger");

// Mendapatkan semua user (hanya admin)
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] }, // pastikan tidak expose password
    });
    return res.json(users);
  } catch (err) {
    // 1. Catat detail error di log
    logger.error(err.stack);
    // 2. Teruskan error ke error-handling middleware
    return next(err);
  }
};
