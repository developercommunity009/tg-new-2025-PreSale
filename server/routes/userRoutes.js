const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { uploadAndProcessImage } = require('../middelwares/imageUploder');
const { protect } = require('../middelwares/authMiddelware');



router.post('/sendmail', userController.forgetPassword);
router.patch('/resetpassword/:token', userController.reSetPassword);
router.post('/signup', userController.signUp);
router.post('/login', userController.login);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);
router.post('/add-wallet', protect, userController.addWalletAddress);
router.patch('/updateprofileimagebyuserid', uploadAndProcessImage, userController.updateprofileimagebyuserId);


module.exports = router;
