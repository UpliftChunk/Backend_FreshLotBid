const app = require('./app');

// ..CONFIG
const dotenv = require('dotenv');
dotenv.config({path:'./config/config.env'});

// connect database
const connectDatabase = require('./config/database');
connectDatabase();

// ..cloudinary Config
const cloudinary = require('cloudinary');
cloudinary.config({
   cloud_name: process.env.CLOUDINARY_NAME,
   api_key: process.env.CLOUDINARY_API_KEY,
   api_secret:process.env.CLOUDINARY_API_SECRET
})

app.listen(process.env.PORT, () => {
   console.log(`server is working on port http://localhost:${process.env.PORT}`);
})

// ..unhandled Promise Rejection
process.on('unhandledRejection',(err)=>{
   console.log(`Error: ${err.message}`);
   console.log(`Shutting down server due to Unhandled Promise Rejection`);
   server.close(()=> {process.exit(1);} )
})
// ..handling invalid paths
app.use("*", (req, res, next) => {
   res.send({message:'this is not a valid path'});
})