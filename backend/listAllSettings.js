const mongoose = require('mongoose');
require('dotenv').config();

const listAll = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const Settings = require('./src/models/settingsModel');
        const User = require('./src/models/userModel');

        const allSettings = await Settings.find().populate('userId', 'email name');
        console.log(`Found ${allSettings.length} settings records:`);

        allSettings.forEach((s, i) => {
            console.log(`\n[${i + 1}] User: ${s.userId?.email || 'Unknown'}`);
            console.log(`    User ID: ${s.userId?._id || 'N/A'}`);
            console.log(`    Store Name: ${s.store?.name || 'N/A'}`);
            console.log(`    Legal Name: ${s.store?.legalName || 'N/A'}`);
            console.log(`    Onboarding Complete: ${s.onboardingCompletedAt || 'No'}`);
            console.log(`    Last Updated: ${s.updatedAt}`);
        });

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
};

listAll();
