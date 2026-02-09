const mongoose = require('mongoose');
require('dotenv').config();

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const Settings = require('./src/models/settingsModel');
        const Customer = require('./src/models/customerModel');

        const latestSettings = await Settings.find().sort({ updatedAt: -1 }).limit(1);
        console.log('\n--- Latest Settings ---');
        if (latestSettings.length > 0) {
            console.log(JSON.stringify(latestSettings[0], null, 2));
        } else {
            console.log('No settings found.');
        }

        const latestCustomers = await Customer.find().sort({ createdAt: -1 }).limit(1);
        console.log('\n--- Latest Customer ---');
        if (latestCustomers.length > 0) {
            console.log(JSON.stringify(latestCustomers[0], null, 2));
        } else {
            console.log('No customers found.');
        }

        await mongoose.connection.close();
        console.log('\n✅ Connection closed');
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

checkData();
