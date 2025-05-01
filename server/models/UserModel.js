const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Define the User Schema with timestamps
const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true, // Ensures no duplicate emails
      lowercase: true, // Ensures consistent case
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    username: {
      type: String,
      trim: true,
      minlength: 3,
    },
    wallet: [{
      type: String,
      unique: true,  // Remove this if it exists
  }],  
    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },
    country: {
      type: String,
    },
    state_of_province: {
      type: String,
    },
    profilePicture: {
      type: String,
      default: "",
    },
    transactions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Transaction",
      },
    ],
    coin_held: [
      {
        coin: {
          type: Schema.Types.ObjectId,
          ref: "Coin",
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 0,
          min: 0, // Ensures quantity is non-negative
        },
      },
    ],
    replies: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    notifications: [
      {
        type: Schema.Types.ObjectId,
        ref: "Notification", // Changed reference to Notification model
      },
    ],
    createdCoin: [
      {
        type: Schema.Types.ObjectId,
        ref: "Coin",
      },
    ],
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likeReceived: [
      {
        type: Schema.Types.ObjectId,
        ref: "Comment",
      },
    ],
    mentionsReceived: [
      {
        type: Schema.Types.ObjectId,
        ref: "Notification", // Changed reference to Notification model
      },
    ],
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = this.isNew ? undefined : Date.now() - 1000;
  }
  next();
});

// Compare passwords
UserSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// Check if password changed after token was issued
UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Generate password reset token
UserSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

  return resetToken; // Send unhashed token via email
};

module.exports = mongoose.model("User", UserSchema);



// const mongoose = require('mongoose');
// const Schema = mongoose.Schema;
// const bcrypt = require("bcryptjs");
// const crypto = require("crypto");

// // Define the User Schema with timestamps
// const UserSchema = new Schema({
  
//     email: {
//         type: String,
//         required: true,
//         unique: true
//     },
//     password: {
//         type: String,
//         required: true,
//     },
//     role: {
//         type: String,
//         enum: ["admin", "user"], 
//         default: "user", 
//         required: true,
//     },
//     username: {
//         type: String,
//         trim: true,
//         minlength: 3
//     },
//     wallet: [{
//         type: String,
//     }],
//     bio: {
//         type: String,
//         maxlength: 160, 
//         default: ''
//     },
//     country: {
//         type: String,
//     },
//     state_of_province: {
//         type: String,
//     },
//     profilePicture: {
//         type: String,
//         default: ''  
//     },
//     transactions: [{
//         type: Schema.Types.ObjectId,
//         ref: 'Transaction'
//     }],
//     coin_held: [{
//         coin: {
//             type: Schema.Types.ObjectId,
//             ref: 'Coin',
//             required: true
//         },
//         quantity: {
//             type: Number,
//             required: true,
//             default: 0,
//             min: 0  // Ensure quantity is non-negative
//         }
//     }],
//     replies: [{
//         type: Schema.Types.ObjectId,
//         ref: 'Comment'
//     }],
//     notifications: [{
//         type: Schema.Types.ObjectId,
//         ref: 'Comment'   // Neend to verifyc
//     }],
//     createdCoin: [{
//         type: Schema.Types.ObjectId, 
//         ref: 'Coin'
//     }],
//     followers: [{
//         type: Schema.Types.ObjectId, 
//         ref: 'User'
//     }],
//     following: [{
//         type: Schema.Types.ObjectId,
//         ref: 'User'
//     }],
//     likeReceived: [{
//         type: Schema.Types.ObjectId, 
//          ref: 'Comment'
//     }],
//     mentionsReceived: [{
//         type: Schema.Types.ObjectId, 
//          ref: 'Comment'    // Neend to verify
//     }],
//     passwordChangedAt: Date,
//     passwordResetToken: String,
//     passwordResetExpires: Date,
// }, { timestamps: true });

// // Hash password before saving
// UserSchema.pre("save", async function (next) {
//     if (!this.isModified("password")) return next();
//     this.password = await bcrypt.hash(this.password, 12);
//     next();
// });

// // Set passwordChangedAt when password is modified
// UserSchema.pre("save", function (next) {
//     if (!this.isModified("password") || this.isNew) return next();
//     this.passwordChangedAt = Date.now() - 1000;
//     next();
// });

// // Compare passwords
// UserSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
//     return await bcrypt.compare(candidatePassword, userPassword);
// };

// // Check if password changed after token was issued
// UserSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
//     if (this.passwordChangedAt) {
//         const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
//         return JWTTimestamp < changedTimestamp;
//     }
//     return false;
// };

// // Generate password reset token
// UserSchema.methods.createPasswordResetToken = function () {
//     const resetToken = crypto.randomBytes(32).toString("hex");

//     this.passwordResetToken = crypto.createHash("sha256").update(resetToken).digest("hex");
//     this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token expires in 10 minutes

//     return resetToken; // Send unhashed token via email
// };

// module.exports = mongoose.model('User', UserSchema);
