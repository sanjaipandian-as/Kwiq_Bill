const mongoose = require('mongoose');
require('dotenv').config();

const listUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const User = require('./src/models/userModel');

        const allUsers = await User.find();
        console.log(`Found ${allUsers.length} users:`);

        allUsers.forEach((u, i) => {
            console.log(`\n[${i + 1}] Email: ${u.email}`);
            console.log(`    Name: ${u.name}`);
            console.log(`    ID: ${u._id}`);
            console.log(`    Created: ${u.createdAt}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

listUsers();
