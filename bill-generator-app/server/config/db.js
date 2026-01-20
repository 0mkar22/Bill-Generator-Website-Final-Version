const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Attempt to connect
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    console.log("Database not ready yet. Retrying in 5 seconds...");
    // Retry connection after 5 seconds instead of crashing
    setTimeout(connectDB, 5000); 
  }
};

module.exports = connectDB;