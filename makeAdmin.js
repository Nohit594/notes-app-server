const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const makeAdmin = async () => {
    const email = process.argv[2];

    if (!email) {
        console.log('Usage: node makeAdmin.js <email_of_user_to_promote>');
        process.exit(1);
    }

    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('🔌 MongoDB Connected');

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ User with email "${email}" not found.`);
            process.exit(1);
        }

        if (user.isAdmin) {
            console.log(`ℹ️  User ${user.username} is already an Admin.`);
            process.exit(0);
        }

        user.isAdmin = true;
        await user.save();

        console.log(`✅ Success! User "${user.username}" (${user.email}) is now an Admin.`);
        console.log('👉 Please logout and login again to see the Admin Panel.');

        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
};

makeAdmin();
