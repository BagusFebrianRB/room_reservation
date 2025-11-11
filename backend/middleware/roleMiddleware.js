// middleware/roleMiddleware.js

const passport = require("passport");

const requireAuth = passport.authenticate("jwt", {
  session: false,
  failWithError: true, // agar error dilempar ke next(err)
});

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .json({ message: "Akses dilarang. Hanya admin yang diizinkan." });
  }
  next();
};

const requireCustomer = (req, res, next) => {
  if (req.user.role !== "customer") {
    return res
      .status(403)
      .json({ message: "Akses dilarang. Hanya customer yang diizinkan." });
  }
  next();
};

module.exports = {
  requireAuth,
  requireAdmin,
  requireCustomer,
};
