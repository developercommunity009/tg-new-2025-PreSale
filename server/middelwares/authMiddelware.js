
const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');



// Middleware to verify JWT token
exports.protect = (req, res, next) => {
    
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return next(new AppError('Not authenticated', 401));
    }
  
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(req.user)
        next();
    } catch (err) {
        return next(new AppError('Invalid token', 401));
    }
};

// Middleware to check admin role
exports.checkAdmin = (req, res, next) => {
    if (req.user?.role !== 'Admin') {
        return next(new AppError('Access denied. Only admin can perform this action', 403));
    }
    next();
};

