const AppError = require("../utils/appError");

const handleJWTError = () => {
    return new AppError("Invalid Token, Please Log in again", 401);
}

const handleJWTExpiredError = () => {
    return new AppError("Your Token has expired, please log in again", 401);
}

const handleValidationError = (err) => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid Input Data: ${errors.join(". ")}`;
    return new AppError(message, 400);
}

const handleDuplicateFieldsDB = (err) => {
    const value = err.errmsg.match(/(?<=")(?:\\.|[^"\\])*(?=")/);
    const message = `Duplicate field value: ${value}. Please use another value.`;
    return new AppError(message, 400);
}

const handleCastErrorDB = (err) => {
    const message = `Invalid ${err.path}: ${err.value}`;
    return new AppError(message, 400);
}

const sendErrorDev = (err, res) => {
    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack
    });
}

const sendErrorProd = (err, res) => {
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        res.status(500).json({
            status: "error",
            message: "Something went very wrong!"
        });
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || "error";

    if (process.env.NODE_ENV === "development") {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === "production") {
        let error = { ...err };
        error.message = err.message; // Ensure the message is preserved
        if (error.name === "CastError") error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error);
        if (error.name === "ValidationError") error = handleValidationError(error);
        if (error.name === "JsonWebTokenError") error = handleJWTError();
        if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

        sendErrorProd(error, res);
    }
}
