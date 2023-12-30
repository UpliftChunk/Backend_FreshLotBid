// import models
const User = require("../model/userModel");
const Lot = require('../model/lotModel');

// others
const RegularErrorHandler = require('../util/RegularErrorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');

// export controllers

// ..create new bid or update lot's bid - FARMER
exports.createLotBid = catchAsyncErrors(async (req, res, next)=>{
   const {price, description, lotId} = req.body;
   let bidUser= req.user._id;

   if(req.user.bidRequests?.sent?.[lotId] || req.user.bidRequests?.received?.[lotId])
      return next(new RegularErrorHandler(`Please cancel currently online Bid Requests for this lot`));

   const receivedBid = {
      name: req.user.name,
      price: Number(price),
      description,
      location: req.user.location,
      phoneNumber: req.user.phoneNumber
   }

   const lot = await Lot.findById(lotId);
   const existingBid = lot.bids.find(r => r[bidUser] !== undefined);
   if(existingBid){
      lot.bids.find(r => {
         if(r[bidUser] !== undefined)
            {r[bidUser]= receivedBid}
      });
   }
   else{
      let entireBid = {
         type: 'SoloBid',
         users: [bidUser]
      }
      entireBid[bidUser] = receivedBid;
      lot.bids.push(entireBid);
      lot.numOfBids= lot.bids.length;
   }
   await lot.save({validateBeforeSave: false});

   const user = await User.findById(req.user.id);

   const bid= {
      price: price,
      quantity: lot.quantity,
      vegiName: lot.vegi_name,
      image: lot.image
   }

   user.bids[lotId]= bid;
   req.user = user;
   await User.findByIdAndUpdate(req.user.id, user);
   res.status(200).json({
      success: true,
      message: "Lot's Bid saved successfully",
      user
   })
})

// ..add bid request 
exports.addBidReq = catchAsyncErrors( async(req, res, next) => {
   const friendUser = await User.findById(req.body.friendid);
   const user = await User.findById(req.user.id);
   if(!friendUser)
      return next(new RegularErrorHandler(`User does not exist with id ${req.body.friendid}`)); 
   if(friendUser.bids[req.body.lotID]!== undefined) 
      return next(new RegularErrorHandler(`Your friend '${friendUser.name}' already has an active bid for this lot`));
   if(friendUser.bidRequests.received[req.body.lotID]!== undefined) 
      return next(new RegularErrorHandler(`User already has bid request for this lot`));
   
      const lot = await Lot.findById(req.body.lotID);
      const totalQuantity= lot.quantity;

   const sentRequest= {
      friendUser: req.body.friendid,
      vegiName: lot.vegi_name, 
      contribution:{
         price: req.body.price,
         quantity: req.body.quantity,
         description: req.body.description
      },
      totalQuantity: totalQuantity,
      reqAt: new Date()
   }
   const receivedRequest= {
      friendUser: req.user.id,
      vegiName: lot.vegi_name, 
      contribution:{ 
         price: req.body.price,
         quantity: req.body.quantity,
         description: req.body.description
      },
      totalQuantity: totalQuantity,
      reqAt: new Date()
   }
   friendUser.bidRequests.received[req.body.lotID] = receivedRequest;
   user.bidRequests.sent[req.body.lotID] = sentRequest;

   await User.findByIdAndUpdate(req.body.friendid, friendUser);
   await User.findByIdAndUpdate(req.user.id, user);

   console.log(user);
   req.user= user;

   res.status(200).json({
      success: true,
      message: "Bid Request sent successfully",
      user
   })
})
// ..cancel bid request 
exports.cancelBidReq = catchAsyncErrors( async(req, res, next) => {
   const lotID = req.params.lotID;
   const user = await User.findById(req.user.id).select("+password");
   const friendid= user.bidRequests.sent[lotID].friendUser;
   const friendUser = await User.findById(friendid).select("+password");
   
   delete friendUser.bidRequests.received[lotID];
   delete user.bidRequests.sent[lotID];

   await User.findByIdAndUpdate(friendid, friendUser);
   await User.findByIdAndUpdate(req.user.id, user);

   console.log(user);
   req.user= user;

   res.status(200).json({
      success: true,
      message: "Bid Cancelled successfully",
      user
   })
})

