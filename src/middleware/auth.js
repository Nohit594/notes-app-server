const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        // Check if user exists and is not suspended
        // Note: Ideally we should use the User model here, but circular dependency might be an issue if User requires auth?
        // Let's require User model inside the function to be safe or at top level if fine.
        // User model doesn't require auth middleware so it's fine.

        // We will do a lightweight check.
        // Importing User model at top level
        const User = require('../models/User');
        const user = await User.findById(decoded.userId).select('isSuspended isAdmin');

        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }

        if (user.isSuspended) {
            return res.status(403).json({ message: 'Account Suspended' });
        }

        // Update req.user with latest roles in case they changed
        req.user.isAdmin = user.isAdmin;
        req.user.isSuspended = user.isSuspended;

        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
