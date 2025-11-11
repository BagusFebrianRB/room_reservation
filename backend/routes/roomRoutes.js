const express = require("express");
const router = express.Router();
const { Op } = require("sequelize");
const { Room, Reservation, User } = require("../models");
const {
  validateRoom,
  validateReservation,
  handleValidationErrors,
} = require("../middleware/validation");
const { requireAdmin } = require("../middleware/roleMiddleware");
const { logger } = require("../logger");
const { param } = require("express-validator");
const { Sequelize } = require("sequelize");

// GET /rooms  – semua user login bisa lihat rooms
router.get("/", async (req, res, next) => {
  try {
    const rooms = await Room.findAll();
    return res.json(rooms);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
});

// POST /rooms  – hanya admin
router.post(
  "/",
  requireAdmin,
  validateRoom,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const saved = await Room.create({
        name: req.body.name,
        description: req.body.description || null,
        pricePerHour: req.body.pricePerHour,
      });
      return res.status(201).json(saved);
    } catch (err) {
      logger.error(err.stack);
      return next(err);
    }
  }
);

router.post("/booking", async (req, res, next) => {
  try {
    const { startDate, endDate, startTime, endTime } = req.body;

    // Validasi dasar
    if (!startDate || !endDate || !startTime || !endTime) {
      return res.status(400).json({
        message: "startDate, endDate, startTime, endTime wajib diisi",
      });
    }

    // 1. Cari reservasi yang overlap dengan periode ini
    const conflicts = await Reservation.findAll({
      where: {
        tanggal: { [Op.between]: [startDate, endDate] },
        [Op.and]: [
          { waktu_mulai: { [Op.lt]: endTime } },
          { waktu_selesai: { [Op.gt]: startTime } },
        ],
      },
      attributes: ["room_id"],
    });

    // 2. Buat set ID ruangan yang sibuk
    const busyRoomIds = new Set(conflicts.map((r) => r.room_id));

    // 3. Ambil semua ruangan
    const rooms = await Room.findAll({
      attributes: ["id", "name", "description", "pricePerHour"],
    });

    // 4. Map ke response dengan flag available
    const result = rooms.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      pricePerHour: r.pricePerHour,
      available: !busyRoomIds.has(r.id),
    }));

    return res.json(result);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
});

// PUT /rooms/:id  – hanya admin
router.put(
  "/:id",
  requireAdmin,
  param("id")
    .isInt({ gt: 0 })
    .withMessage("id ruangan harus bilangan bulat positif"),
  validateRoom,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const room = await Room.findByPk(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Ruangan tidak ditemukan" });
      }
      room.name = req.body.name;
      room.description = req.body.description || null;
      room.pricePerHour = req.body.pricePerHour;
      const saved = await room.save();
      return res.json(saved);
    } catch (err) {
      logger.error(err.stack);
      return next(err);
    }
  }
);

// DELETE /rooms/:id  – hanya admin
router.delete(
  "/:id",
  requireAdmin,
  param("id")
    .isInt({ gt: 0 })
    .withMessage("id ruangan harus bilangan bulat positif"),
  async (req, res, next) => {
    try {
      const room = await Room.findByPk(req.params.id);
      if (!room) {
        return res.status(404).json({ message: "Ruangan tidak ditemukan" });
      }
      await room.destroy();
      return res.json({ message: "Ruangan berhasil dihapus" });
    } catch (err) {
      logger.error(err.stack);
      return next(err);
    }
  }
);

// GET /rooms/reservations  – semua reservasi (admin) atau milik user
router.get("/reservations", async (req, res, next) => {
  try {
    const where = req.user.role === "admin" ? {} : { userId: req.user.id };

    const reservations = await Reservation.findAll({
      where,
      include: [
        { model: Room, as: "room" },
        { model: User, as: "user" },
      ],
      order: [["tanggal", "DESC"]],
    });
    return res.json(reservations);
  } catch (err) {
    logger.error(err.stack);
    return next(err);
  }
});

