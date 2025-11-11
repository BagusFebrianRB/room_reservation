const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Reservation = sequelize.define("Reservation", {
  tanggal: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  waktu_mulai: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  waktu_selesai: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM(
      "pending_payment", // menunggu pembayaran
      "booked", // sudah dibooking (lunas)
      "cancelled", // dibatalkan sebelum usage
      "completed" // sudah lewat/telah digunakan
    ),
    allowNull: false,
    defaultValue: "pending_payment",
  },
  total_price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    field: "total_price",
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});

module.exports = Reservation;
