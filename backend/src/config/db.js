const mongoose = require('mongoose');
const User = require('../models/userModel');

const fs = require('fs');
const path = require('path');

const connectDB = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('\n❌ MongoDB Connection Error!');
        console.error(`Error Details: ${error.message}`);
        console.error('\nThis usually happens because:');
        console.error('1. Your current IP address is NOT whitelisted in MongoDB Atlas.');
        console.error('2. You are on a network (like a school or office) that blocks Port 27017.');
        console.error('\nAction Required:');
        console.error('1. Go to: https://cloud.mongodb.com/');
        console.error('2. In your project, go to "Network Access"');
        console.error('3. Click "Add IP Address" -> "Add Current IP Address"');
        console.error('4. If already there, try adding "0.0.0.0/0" temporarily to test.');
        throw error;
    }
};

module.exports = connectDB;


