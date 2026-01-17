const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const checkAdmin = async () => {
    const email = 'nohitsinghchouhan594@gmail.com';

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 MongoDB Connected');

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ User not found.`);
        } else {
            console.log('--------------------------------------------------');
            console.log(`👤 User: ${user.username}`);
            console.log(`📧 Email: ${user.email}`);
            console.log(`🛡️ isAdmin: ${user.isAdmin}`);
            console.log(`⛔ isSuspended: ${user.isSuspended}`);
            console.log('--------------------------------------------------');
        }

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

checkAdmin();
