const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (err) {
        console.error(`Error: ${err.message}`);
        console.log("Creating server without Database connection (Static Files Only mode)");
        // process.exit(1); // Do not exit, allow server to run for static files
    }
};

module.exports = connectDB;
