// middleware/validation.js
const { body, validationResult } = require("express-validator");

// Validasi untuk POST dan PUT rooms
exports.validateRoom = [
  body("name").notEmpty().withMessage("Nama ruangan tidak boleh kosong"),
  body("description")
    .optional()
    .isString()
    .withMessage("Deskripsi harus berupa string"),
  body("pricePerHour")
    .notEmpty()
    .withMessage("pricePerHour wajib diisi")
    .isFloat({ min: 0 })
    .withMessage("pricePerHour harus angka ≥ 0"),
];

// Validasi untuk POST dan PUT reservations
exports.validateReservation = [
  body("room_id")
    .notEmpty()
    .isInt()
    .withMessage("ID ruangan harus berupa angka"),
  body("tanggal")
    .notEmpty()
    .isISO8601()
    .withMessage("Tanggal harus dalam format YYYY-MM-DD"),
  body("waktu_mulai")
    .notEmpty()
    .isString()
    .withMessage("Waktu mulai harus berupa string"),
  body("waktu_selesai")
    .notEmpty()
    .isString()
    .withMessage("Waktu selesai harus berupa string")
    .custom((value, { req }) => {
      if (value <= req.body.waktu_mulai) {
        throw new Error("Waktu selesai harus lebih dari waktu mulai");
      }
      return true;
    }),
  body("status")
    .optional()
    .isString()
    .withMessage("Status harus berupa string"),
];

// Validasi untuk POST user (registrasi)
exports.validateUser = [
  body("username")
    .notEmpty()
    .withMessage("Username tidak boleh kosong")
    .isLength({ min: 3 })
    .withMessage("Username minimal 3 karakter"),
  body("email")
    .notEmpty()
    .withMessage("Email tidak boleh kosong")
    .isEmail()
    .withMessage("Email tidak valid"),
  body("password")
    .notEmpty()
    .withMessage("Password tidak boleh kosong")
    .isLength({ min: 6 })
    .withMessage("Password minimal 6 karakter"),
  body("role")
    .optional()
    .isIn(["admin", "customer"])
    .withMessage("Role harus 'admin' atau 'customer'"),
];

// Validasi untuk POST login
exports.validateLogin = [
  body("email")
    .notEmpty()
    .withMessage("Email tidak boleh kosong")
    .isEmail()
    .withMessage("Email tidak valid"),
  body("password").notEmpty().withMessage("Password tidak boleh kosong"),
];

// Middleware untuk menangani error validasi
exports.handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
