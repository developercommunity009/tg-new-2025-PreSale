const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentControllers');


// Define routes with the corresponding controller methods
router.post('/', commentController.createComment);
router.get('/:coinId', commentController.getCommentsByCoin);
router.post('/:commentId/reply',  commentController.addReply);
router.put('/:commentId/like',  commentController.toggleLike);
router.delete('/:commentId',  commentController.deleteComment);
router.delete('/:commentId/reply/:replyId',  commentController.deleteReply);

module.exports = router;


                    