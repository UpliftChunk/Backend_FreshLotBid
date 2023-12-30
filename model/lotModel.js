const mongoose = require('mongoose');

const lotSchema = new mongoose.Schema({
   vegi_name : {
      type: String,
      required: [true,"Please enter Vegetable Name"],
      // required: true,
      trim: true
   },
   description : {
      type: String,
      required: [true,"Please enter Lot Description"]
   },
   image : {
         type: String
   },
   quantity : {
      type: Number,
      default: 5
   },
   numOfBids : {
      type: Number,
      default: 0
   },
   bids : [
      {
         type: Object,
         default: {},
         required: true,
         // type: enum: ['single', 'partners']
         // users: [],
         // user_id1: {
            // name:{
            //    type: String,
            //    required: true
            // },
            // price:{
            //    type: Number,
            //    required: true
            // },
            // description:{
            //    type: String
            // },
            // location:{
            //    type: String,
            //    required: true
            // },
            // phoneNumber:{
            //    type: Number, 
            //    required: true
            // }
      }
   ],
   open: {
      type: Boolean,
      required: true,
      default: true
   },
   user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
   },
   bidLockedUser: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
   },
   createdAt : {
      type:Date,
      default: Date.now
   }
});

module.exports = mongoose.model('Lot', lotSchema);