const { Sequelize } = require("sequelize");
require("dotenv").config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "postgres",
    port: process.env.DB_PORT || 5432,
    logging: false, // matikan logging query SQL di console
  }
);

(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Koneksi ke PostgreSQL berhasil.");
    await sequelize.sync({ alter: true });
    console.log("✅ Semua tabel berhasil dibuat atau disesuaikan.");
  } catch (error) {
    console.error("❌ Gagal koneksi:", error);
  }
})();

module.exports = sequelize;
