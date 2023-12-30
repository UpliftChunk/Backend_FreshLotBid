const RegularErrorHandler = require('../util/RegularErrorHandler');

module.exports = (err, req, res, next)=>{
   // error can be any object
   // for now the error is received as RegularErrorHandler object
   err.statusCode= err.statusCode || 500;
   err.message= err.message || "Internal Server Error";

   // wrong mongodb _id error
   if(err.name==="CastError")
      err = new RegularErrorHandler(`Resource not found. Invalid: ${err.path}`, 400); 
   // mongodb duplicate key(email) error
   if(err.code===11000)
      err = new RegularErrorHandler(`Duplicate ${Object.keys(err.keyValue)} Entered`,400);
   // wrong jwt token error
   if(err.name==="JsonWebTokenError")
      err = new RegularErrorHandler('Json Web Token is invalid, Try again',400);
   // jwt Expire error
   if(err.name==="TokenExpiredError")
      err = new RegularErrorHandler('Json Web Token is expired, Try again',400);

   res.status(err.statusCode).json({
      success: false,
      message: err.message,
      statusCode: err.statusCode,
      error: err.stack
   });
   console.error(err);
}