const mongoose = require('mongoose');

const connectDatabase = () =>{
   mongoose.connect(process.env.DB_URI)
   .then((data) => {
      console.log(`Mongodb connected with server: ${data.connection.host}`);
   }).catch((error) => {
      console.log(`Mongodb error is ${error.message}`);
   })
}

module.exports = connectDatabase;