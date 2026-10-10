
const mongoose = require("mongoose");
const dns = require("node:dns");

// Configure DNS for MongoDB Atlas SRV lookups.
// This uses Google's public DNS for this Node.js process.
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error(
      "[MongoDB Error] MONGO_URI is missing from backend/.env"
    );
    return null;
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(
      `[MongoDB Connected] Host: ${conn.connection.host}`
    );
    console.log(
      `[MongoDB Connected] Database: ${conn.connection.name}`
    );

    return conn;
  } catch (error) {
    console.error("[MongoDB Connection Failed]");
    console.error("Error:", error.message);

    return null;
  }
};

module.exports = connectDB;