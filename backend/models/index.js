const Room = require("./Room");
const Reservation = require("./Reservation");
const User = require("./User");

// Definisikan relasi setelah kedua model sudah dibuat
Room.hasMany(Reservation, { foreignKey: "room_id", as: "reservations" });
Reservation.belongsTo(Room, { foreignKey: "room_id", as: "room" });

User.hasMany(Reservation, { foreignKey: "userId" });
Reservation.belongsTo(User, { foreignKey: "userId", as: "user" });

module.exports = {
  Room,
  Reservation,
  User,
};
