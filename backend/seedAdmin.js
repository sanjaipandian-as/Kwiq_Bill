const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/userModel');

dotenv.config();

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const userExists = await User.findOne({ email: 'admin@example.com' });

        if (userExists) {
            console.log('Admin user already exists');
            // Reset password to be sure
            userExists.password = '123456';
            await userExists.save();
            console.log('Admin password reset to 123456');
        } else {
            const user = await User.create({
                name: 'Admin User',
                email: 'admin@example.com',
                password: '123456',
                role: 'admin'
            });
            console.log('Admin user created');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

seedUser();
