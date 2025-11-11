const fs = require("fs");
const path = require("path");
const winston = require("winston");
const DailyRotateFile = require("winston-daily-rotate-file");

// Direktori log
const logDir = path.join(__dirname, "../logs");
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

// Transport untuk error (rotasi harian, arsip zip, simpan 14 hari)
const errorTransport = new DailyRotateFile({
  level: "error",
  filename: path.join(logDir, "error-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

// Transport untuk semua log (rotasi harian, arsip zip, simpan 14 hari)
const combinedTransport = new DailyRotateFile({
  filename: path.join(logDir, "combined-%DATE%.log"),
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

// Buat logger Winston
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [errorTransport, combinedTransport],
});

// Export logger dan middleware Morgan
const morgan = require("morgan");
const morganStream = { write: (msg) => logger.info(msg.trim()) };
const morganMiddleware = morgan("combined", { stream: morganStream });

module.exports = { logger, morganMiddleware };
