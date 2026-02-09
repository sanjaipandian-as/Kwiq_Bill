const mongoose = require('mongoose');
const User = require('../models/userModel');

const fs = require('fs');
const path = require('path');

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Stop trying after 5 seconds instead of 10+
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        console.error('Please verify if your IP address is whitelisted in MongoDB Atlas.');
        throw error; // This will crash the server on start, which is what we want for debugging
    }
};

module.exports = connectDB;


