const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define the Comment schema
const commentSchema = new Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  coinId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Coin', // Reference to the Coin model
    required: true,
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Users who liked the comment
  }],
  replies: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      content: {
        type: String,
        required: true
      },
      likes: {
        type: Number,
        default: 0
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Middleware to update the `updatedAt` field for both comments and replies
commentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  if (this.isModified('replies')) {
    this.replies.forEach(reply => {
      reply.updatedAt = Date.now();
    });
  }
  next();
});

// Create the Comment model
const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
