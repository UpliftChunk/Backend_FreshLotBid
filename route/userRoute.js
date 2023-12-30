const express = require('express');
const router = express.Router();

const {registerUser, loginUser, logout, getUserDetails, getSingleUser, getUsers, addFriendReq, cancelFriendReq, HandleFriendReq} = require('../controller/userController.js');
const { addBidReq, rejectBidReq, cancelBidReq } = require('../controller/HybridController.js');

const {isAuthenticatedUser} = require('../middleware/isAuth');

router.route('/me').get(isAuthenticatedUser, getUserDetails);
router.route('/register').post(registerUser);
router.route('/login').post(loginUser);
router.route('/logout').get(logout);
router.route('/customer/:id').get(getSingleUser);

router.route('/users').get(isAuthenticatedUser, getUsers);
router.route('/users/add/:id').get(isAuthenticatedUser, addFriendReq);
router.route('/users/cancel/:id').get(isAuthenticatedUser, cancelFriendReq);
router.route('/users/connection').get(isAuthenticatedUser, HandleFriendReq);

router.route('/users/addbidrequest').post(isAuthenticatedUser, addBidReq);
router.route('/users/cancelbidrequest/:lotID').get(isAuthenticatedUser, cancelBidReq);
router.route('/users/rejectbidrequest').post(isAuthenticatedUser, rejectBidReq);

module.exports= router;
// router.route('/password/forgot').post(forgetPassword);
// router.route('/password/reset/:token').put(resetPassword);
// router.route('/password/update').put(isAuthenticatedUser, updatePassword);
// router.route('/me/update').put(isAuthenticatedUser, updateProfile);