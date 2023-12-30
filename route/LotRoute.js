const express= require('express');
const router = express.Router();

// controllers
const { getAllLots, getLotDetails, getCustomerLots, createLot, getOpenLots} = require('../controller/LotController');
const { acceptBidReq, createLotBid, makePayment } = require('../controller/HybridController');

// auth
const { isAuthenticatedUser, authorizeRoles } = require('../middleware/isAuth');

// farmers
router.route('/lots').get(getAllLots);
router.route('/lots/open').get(getOpenLots);
router.route('/lot/:id').get(getLotDetails);
router.route('/lot/bid')
   .post(isAuthenticatedUser, authorizeRoles("farmer"), createLotBid);

router.route('/lot/Acceptbidrequest').post(isAuthenticatedUser, acceptBidReq);

// customer
router.route('/customer/lots').get(isAuthenticatedUser, authorizeRoles("customer"), getCustomerLots);
router.route('/customer/lot/new')
   .post(isAuthenticatedUser, authorizeRoles("customer"), createLot);
router.route('/customer/lot/payment')
   .post(isAuthenticatedUser, authorizeRoles("customer"), makePayment);

module.exports= router;