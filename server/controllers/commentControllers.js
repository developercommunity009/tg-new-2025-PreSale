const Comment = require('../models/CommentModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/apiResponse');

// Create a new comment
exports.createComment = catchAsync(async (req, res, next) => {
  const { content, coinId, userId } = req.body;

  if (!userId || !content || !coinId) {
    return next(new AppError('Some require fiwlds are missing', 400));
  }

  const comment = await Comment.create({
    content,
    userId,
    coinId,
  });

  res.status(201).json(new ApiResponse(201, 'Comment created successfully', comment));
});

// Get all comments for a specific coin
exports.getCommentsByCoin = catchAsync(async (req, res, next) => {
  const { coinId } = req.params;

  const comments = await Comment.find({ coinId })
    .populate('userId')
    .populate('replies.user');
    
  if (!comments) {
    return next(new AppError('No comments found for this coin', 404));
  }

  res.status(200).json(new ApiResponse(200, 'Comments fetched successfully', comments));
});

// Add a reply to a comment
exports.addReply = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { content, userId } = req.body;

  if (!userId) {
    return next(new AppError('User ID is required', 400));
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  const reply = {
    user: userId,
    content,
  };

  comment.replies.push(reply);
  await comment.save();

  res.status(201).json(new ApiResponse(201, 'Reply added successfully', comment));
});

// Like or unlike a comment
exports.toggleLike = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(new AppError('User ID is required', 400));
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  const index = comment.likes.indexOf(userId);
  if (index === -1) {
    comment.likes.push(userId); // Like the comment
  } else {
    comment.likes.splice(index, 1); // Unlike the comment
  }

  await comment.save();

  res.status(200).json(new ApiResponse(200, 'Like status updated', comment));
});

// Delete a comment
exports.deleteComment = catchAsync(async (req, res, next) => {
  const { commentId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(new AppError('User ID is required', 400));
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  // Only the owner of the comment can delete it
  if (comment.userId.toString() !== userId.toString()) {
    return next(new AppError('Unauthorized to delete this comment', 403));
  }

  await comment.remove();

  res.status(200).json(new ApiResponse(200, 'Comment deleted successfully'));
});

// Delete a reply
exports.deleteReply = catchAsync(async (req, res, next) => {
  const { commentId, replyId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return next(new AppError('User ID is required', 400));
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    return next(new AppError('Comment not found', 404));
  }

  const replyIndex = comment.replies.findIndex(reply => reply._id.toString() === replyId);
  if (replyIndex === -1) {
    return next(new AppError('Reply not found', 404));
  }

  // Only the owner of the reply can delete it
  if (comment.replies[replyIndex].user.toString() !== userId.toString()) {
    return next(new AppError('Unauthorized to delete this reply', 403));
  }

  comment.replies.splice(replyIndex, 1);
  await comment.save();

  res.status(200).json(new ApiResponse(200, 'Reply deleted successfully'));
});