// ..reject bid request 
exports.rejectBidReq = catchAsyncErrors( async(req, res, next) => {
   let friendUser = await User.findById(req.body.friendid).select("+password");;
   let user       = await User.findById(req.user.id).select("+password");;
   if(!friendUser)
      return next(new RegularErrorHandler(`User does not exist with id ${req.body.friendid}`)); 
   
   delete friendUser.bidRequests.sent[req.body.lotID];
   delete user.bidRequests.received[req.body.lotID];


   await User.findOneAndReplace({_id: friendUser.id}, friendUser);
   await User.findOneAndReplace({_id: user.id}, user);
   
   req.user= user;

   res.status(200).json({
      success: true,
      message: "Bid Request rejected successfully",
      user
   })
})

// ..accept bid request 
exports.acceptBidReq = catchAsyncErrors( async(req, res, next) => {
   const friendUser = await User.findById(req.body.friendid).select("+password");
   const user = await User.findById(req.user.id).select("+password");
   if(!friendUser)
      return next(new RegularErrorHandler(`User does not exist with id ${req.body.friendid}`)); 
   
   // added bid into bids list of Frienduser
   friendUser.bids[req.body.lotID] =friendUser.bidRequests.sent[req.body.lotID].contribution ;
   friendUser.bids[req.body.lotID]["partner"] = req.user.id;

   // add bid into bids list of current user
   let bid= {price: req.body.price};
   bid["quantity"] =user.bidRequests.received[req.body.lotID].totalQuantity 
                     - user.bidRequests.received[req.body.lotID].contribution.quantity;
   bid["partner"] = req.body.friendid;
   bid["description"]= req.body.description;
   
   user.bids[req.body.lotID] = bid;


   // ADD BID TO LOT
   let entireBid ={
    type : 'PartnerBid',
    users:  [user.id, friendUser.id]
   }
   entireBid[user.id]={
      name: user.name,
      price: req.body.price,
      description: req.body.description,
      location: user.location,
      phoneNumber: user.phoneNumber,
   }
   entireBid[friendUser.id]= {
      name: friendUser.name,
      price: friendUser.bidRequests.sent[req.body.lotID].contribution.price,
      description: friendUser.bidRequests.sent[req.body.lotID].contribution.description,
      location: friendUser.location,
      phoneNumber: friendUser.phoneNumber,
   }

   const lot = await Lot.findById(req.body.lotID);
   lot.bids.push(entireBid);
   lot.numOfBids= lot.bids.length;
   await lot.save({validateBeforeSave: false});
   
   user.bids[req.body.lotID].image= lot.image;
   friendUser.bids[req.body.lotID].image= lot.image;
   user.bids[req.body.lotID].vegiName= lot.vegi_name;
   friendUser.bids[req.body.lotID].vegiName= lot.vegi_name;

   
   // UPDATED USERS
   delete friendUser.bidRequests.sent[req.body.lotID];
   delete user.bidRequests.received[req.body.lotID];

   await User.findOneAndReplace({_id: friendUser.id}, friendUser);
   await User.findOneAndReplace({_id: user.id}, user);
   
   
   req.user= user;
   
   res.status(200).json({
      success: true,
      message: "Bid Request ACCEPTED successfully",
      user
   })
})

// ..make payment request 
exports.makePayment = catchAsyncErrors( async(req, res, next) => {
   let {price, lotID, users} = req.body;
   let customer   = await User.findById(req.user.id);

   let customerDeal= {
      users: users,
      names: [],
      price: price
   }
   users.forEach(async(id) =>{
      let user = await User.findById(id);
      customerDeal.names.push(user.name);
      
      let deal= user.bids[lotID];
      user.deals[lotID]=deal;
      user.dealsClosed = Object.entries(user.deals).length;
      await User.findByIdAndUpdate(id, user);
   });

   const lot = await Lot.findById(req.body.lotID);
   lot.open= false;
   lot.bidLockedUser= users[0];
   await lot.save({validateBeforeSave: false});

   customerDeal.image= lot.image;
   customerDeal.vegiName= lot.vegi_name;
   customerDeal.quantity= lot.quantity;
   
   customer.deals[lotID]= customerDeal;
   customer.dealsClosed= Object.entries(customer.deals).length;

   console.log(customerDeal);
   await User.findByIdAndUpdate(req.user.id, customer);
   req.user= customer;

   res.status(200).json({
      success: true,
      message: "Deal made successfully",
      customer
   })
})