router.get("/reservations/:id", async (req, res, next) => {
  try {
    const reservation = await Reservation.findByPk(req.params.id);
    if (!reservation) {
      return res.status(404).json({ message: "Reservasi tidak ditemukan" });
    }
    // Jika bukan admin, pastikan hanya bisa akses milik sendiri
    if (req.user.role !== "admin" && reservation.userId !== req.user.id) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    res.json(reservation);
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

router.get("/dashboard-stats", async (req, res, next) => {
  try {
    // Hitung total ruangan
    const totalRooms = await Room.count();

    // Hitung total reservasi
    const totalReservations = await Reservation.count();

    // Hitung pendapatan 7 hari terakhir
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    const revenue = await Reservation.findAll({
      where: {
        tanggal: { [Op.gte]: sevenDaysAgo },
        status: "booked",
      },
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("tanggal")), "date"],
        [Sequelize.fn("SUM", Sequelize.col("total_price")), "total"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("tanggal"))],
      order: [[Sequelize.literal("date"), "ASC"]],
    });

    // Hitung jumlah booking per hari (7 hari terakhir)
    const bookings = await Reservation.findAll({
      where: {
        tanggal: { [Op.gte]: sevenDaysAgo },
      },
      attributes: [
        [Sequelize.fn("DATE", Sequelize.col("tanggal")), "date"],
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      group: [Sequelize.fn("DATE", Sequelize.col("tanggal"))],
      order: [[Sequelize.literal("date"), "ASC"]],
    });

    return res.json({
      totalRooms,
      totalReservations,
      revenue,
      bookings,
    });
  } catch (err) {
    logger.error(err.stack);
    next(err);
  }
});

// POST /rooms/reservations  – buat reservasi baru dengan cek konflik
router.post(
  "/reservations",
  validateReservation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const { room_id, tanggal, waktu_mulai, waktu_selesai } = req.body;
      const userId =
        req.user.role === "admin" && req.body.userId
          ? req.body.userId
          : req.user.id;

      // ====== CEK OVERLAP ======
      const conflict = await Reservation.findOne({
        where: {
          room_id,
          tanggal,
          [Op.and]: [
            { waktu_mulai: { [Op.lt]: waktu_selesai } },
            { waktu_selesai: { [Op.gt]: waktu_mulai } },
          ],
        },
      });
      if (conflict) {
        return res.status(409).json({
          message: "Waktu sudah dibooking, silakan pilih slot lain",
        });
      }
      // ===========================

      //Ambil data room (harga per jam)
      const room = await Room.findByPk(room_id);
      if (!room) {
        return res.status(404).json({ message: "Ruangan tidak ditemukan" });
      }

      //Hitung durasi (jam desimal)
      const [h1, m1] = waktu_mulai.split(":").map(Number);
      const [h2, m2] = waktu_selesai.split(":").map(Number);
      const start = h1 + m1 / 60;
      const end = h2 + m2 / 60;
      const duration = end - start;
      if (duration <= 0) {
        return res.status(400).json({
          message: "waktu_selesai harus setelah waktu_mulai",
        });
      }

      //Hitung total_price
      const pricePerHour = parseFloat(room.pricePerHour); // dari model Room
      const totalPrice = parseFloat((pricePerHour * duration).toFixed(2));

      const io = req.app.get("io");

      const saved = await Reservation.create({
        room_id,
        tanggal,
        waktu_mulai,
        waktu_selesai,
        status: req.body.status || "pending_payment",
        userId,
        total_price: totalPrice,
      });
      io.emit("booking_updated");
      return res.status(201).json(saved);
    } catch (err) {
      logger.error(err.stack);
      return next(err);
    }
  }
);

// PUT /rooms/reservations/:id  – update reservasi dengan cek authorization
router.put(
  "/reservations/:id",
  param("id")
    .isInt({ gt: 0 })
    .withMessage("id ruangan harus bilangan bulat positif"),
  validateReservation,
  handleValidationErrors,
  async (req, res, next) => {
    try {
      const reservation = await Reservation.findByPk(req.params.id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservasi tidak ditemukan" });
      }
      if (reservation.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Akses ditolak" });
      }
      reservation.room_id = req.body.room_id;
      reservation.tanggal = req.body.tanggal;
      reservation.waktu_mulai = req.body.waktu_mulai;
      reservation.waktu_selesai = req.body.waktu_selesai;
      reservation.status = req.body.status || "pending_payment";
      const saved = await reservation.save();
      return res.json(saved);
    } catch (err) {
      logger.error(err.stack);
      return next(err);
    }
  }
);

// DELETE /rooms/reservations/:id  – hapus reservasi
router.delete(
  "/reservations/:id",
  param("id")
    .isInt({ gt: 0 })
    .withMessage("id ruangan harus bilangan bulat positif"),
  async (req, res, next) => {
    try {
      const reservation = await Reservation.findByPk(req.params.id);
      if (!reservation) {
        return res.status(404).json({ message: "Reservasi tidak ditemukan" });
      }
      if (reservation.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Akses ditolak" });
      }
      if (reservation.status !== "pending_payment") {
        return res.status(400).json({
          message: "Hanya reservasi belum bayar yang bisa dibatalkan",
        });
      }
      await reservation.destroy();
      return res.status(200).json({ message: "Reservasi berhasil dihapus" });
    } catch (err) {
      logger.error(err.stack);
      return next(err);
    }
  }
);

module.exports = router;
