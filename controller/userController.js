// import model
const User = require("../model/userModel");

// others
const RegularErrorHandler = require("../util/RegularErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require('../util/jwtToken');
const sendEmail = require('../util/sendEmail.js');
const crypto = require('crypto');
const cloudinary = require('cloudinary');


// export controllers

// register a user
exports.registerUser = catchAsyncErrors(async (req, res, next)=>{
   const mycloud =  await cloudinary.v2.uploader.upload(req.files.avatar.tempFilePath,{
         folder: "LotBid/avatars", //avatars
         width: 200,
         crop: 'scale'
   });
   const {name, email, location, password, phoneNumber, role} = req.body;

   const user1 = await User.create({
      name,
      email,
      location,
      password,
      phoneNumber,
      avatar:{
         public_id: mycloud.public_id,
         url: mycloud.secure_url
      },
      role
   });
   
   const user = await User.findOne({ email });
   sendToken(user, 201, "User created successfully", res);
});

// login user
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
   const {email, password} = req.body;
   console.log(email, password);
   // statusCode-400 bad request
   if(!email)
      return next(new RegularErrorHandler("Please enter an email", 400));
   if(!password)
      return next(new RegularErrorHandler("Please enter the password", 400));

   let user = await User.findOne({ email }).select("+password");
   console.log(user);
   // statusCode-401 unauthorized request
   if(!user)
      return next(new RegularErrorHandler("Invalid email or password", 401));
   
   const Matched = await user.comparePassword(password);
   console.log(password, Matched);
   if(!Matched) 
      return next(new RegularErrorHandler("Invalid email or password", 401));
      
   user = await User.findOne({ email });
   
   sendToken(user, 200, "User logged-in successfully", res);
})

// logout user
exports.logout = catchAsyncErrors( async (req, res, next) => {
   res.cookie("token",null,{
      expires: new Date(Date.now()),
      httpOnly: true
   });
   res.status(200).json({
      success: true,
      message: `Logged Out successfully`
   });
})


// get user his own details
exports.getUserDetails = catchAsyncErrors( async(req, res, next) => {
   const user = await User.findById(req.user.id);
   req.user = user;
   res.status(200).json({
      success: true,
      message: "User details retrieved successfully",
      user
   })
})


// ..get single user
exports.getSingleUser = catchAsyncErrors( async(req, res, next) => {
   const user = await User.findById(req.params.id);
   if(!user)
      return next(new RegularErrorHandler(`User does not exist with id ${req.params.id}`)); 
   res.status(200).json({
      success: true,
      message: "User info retrieved successfully",
      user
   })
})

// ..get users with name
exports.getUsers = catchAsyncErrors( async(req, res, next) => {
   const search= req.query.name? {
      name:{
         $regex: req.query.name,
         $options: 'i'
      },
      _id: {
         $nin: [req.user.id]
      },
      role: {
         $ne: `customer`
      }
   }:{}
   const user = await User.find(search, {'name':1, 'location':1, 'dealsClosed':1, 'avatar':1});

   if(user.length === 0)
      return next(new RegularErrorHandler(`No other users found with name ${req.query.name}`)); 

   res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      user
   })
})

// ..add friend connection request with id
exports.addFriendReq = catchAsyncErrors( async(req, res, next) => {
   if(req.user.connectionRequests.sent[req.params.id.toString()])
      return next(new RegularErrorHandler(`Connection request already online`));

   let friendUser = await User.findById(req.params.id);
   if(!friendUser)
      return next(new RegularErrorHandler(`User does not exist with id ${req.params.id}`)); 
   
   const ReceivedRequest= {
      name: req.user.name,
      location: req.user.location,
      reqAt: new Date(),
      avatar: req.user.avatar
   }
   const SentRequest= {
      name: friendUser.name,
      location: friendUser.location,
      reqAt: new Date()
   }
   let user= await User.findById(req.user.id);
   
   friendUser.connectionRequests.received[req.user.id]= ReceivedRequest;
   user.connectionRequests.sent[req.params.id.toString()] = SentRequest;
   
   friendUser.friendRequestsReceived= Object.keys(friendUser.connectionRequests.received).length;

   await User.findByIdAndUpdate(req.params.id, friendUser);
   await User.findByIdAndUpdate(req.user.id, user);

   req.user= user;

   res.status(200).json({
      success: true,
      message: "Friend Request sent successfully",
      user
   })
})

// ..cancel connection request
exports.cancelFriendReq = catchAsyncErrors(async (req, res, next) =>{
   let friendUser = await User.findById(req.params.id);
   if(!friendUser)
      return next(new RegularErrorHandler("User not found",404));

   delete friendUser.connectionRequests.received[req.user.id];
   friendUser.friendRequestsReceived = Object.keys(friendUser.connectionRequests.received).length;

   let user = await User.findById(req.user.id);
   delete user.connectionRequests.sent[req.params.id];

   await User.findByIdAndUpdate(req.params.id, friendUser);
   await User.findByIdAndUpdate(req.user.id, user);

   req.user= user;
   res.status(200).json({
      success: true,
      message: "Friend Request cancelled successfully",
      user
   })
})


// ..update friend connection status 
exports.HandleFriendReq = catchAsyncErrors( async(req, res, next) => {
   let user = await User.findById(req.user.id);
   let friendUser = await User.findById(req.query.id);
   if(!friendUser)
      return next(new RegularErrorHandler("User not found",404));

   delete friendUser.connectionRequests.sent[req.user.id];
   delete user.connectionRequests.received[req.query.id];
   user.friendRequestsReceived = Object.keys(user.connectionRequests.received).length;
   
   // console.log(friendUser.connectionRequests.sent[req.user.id]);
   const accepted = (req.query.status === 'Accepted');

   if(accepted) {
      const host= {
         name: user.name,
         location: user.location,
         avatar: user.avatar
      };
      const friend= {
         name: friendUser.name,
         location: friendUser.location,
         avatar: friendUser.avatar
      };
      friendUser.friends[user.id] =host;
      user.friends[friendUser._id]=friend;
   }
   let ConnectionStatus = req.query.status==='Accepted' ? 'Accepted' : 'Rejected';

   await User.findByIdAndUpdate(req.query.id, friendUser);
   await User.findByIdAndUpdate(req.user.id, user);

   req.user= user;

   res.status(200).json({
      success: true,
      message: `Friend Request ${ConnectionStatus} successfully`,
      user
   })
})

