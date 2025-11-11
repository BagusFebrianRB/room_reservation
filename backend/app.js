require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const routes = require("./routes/index");
const passport = require("passport");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { logger, morganMiddleware } = require("./logger");

// Inisialisasi aplikasi Express
const app = express();

app.use(helmet());

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*", // sesuaikan kalau perlu
  },
});

app.set("io", io);

//limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // maksimal 100 request per IP
  message: "Terlalu banyak request dari IP ini, coba lagi nanti.",
});
app.use(limiter);

// Logging
app.use(morganMiddleware);

// Middleware
app.use(cors());
app.use(express.json());

// Inisialisasi Passport
require("./config/passport")(passport);
app.use(passport.initialize());

// Gunakan route API
app.use("/", routes);

// Error‐handling middleware (letakkan setelah semua routes)
app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  // Log konteks endpoint
  logger.error(`Error on ${req.method} ${req.originalUrl}: ${err.message}`);
  // Kirim respons generik
  res.status(500).json({ status: "error", message: "Internal Server Error" });
});

// Jalankan server pada port tertentu
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server berjalan pada http://localhost:${PORT}`);
});
