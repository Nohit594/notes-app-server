const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection (Cached for Serverless)
let cachedDb = null;

const connectDB = async () => {
    if (cachedDb) {
        console.log('Using cached MongoDB connection');
        return cachedDb;
    }

    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            serverSelectionTimeoutMS: 5000 // Fail fast if no connection
        });
        console.log('MongoDB connected successfully (New Connection)');
        cachedDb = conn;
        return conn;
    } catch (err) {
        console.error('MongoDB connection error:', err);
        throw err;
    }
};

// Connect immediately (for local dev) but also await in routes if needed (for lambda safety)
connectDB();

// Middleware to ensure DB is connected before handling requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        res.status(500).json({ msg: 'Database Connection Failed', error: err.message });
    }
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/compiler', require('./routes/compiler'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => {
    res.send('Notes App API Running');
});

// For Vercel, we need to export the app
// Only listen if run directly (local dev)
if (require.main === module) {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
