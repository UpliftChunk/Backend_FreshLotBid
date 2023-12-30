// version 2 cloudinary
const cloudinary = require('cloudinary').v2;
const multer = require('multer');   
const {CloudinaryStorage} = require("multer-storage-cloudinary");


// ..cloudinary Config
cloudinary.config({
   cloud_name: process.env.CLOUDINARY_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret:process.env.CLOUDINARY_API_SECRET
})

// configure cloudinary storage
let cldStorage= new CloudinaryStorage({
   cloudinary: cloudinary, 
   params:{
      folder: "LotBid",
      public_id: (request, file)=> file.fieldname+'-'+Date.now(),
      // url: mycloud.secure_url
   }
})

//configure multer 
let multerObj= multer({storage:cldStorage})

module.exports= multerObj;