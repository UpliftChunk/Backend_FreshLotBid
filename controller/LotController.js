// import models
const Lot = require('../model/lotModel');

// others
const RegularErrorHandler = require('../util/RegularErrorHandler');
const catchAsyncErrors = require('../middleware/catchAsyncErrors');
const { lotBidsComparator } = require('../util/comparators');

// export controllers

// ..Get All lots - Farmer
exports.getAllLots = catchAsyncErrors(async (req, res, next)=>{
   // return next(new RegularErrorHandler("This is my Temp error", 500));
   const lots = await Lot.find();
   res.status(200).json({
      success: true,
      message: "all lots info retrieved successfully",
      lots
   })
})
// ..Get Open lots - Farmer
exports.getOpenLots = catchAsyncErrors(async (req, res, next)=>{
   // return next(new RegularErrorHandler("This is my Temp error", 500));
   const lots = await Lot.find({open: true});
   res.status(200).json({
      success: true,
      message: "all Open lots info retrieved successfully",
      lots
   })
})

// ..create lot - CUSTOMER
exports.createLot = catchAsyncErrors(async (req, res, next)=>{
   req.body.user = req.user.id;
   const lot = await Lot.create(req.body);
   res.status(201).json({
      success: true,
      message: 'Lot created successfully', 
      lot
   })
})
// ..get customer lot details
exports.getCustomerLots = catchAsyncErrors(async (req, res, next)=>{
   let lots = await Lot.find({user: req.user.id});
   if(!lots) 
      {return next(new RegularErrorHandler("No Lots found",404));}
   res.status(200).json({
      success: true,
      lots
   })
})

// ..get lot details
exports.getLotDetails = catchAsyncErrors(async (req, res, next)=>{
   let lot = await Lot.findById(req.params.id);
   if(!lot) 
      {return next(new RegularErrorHandler("Lot not found",404));}
   
   if(lot.bidLockedUser) lot.bids.sort((a,b)=>lotBidsComparator(a,b, lot.bidLockedUser.toString()));
   else lot.bids.sort((a,b)=>lotBidsComparator(a,b,'')); 

   res.status(200).json({
      success: true,
      lot
   })
})


// ..get all bids of a lot
exports.getLotBids = catchAsyncErrors(async (req, res, next) =>{
   const lot = await Lot.findById(req.params.LotId);
   if(!lot)
      return next(new RegularErrorHandler("Lot not found",404));
   res.status(200).json({
      success: true,
      message: "Lot Bids retrieved successfully",
      bids: lot.bids,
   })
})
