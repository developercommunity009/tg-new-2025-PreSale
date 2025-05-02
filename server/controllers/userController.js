
const User = require('../models/UserModel'); // Adjust the path as necessary
const catchAsync = require('../utils/catchAsync'); // Adjust the path as necessary
const AppError = require('../utils/appError'); // Adjust the path as necessary
const ApiResponse = require('../utils/apiResponse'); // Adjust the path as necessary
const { emitSocketEvent } = require('../sockets');
const { ethers } = require('ethers');
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../middelwares/email")





// Generate JWT Token
const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRY,
    });
};

// Create & Send Token in Cookies
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id)
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.COOKIES_EXPIRY_DATE * 24 * 60 * 60 * 1000
        ),
        httpOnly: true,
        secure: true
    };

    res.cookie('jwt', token, cookieOptions);
    user.password = undefined; // Hide password in response

    res.status(statusCode).json({
        token,
        user,
    });
};




exports.signUp = catchAsync(async (req, res, next) => {
    const { username, email, country, state_of_province, password } = req.body;

    // Check for required fields
    if (!username || !email || !country || !state_of_province || !password) {
        return next(new AppError("Missing required fields", 400));
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next(new AppError("Email already in use", 400));
    }

    const newUser = await User.create({
        username,
        email,
        country,
        state_of_province,
        password,
    });
    

    // Success response
    res.status(201).json(new ApiResponse(201, { user: newUser }, "User created successfully"));
});

// 📌 Login Controller
exports.login = catchAsync(async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return next(new AppError("Please provide username and password", 400));
    }

    // Find user and explicitly select password
    const user = await User.findOne({ username }).select("+password");
    if (!user) {
        return next(new AppError("Invalid credentials", 401));
    }

    // Compare passwords
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
        return next(new AppError("Invalid password", 401));
    }


    // Send token via cookie and response
    createSendToken(user, 200, res);
});

// 📌 Logout Controller
exports.logout = catchAsync(async (req, res, next) => {
    res.cookie('jwt', '', {
        expires: new Date(0),
        httpOnly: true,
    });

    res.status(200).json(new ApiResponse(200, {}, 'Logout successful'));
});



// =================================================================================================
exports.forgetPassword = catchAsync(async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) {
        return next(new AppError("No user found with this email", 404));
    }

    // Generate Reset Token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetURL = `https://www.mycoinharvest.com/reset-password/${resetToken}`;
    const message = `Hi, please click the link below to reset your password. This link is valid for 10 minutes:\n\n<a href="${resetURL}">Reset Password</a>`;

    try {
        await sendEmail({
            email: user.email,
            subject: "Password Reset Request",
            html: message,
        });


        res.status(200).json({ status: "success", message: "Password reset link sent!" });
    } catch (error) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });

        return next(new AppError("Error sending email. Please try again later.", 500));
    }
});


// ---- RESET PASSWORD  
exports.reSetPassword = catchAsync(async (req, res, next) => {
    // Get user based on the token
    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })

    // If token has not expried , and there is user , set the new password
    if (!user) {
        return next(new AppError("Token is invalid or is Expire", 404))
    }

    // Update changedpassword for the user

    user.password = req.body.password;
    user.confrimPassword = req.body.confrimPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json("password reset success");
    // Log the user in , send JWT
    // createSendToken(user , 200 , res);
})

// ----------  UPDATING PASSWORD   -------------------------------
exports.updatingPassword = catchAsync(async (req, res, next) => {


    // Get user from collection of data
    const user = await User.findById(req.user.id).select("+password");
    // Check if the Posted current password is correct
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
        return next(new AppError("Your current Password is Wrong ", 402));
    }
    // if So< Update The Password
    user.password = req.body.password;
    user.confrimPassword = req.body.confrimPassword;
    await user.save();
    // Log user after password change
    createSendToken(user, 203, res);
})


exports.addWalletAddress = catchAsync(async (req, res, next) => {
    const { walletAddress } = req.body;
    const userId = req.user.id; // Assuming `req.user` contains the authenticated user ID

    // Check if wallet address is provided
    if (!walletAddress) {
        return next(new AppError("Wallet address is required", 400));
    }

    // Find the user by ID
    const user = await User.findById(userId);
    if (!user) {
        return next(new AppError("User not found", 404));
    }

    // Check if wallet address already exists
    if (user.wallet.includes(walletAddress)) {
        return res.status(200).json(new ApiResponse(200, user, "Wallet address already exists"));
    }

    // Add the new wallet address to the array
    user.wallet.push(walletAddress);
    await user.save();

    // Success response
    res.status(200).json(new ApiResponse(200, user, "Wallet address added successfully"));
});






// Get user by ID
exports.getUserById = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id)
    if (!user) {
        return next(new AppError('User not found', 305));
    }

    res.status(200).json(new ApiResponse(200, user, 'User retrieved successfully'));
});

// Update user
exports.updateUser = catchAsync(async (req, res, next) => {
    const { username, bio, profilePicture } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    user.username = username || user.username;
    user.bio = bio || user.bio;
    user.profilePicture = profilePicture || user.profilePicture;

    await user.save();

    res.status(200).json(new ApiResponse(200, { user }, 'User updated successfully'));
});

// Delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    await user.remove();

    res.status(204).json(new ApiResponse(204, null, 'User deleted successfully'));
});


// Update profile picture
exports.updateprofileimagebyuserId = catchAsync(async (req, res, next) => {
    const { userId } = req.body;
    // Find the user by wallet
    const user = await User.findOne({ _id:userId });

    if (!user) {
        return next(new AppError('User not found with this wallet', 404));
    }

    // Check if the image data is present in the request
    if (!req.body.image) {
        return next(new AppError('No image uploaded', 400));
    }

    // Update the user's profile picture with the Cloudinary URL
    user.profilePicture = req.body.image.url;

    await user.save();

    res.status(200).json(new ApiResponse(200, user, 'Profile image updated successfully'));
});
