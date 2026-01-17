const mongoose = require('mongoose');
const User = require('./src/models/User');
const dotenv = require('dotenv');

dotenv.config();

const seedUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        const demoUser = {
            username: 'DemoStudent',
            email: 'demo@student.com',
            password: 'password123'
        };

        // Check if exists
        const existingUser = await User.findOne({ email: demoUser.email });
        if (existingUser) {
            console.log('Demo user already exists.');
        } else {
            const user = new User(demoUser); // User model has pre-save hook to hash password
            await user.save();
            console.log('Demo user created successfully.');
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error seeding user:', error);
        process.exit(1);
    }
};

seedUser();
