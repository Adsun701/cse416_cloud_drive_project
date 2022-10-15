const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

mongoose
  .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
  .catch(() => {});

const db = mongoose.connection;

module.exports = db;
