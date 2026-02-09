const mongoose = require('mongoose');
const User = require('./src/models/userModel');
const dotenv = require('dotenv');

dotenv.config();

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const email = 'admin@example.com';
        const userExists = await User.findOne({ email });

        if (userExists) {
            console.log('User already exists');
        } else {
            // Password hashing is handled by pre-save hook in userModel
            await User.create({
                name: 'Admin User',
                email: email,
                password: 'password',
                role: 'admin'
            });
            console.log('Admin user created successfully');
        }

        process.exit();
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

seedUser();
