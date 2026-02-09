const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '.env') });

const checkData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const db = mongoose.connection.db;
        const collection = db.collection('companyprofiles');

        const count = await collection.countDocuments();
        console.log(`Found ${count} records in 'companyprofiles'`);

        const records = await collection.find({ $or: [{ onboardingCompletedAt: { $exists: true } }, { "store.name": { $ne: "My Billing Co." } }] }).toArray();

        if (records.length > 0) {
            console.log(`\nFound ${records.length} records with data:`);
            records.forEach(r => {
                console.log(`- User: ${r.userEmail} (${r.userId}) | Completed: ${r.onboardingCompletedAt ? 'YES' : 'NO'}`);
                if (r.onboardingCompletedAt) {
                    console.log(JSON.stringify(r, null, 2));
                }
            });
        } else {
            console.log('No completed profiles found in DB.');
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err.message);
    }
};

checkData();
