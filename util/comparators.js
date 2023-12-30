exports.lotBidsComparator = (Bid1, Bid2, bidLockedUser)=>{
   if(bidLockedUser && Bid1[bidLockedUser]) return -1;
   if(bidLockedUser && Bid2[bidLockedUser]) return  1;

   let price1 = 0;
   Bid1.users.forEach((user)=> price1 += +Bid1[user].price);
   let price2 = 0;
   Bid2.users.forEach((user)=> price2 += +Bid2[user].price);
   if(price1 < price2) return -1;
   else if(price1 > price2) return 1;
   return 0;
} 
